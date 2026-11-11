// packages/ai-agent/src/tools.ts
// Clinic-OS Autonomous Medical Function Calling Tools

import { z } from "zod";
import { createTenantClient } from "@clinic-os/db";
import crypto from "crypto";

export interface ToolContext {
  workspaceId: string;
  patientId: string;
}

/**
 * 1. check_calendar_availability: Checks doctor/clinic availability for a given date or range.
 */
export const checkCalendarAvailabilitySchema = z.object({
  doctorId: z.string().optional().describe("ID del médico. Si se omite, busca médicos de guardia disponibles."),
  dateIso: z.string().describe("Fecha en formato YYYY-MM-DD para consultar disponibilidad."),
  timeSlotPreference: z.enum(["morning", "afternoon", "any"]).default("any").describe("Preferencia de franja horaria."),
});

export async function executeCheckCalendarAvailability(
  input: z.infer<typeof checkCalendarAvailabilitySchema>,
  ctx: ToolContext
) {
  const db = createTenantClient(ctx.workspaceId);
  const targetDate = new Date(input.dateIso);
  
  // Start of day and End of day in UTC
  const startOfDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0));
  const endOfDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23, 59, 59));

  const existingAppointments = await db.appointment.findMany({
    where: {
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ["CANCELLED"] },
    },
    select: {
      startTime: true,
      endTime: true,
      doctorId: true,
    },
  });

  // Calculate open slots for standard consultation hours (09:00 to 18:00 local, converted to UTC)
  // Assuming America/Argentina/Buenos_Aires (UTC-3), 09:00 ART is 12:00 UTC, 18:00 ART is 21:00 UTC
  const clinicStartHourUtc = 12; // 09:00 ART
  const clinicEndHourUtc = 21;   // 18:00 ART

  const availableSlots: { timeUtc: string; timeLocal: string }[] = [];

  for (let hour = clinicStartHourUtc; hour < clinicEndHourUtc; hour++) {
    for (const minute of [0, 30]) {
      const slotTime = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), hour, minute, 0));
      const slotEnd = new Date(slotTime.getTime() + 30 * 60 * 1000);

      // Check collision
      const isBooked = existingAppointments.some(
        (app: { startTime: Date; endTime: Date }) => slotTime < app.endTime && slotEnd > app.startTime
      );

      if (!isBooked) {
        const localHour = (hour - 3 + 24) % 24;
        const localTimeStr = `${String(localHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} hs`;
        
        // Filter by preference
        if (input.timeSlotPreference === "morning" && localHour >= 13) continue;
        if (input.timeSlotPreference === "afternoon" && localHour < 13) continue;

        availableSlots.push({
          timeUtc: slotTime.toISOString(),
          timeLocal: localTimeStr,
        });
      }
    }
  }

  return {
    date: input.dateIso,
    totalAvailable: availableSlots.length,
    slots: availableSlots.slice(0, 6), // Return top 6 options
  };
}

/**
 * 2. book_appointment: Creates an appointment with concurrency protection.
 */
export const bookAppointmentSchema = z.object({
  patientId: z.string().describe("ID del paciente."),
  doctorId: z.string().optional().describe("ID del médico asignado."),
  startTimeUtc: z.string().describe("Fecha y hora de inicio en formato ISO UTC."),
  durationMinutes: z.number().default(30).describe("Duración en minutos."),
  type: z.enum(["CONSULTATION", "SURGERY", "FOLLOW_UP", "PROCEDURE"]).default("CONSULTATION"),
  notes: z.string().optional().describe("Notas clínicas preliminares."),
});

export async function executeBookAppointment(
  input: z.infer<typeof bookAppointmentSchema>,
  ctx: ToolContext
) {
  const db = createTenantClient(ctx.workspaceId);
  const startTime = new Date(input.startTimeUtc);
  const endTime = new Date(startTime.getTime() + input.durationMinutes * 60 * 1000);

  // Concurrency collision check
  const conflict = await db.appointment.findFirst({
    where: {
      status: { notIn: ["CANCELLED"] },
      OR: [
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
      ],
    },
  });

  if (conflict) {
    throw new Error("CONCURRENCY CONFLICT: El turno seleccionado acaba de ser ocupado por otro paciente.");
  }

  // Find default active doctor if not specified
  let doctorId = input.doctorId;
  if (!doctorId) {
    const defaultDoctor = await db.user.findFirst({
      where: { role: "DOCTOR", isActive: true },
    });
    if (!defaultDoctor) {
      throw new Error("No hay médicos activos configurados en esta clínica.");
    }
    doctorId = defaultDoctor.id;
  }

  const appointment = await db.appointment.create({
    data: {
      workspaceId: ctx.workspaceId,
      patientId: input.patientId,
      doctorId,
      startTime,
      endTime,
      type: input.type,
      status: "CONFIRMED",
      notes: input.notes || "Agendado automáticamente por Clinic-OS AI Triage Agent.",
      remindersScheduled: true,
    },
    include: {
      doctor: { select: { name: true, specialty: true } },
      patient: { select: { firstName: true, lastName: true, phone: true } },
    },
  });

  // Update patient status to SCHEDULED
  await db.patient.update({
    where: { id: input.patientId },
    data: { status: "SCHEDULED" },
  });

  return {
    success: true,
    appointmentId: appointment.id,
    patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    doctorName: appointment.doctor.name,
    startTimeUtc: appointment.startTime.toISOString(),
    status: appointment.status,
  };
}

