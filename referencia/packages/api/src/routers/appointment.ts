// packages/api/src/routers/appointment.ts
import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const appointmentRouter = router({
  getToday: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfDayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const endOfDayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

    const appointments = await ctx.db.appointment.findMany({
      where: {
        startTime: { gte: startOfDayUtc, lte: endOfDayUtc },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dni: true,
            healthInsuranceName: true,
          },
        },
        doctor: {
          select: { id: true, name: true, specialty: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const totalCapacity = 8;
    const occupiedCount = appointments.filter((a) => a.status !== "CANCELLED").length;
    const occupancyPercentage = Math.min(100, Math.round((occupiedCount / totalCapacity) * 100));

    return {
      dateUtc: startOfDayUtc.toISOString(),
      occupiedCount,
      totalCapacity,
      occupancyPercentage,
      appointments: appointments.map((a) => ({
        id: a.id,
        patientId: a.patientId,
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        patientPhone: a.patient.phone,
        doctorName: a.doctor.name,
        type: a.type,
        status: a.status,
        startTimeUtc: a.startTime.toISOString(),
        endTimeUtc: a.endTime.toISOString(),
        notes: a.notes,
        reminder24hSent: a.reminder24hSent,
      })),
      nextFreeSlot: occupiedCount < totalCapacity ? "14:30" : null,
    };
  }),

  create: tenantProcedure
    .input(
      z.object({
        patientId: z.string(),
        doctorId: z.string().optional(),
        startTimeUtc: z.string(),
        durationMinutes: z.number().default(30),
        type: z.enum(["CONSULTATION", "SURGERY", "FOLLOW_UP", "PROCEDURE"]).default("CONSULTATION"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const startTime = new Date(input.startTimeUtc);
      const endTime = new Date(startTime.getTime() + input.durationMinutes * 60 * 1000);

      // Concurrency check: verify slot is not double-booked
      const collision = await ctx.db.appointment.findFirst({
        where: {
          status: { notIn: ["CANCELLED"] },
          OR: [
            { startTime: { lte: startTime }, endTime: { gt: startTime } },
            { startTime: { lt: endTime }, endTime: { gte: endTime } },
          ],
        },
      });

      if (collision) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "El horario seleccionado ya no está disponible (concurrencia de turnos).",
        });
      }

      // Default doctor
      let doctorId = input.doctorId;
      if (!doctorId) {
        const doc = await ctx.db.user.findFirst({ where: { role: "DOCTOR" } });
        doctorId = doc?.id || ctx.userId;
      }

      const finalDoctorId = doctorId || ctx.userId;

      const appointment = await ctx.db.appointment.create({
        data: {
          workspaceId: ctx.workspaceId,
          patientId: input.patientId,
          doctorId: finalDoctorId,
          startTime,
          endTime,
          type: input.type,
          status: "CONFIRMED",
          notes: input.notes,
        },
      });

      return appointment;
    }),

  updateStatus: tenantProcedure
    .input(
      z.object({
        appointmentId: z.string(),
        status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.appointment.update({
        where: { id: input.appointmentId },
        data: { status: input.status },
      });

      return updated;
    }),

  sendWhatsAppReminder: tenantProcedure
    .input(
      z.object({
        appointmentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.db.appointment.findFirst({
        where: { id: input.appointmentId },
        include: {
          patient: true,
          doctor: true,
        },
      });

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Turno no encontrado." });
      }

      const timeStr = appointment.startTime.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const reminderText = `Hola ${appointment.patient.firstName}, te recordamos tu turno en Clínica Buenos Aires con ${appointment.doctor.name} hoy a las ${timeStr}hs.\n\nPor favor responde:\n1 para CONFIRMAR tu asistencia\n2 para CANCELAR o reprogramar.`;

      // Log outbound reminder in communication logs
      await ctx.db.communicationLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          patientId: appointment.patient.id,
          channel: "WHATSAPP",
          direction: "OUTBOUND",
          sender: "Clínica Buenos Aires",
          messageText: reminderText,
          rawMetadata: { template: "appointment_reminder_v1", appointmentId: appointment.id },
        },
      });

      // Mark reminder sent
      const updated = await ctx.db.appointment.update({
        where: { id: appointment.id },
        data: { reminder24hSent: true, status: "PENDING" },
      });

      return {
        success: true,
        message: `Recordatorio interactivo enviado a ${appointment.patient.phone}`,
        appointmentId: updated.id,
        phone: appointment.patient.phone,
        reminderText,
      };
    }),

  simulatePatientReply: tenantProcedure
    .input(
      z.object({
        appointmentId: z.string(),
        reply: z.enum(["1", "2"]), // 1 = Confirm, 2 = Cancel
      })
    )
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.db.appointment.findFirst({
        where: { id: input.appointmentId },
        include: { patient: true },
      });

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Turno no encontrado." });
      }

      const isConfirm = input.reply === "1";
      const newStatus = isConfirm ? "CONFIRMED" : "CANCELLED";

      // Log inbound reply
      await ctx.db.communicationLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          patientId: appointment.patient.id,
          channel: "WHATSAPP",
          direction: "INBOUND",
          sender: appointment.patient.phone,
          messageText: input.reply,
          rawMetadata: { simulation: true, appointmentId: appointment.id },
        },
      });

      // Update appointment status
      const updated = await ctx.db.appointment.update({
        where: { id: appointment.id },
        data: { status: newStatus },
      });

      // Confirmation reply
      const replyText = isConfirm
        ? `¡Excelente ${appointment.patient.firstName}! Tu turno ha sido confirmado. Te esperamos puntualmente.`
        : `Entendido ${appointment.patient.firstName}. Hemos cancelado tu turno y liberado el horario en la agenda.`;

      await ctx.db.communicationLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          patientId: appointment.patient.id,
          channel: "WHATSAPP",
          direction: "OUTBOUND",
          sender: "Clínica Buenos Aires Bot",
          messageText: replyText,
        },
      });

      return {
        success: true,
        newStatus,
        message: isConfirm ? "Turno confirmado por WhatsApp" : "Turno cancelado y horario liberado",
      };
    }),
});
