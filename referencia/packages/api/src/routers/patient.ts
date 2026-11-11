// packages/api/src/routers/patient.ts
import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const patientRouter = router({
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["LEAD_TRIAGE", "SCHEDULED", "ACTIVE", "INACTIVE", "DISCHARGED"]).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.status) {
        where.status = input.status;
      }
      if (input.search) {
        where.OR = [
          { firstName: { contains: input.search, mode: "insensitive" } },
          { lastName: { contains: input.search, mode: "insensitive" } },
          { dni: { contains: input.search } },
          { phone: { contains: input.search } },
        ];
      }

      const patients = await ctx.db.patient.findMany({
        where,
        take: input.limit,
        orderBy: { updatedAt: "desc" },
        include: {
          appointments: {
            take: 1,
            orderBy: { startTime: "desc" },
            select: { startTime: true, status: true, type: true },
          },
        },
      });

      return patients;
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findFirst({
        where: { id: input.id },
        include: {
          appointments: {
            orderBy: { startTime: "desc" },
            take: 10,
          },
          medicalRecords: {
            orderBy: { createdAt: "desc" },
          },
          prescriptions: {
            orderBy: { createdAt: "desc" },
          },
          invoices: {
            orderBy: { createdAt: "desc" },
          },
          evidenceEntries: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado." });
      }

      return patient;
    }),

  create: tenantProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().optional(),
        dni: z.string().optional(),
        phone: z.string().min(6),
        email: z.string().email().optional(),
        healthInsuranceName: z.string().optional(),
        healthInsurancePlan: z.string().optional(),
        affiliateNumber: z.string().optional(),
        preferredSchedule: z.string().optional(),
        triageNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Upsert by phone within this workspace
      const patient = await ctx.db.patient.create({
        data: {
          workspaceId: ctx.workspaceId,
          firstName: input.firstName,
          lastName: input.lastName || '-',
          dni: input.dni,
          phone: input.phone,
          email: input.email,
          healthInsuranceName: input.healthInsuranceName,
          healthInsurancePlan: input.healthInsurancePlan,
          affiliateNumber: input.affiliateNumber,
          preferredSchedule: input.preferredSchedule,
          triageNotes: input.triageNotes,
          status: "SCHEDULED",
        },
      });

      return patient;
    }),

  validateHealthInsurance: tenantProcedure
    .input(
      z.object({
        patientId: z.string(),
        prepaga: z.string(),
        affiliateNumber: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Simulate real-time API padrón validation (OSDE / Swiss Medical / Galeno)
      const isValid = !input.affiliateNumber.endsWith("00"); // e.g. mock rule: ends with 00 is suspended
      
      const updated = await ctx.db.patient.update({
        where: { id: input.patientId },
        data: {
          insuranceValidated: isValid,
          healthInsuranceName: input.prepaga,
          affiliateNumber: input.affiliateNumber,
          insuranceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 days
        },
      });

      return {
        success: true,
        isValid,
        patientId: updated.id,
        plan: updated.healthInsurancePlan || "Plan Activo",
        message: isValid
          ? `✓ Afiliado Activo en ${input.prepaga}. Cobertura vigente.`
          : `✕ Afiliado Suspendido en ${input.prepaga}. Regularizar copago.`,
      };
    }),
});