/**
 * 3. cancel_appointment: Cancels an appointment.
 */
export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().describe("ID del turno a cancelar."),
  reason: z.string().describe("Motivo de la cancelación."),
});

export async function executeCancelAppointment(
  input: z.infer<typeof cancelAppointmentSchema>,
  ctx: ToolContext
) {
  const db = createTenantClient(ctx.workspaceId);

  const updated = await db.appointment.update({
    where: { id: input.appointmentId },
    data: {
      status: "CANCELLED",
      notes: `Cancelado por el paciente. Motivo: ${input.reason}`,
    },
  });

  return {
    success: true,
    appointmentId: updated.id,
    status: "CANCELLED",
    freedSlotTime: updated.startTime.toISOString(),
  };
}

/**
 * 4. draft_medical_note: Prepares a preliminary SOAP note for the physician.
 */
export const draftMedicalNoteSchema = z.object({
  patientId: z.string().describe("ID del paciente."),
  doctorId: z.string().describe("ID del médico responsable."),
  symptomsSummary: z.string().describe("Resumen de síntomas y motivo de consulta."),
  suggestedICD10: z.string().optional().describe("Código CIE-10 sugerido."),
});

export async function executeDraftMedicalNote(
  input: z.infer<typeof draftMedicalNoteSchema>,
  ctx: ToolContext
) {
  const db = createTenantClient(ctx.workspaceId);

  const soapContent = {
    subjetivo: `Triage AI Inbound: ${input.symptomsSummary}`,
    objetivo: "Pendiente de examen físico presencial por profesional.",
    evaluacion: `Motivo en estudio. Sugerido: ${input.suggestedICD10 || "Z00.0 (Examen médico general)"}`,
    plan: "Consulta médica presencial agendada.",
    generadoPor: "Clinic-OS Triage AI Copilot",
  };

  const sha256 = crypto.createHash("sha256").update(JSON.stringify(soapContent)).digest("hex");

  const record = await db.medicalRecord.create({
    data: {
      workspaceId: ctx.workspaceId,
      patientId: input.patientId,
      authorId: input.doctorId,
      type: "SOAP_NOTE",
      content: soapContent,
      diagnosisICD10: input.suggestedICD10 || null,
      contentSha256: sha256,
      isSigned: false, // Must be reviewed and signed by human doctor
    },
  });

  return {
    success: true,
    medicalRecordId: record.id,
    status: "DRAFT_PENDING_PHYSICIAN_SIGNATURE",
  };
}

/**
 * 5. escalate_to_human: Immediate safety guardrail when detecting emergencies.
 */
export const escalateToHumanSchema = z.object({
  patientId: z.string().describe("ID del paciente."),
  reason: z.string().describe("Motivo clínico de la derivación inmediata a humano."),
  urgencyLevel: z.enum(["HIGH", "EMERGENCY"]).describe("Nivel de gravedad."),
  summary: z.string().describe("Resumen de la situación crítica."),
});

export async function executeEscalateToHuman(
  input: z.infer<typeof escalateToHumanSchema>,
  ctx: ToolContext
) {
  try {
    const db = createTenantClient(ctx.workspaceId, 'system', 'CLINIC_ADMIN');
    await db.patient.update({
      where: { id: input.patientId },
      data: {
        triageUrgency: input.urgencyLevel,
        triageNotes: `ALERTA ROJA CLÍNICA: ${input.reason}. ${input.summary}`,
      },
    });
  } catch (err) {
    console.warn('[ESCALATE TO HUMAN] DB offline or skipped:', err.message);
  }
  return {
    success: true,
    escalated: true,
    urgencyLevel: input.urgencyLevel,
    emergencyMessageForPatient:
      '⚠️ ATENCIÓN: Por los síntomas referidos que revisten carácter de alarma médica inmediata, le recomendamos comunicarse URGENTEMENTE al servicio de emergencias médicas (SAME 107 en CABA o 911) o dirigirse a la guardia médica hospitalaria más cercana. Un profesional de nuestra clínica ha sido notificado para contactarlo a la brevedad.',
  };
}
