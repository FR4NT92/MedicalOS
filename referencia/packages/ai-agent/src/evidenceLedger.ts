// packages/ai-agent/src/evidenceLedger.ts
// Clinic-OS Evidence Ledger Extraction Engine (ClinicOS pattern adapted for Medical Triage)

import { z } from "zod";
import { createTenantClient } from "@clinic-os/db";

export const EvidenceExtractionSchema = z.object({
  urgencyLevel: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]),
  urgencyEvidence: z.string().describe("Cita textual exacta que justifica el nivel de urgencia."),
  urgencyConfidence: z.number().min(0).max(1),

  symptoms: z.array(z.string()).describe("Lista de síntomas referidos por el paciente."),
  symptomsEvidence: z.string().describe("Cita textual exacta de los síntomas."),
  symptomsConfidence: z.number().min(0).max(1),

  healthInsurance: z.string().nullable().describe("Nombre de la prepaga u obra social (ej: OSDE, Swiss Medical)"),
  insurancePlan: z.string().nullable().describe("Plan específico si fue provisto (ej: 310, SMG20)"),
  affiliateNumber: z.string().nullable().describe("Número de afiliado o credencial si fue provisto."),
  insuranceEvidence: z.string().nullable().describe("Cita textual de la prepaga."),
  insuranceConfidence: z.number().min(0).max(1).default(0.8),

  preferredSchedule: z.string().nullable().describe("Franja horaria preferida (ej: 'Tardes a partir de las 16hs')"),
  scheduleEvidence: z.string().nullable().describe("Cita textual del horario pedido."),
  scheduleConfidence: z.number().min(0).max(1).default(0.8),
});

export type EvidenceExtraction = z.infer<typeof EvidenceExtractionSchema>;

export interface ProcessEvidenceOptions {
  workspaceId: string;
  patientId: string;
  sourceMessageId?: string;
  extraction: EvidenceExtraction;
}

/**
 * Persists extracted evidence entries into EvidenceLedgerEntry table and updates the Patient record.
 */
export async function persistEvidenceToLedger(options: ProcessEvidenceOptions) {
  try {
  const { workspaceId, patientId, sourceMessageId, extraction } = options;
  const db = createTenantClient(workspaceId);

  // 1. Create Evidence Ledger entries for each audited field
  const ledgerPromises = [];

  // Urgency
  ledgerPromises.push(
    db.evidenceLedgerEntry.create({
      data: {
        workspaceId,
        patientId,
        sourceMessageId: sourceMessageId || null,
        fieldName: "triageUrgency",
        extractedValue: extraction.urgencyLevel,
        confidence: extraction.urgencyConfidence,
        evidenceQuote: extraction.urgencyEvidence,
        verifiedByHuman: false,
      },
    })
  );

  // Symptoms
  if (extraction.symptoms.length > 0) {
    ledgerPromises.push(
      db.evidenceLedgerEntry.create({
        data: {
          workspaceId,
          patientId,
          sourceMessageId: sourceMessageId || null,
          fieldName: "triageSymptoms",
          extractedValue: extraction.symptoms.join(", "),
          confidence: extraction.symptomsConfidence,
          evidenceQuote: extraction.symptomsEvidence,
          verifiedByHuman: false,
        },
      })
    );
  }

  // Insurance
  if (extraction.healthInsurance) {
    ledgerPromises.push(
      db.evidenceLedgerEntry.create({
        data: {
          workspaceId,
          patientId,
          sourceMessageId: sourceMessageId || null,
          fieldName: "healthInsurance",
          extractedValue: `${extraction.healthInsurance} ${extraction.insurancePlan || ""}`.trim(),
          confidence: extraction.insuranceConfidence,
          evidenceQuote: extraction.insuranceEvidence || "Indicado por el paciente",
          verifiedByHuman: false,
        },
      })
    );
  }

  // Schedule preference
  if (extraction.preferredSchedule) {
    ledgerPromises.push(
      db.evidenceLedgerEntry.create({
        data: {
          workspaceId,
          patientId,
          sourceMessageId: sourceMessageId || null,
          fieldName: "preferredSchedule",
          extractedValue: extraction.preferredSchedule,
          confidence: extraction.scheduleConfidence,
          evidenceQuote: extraction.scheduleEvidence || "Indicado por el paciente",
          verifiedByHuman: false,
        },
      })
    );
  }

  await Promise.all(ledgerPromises);

  // 2. Update Patient profile with validated facts
  const updatedPatient = await db.patient.update({
    where: { id: patientId },
    data: {
      triageUrgency: extraction.urgencyLevel,
      triageSymptoms: extraction.symptoms,
      healthInsuranceName: extraction.healthInsurance || undefined,
      healthInsurancePlan: extraction.insurancePlan || undefined,
      affiliateNumber: extraction.affiliateNumber || undefined,
      preferredSchedule: extraction.preferredSchedule || undefined,
      triageNotes: `Triage AI: ${extraction.urgencyEvidence}. Síntomas: ${extraction.symptoms.join(", ")}.`,
    },
  });

    return {
      success: true,
      patientId: updatedPatient.id,
      urgencyLevel: updatedPatient.triageUrgency,
    };
  } catch (err: any) {
    console.warn('[EVIDENCE LEDGER] Database offline or skipped:', err.message);
    return {
      success: false,
      patientId: options.patientId,
      urgencyLevel: options.extraction.urgencyLevel,
    };
  }
}
