// packages/api/src/routers/triage.ts
import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { runMedicalTriageAgent } from "@clinic-os/ai-agent";

export const triageRouter = router({
  getKanban: tenantProcedure.query(async ({ ctx }) => {
    const patients = await ctx.db.patient.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        evidenceEntries: {
          take: 3,
          orderBy: { createdAt: "desc" },
        },
        appointments: {
          take: 1,
          orderBy: { startTime: "desc" },
        },
      },
    });

    const kanban = {
      recibidos: patients.filter((p) => p.status === "LEAD_TRIAGE"),
      en_espera: patients.filter((p) => p.status === "ACTIVE" && p.appointments.length === 0),
      confirmados: patients.filter((p) => p.status === "SCHEDULED" || (p.appointments.length > 0 && p.appointments[0].status === "CONFIRMED")),
      cancelados: patients.filter((p) => p.status === "INACTIVE"),
    };

    return kanban;
  }),

  updateLeadStatus: tenantProcedure
    .input(
      z.object({
        patientId: z.string(),
        newStatus: z.enum(["LEAD_TRIAGE", "SCHEDULED", "ACTIVE", "INACTIVE", "DISCHARGED"]),
        triageUrgency: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.patient.update({
        where: { id: input.patientId },
        data: {
          status: input.newStatus,
          triageUrgency: input.triageUrgency || undefined,
        },
      });

      return updated;
    }),

  processInboundChat: tenantProcedure
    .input(
      z.object({
        patientId: z.string(),
        messageText: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await runMedicalTriageAgent({
        workspaceId: ctx.workspaceId,
        patientId: input.patientId,
        incomingMessage: input.messageText,
      });

      return result;
    }),
});
