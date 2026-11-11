// packages/ai-agent/src/agent.ts
// Clinic-OS Autonomous Medical Triage & Scheduling Agent

import { CLINIC_OS_TRIAGE_SYSTEM_PROMPT, ZERO_DATA_RETENTION_HEADERS } from "./prompts";
import { persistEvidenceToLedger, EvidenceExtractionSchema } from "./evidenceLedger";
import {
  checkCalendarAvailabilitySchema,
  executeCheckCalendarAvailability,
  bookAppointmentSchema,
  executeBookAppointment,
  cancelAppointmentSchema,
  executeCancelAppointment,
  draftMedicalNoteSchema,
  executeDraftMedicalNote,
  escalateToHumanSchema,
  executeEscalateToHuman,
  ToolContext,
} from "./tools";

export interface RunAgentInput {
  workspaceId: string;
  patientId: string;
  incomingMessage: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AgentRunResult {
  replyText: string;
  evidenceExtraction?: any;
  toolsExecuted: Array<{ toolName: string; result: any }>;
  isEscalated: boolean;
}

/**
 * Executes the autonomous triage agent loop.
 * In production, communicates with OpenAI GPT-4o with Zero Data Retention.
 */
export async function runMedicalTriageAgent(input: RunAgentInput): Promise<AgentRunResult> {
  const { workspaceId, patientId, incomingMessage, conversationHistory = [] } = input;
  const ctx: ToolContext = { workspaceId, patientId };
  const toolsExecuted: Array<{ toolName: string; result: any }> = [];

  const apiKey = process.env.OPENAI_API_KEY;

  // Rule-based Emergency Detection Guardrail (pre-LLM pass)
  const lowerMsg = incomingMessage.toLowerCase();
  const emergencyKeywords = [
    "pecho",
    "toracico",
    "torácico",
    "falta de aire",
    "falta el aire",
    "dificultad para respirar",
    "no puedo respirar",
    "ahogo",
    "desmayo",
    "desmaye",
    "desmayé",
    "hemorragia",
    "sangrado abundante",
    "acv",
    "convulsion",
    "convulsión",
  ];

  const hasEmergency = emergencyKeywords.some((kw) => lowerMsg.includes(kw));
  if (hasEmergency) {
    const escalation = await executeEscalateToHuman(
      {
        patientId,
        reason: "Síntoma de alarma detectado en mensaje entrante.",
        urgencyLevel: "EMERGENCY",
        summary: incomingMessage,
      },
      ctx
    );

    await persistEvidenceToLedger({
      workspaceId,
      patientId,
      extraction: {
        urgencyLevel: "EMERGENCY",
        urgencyEvidence: incomingMessage,
        urgencyConfidence: 0.99,
        symptoms: ["Alarma vital detectada"],
        symptomsEvidence: incomingMessage,
        symptomsConfidence: 0.99,
        healthInsurance: null,
        insurancePlan: null,
        affiliateNumber: null,
        insuranceEvidence: null,
        insuranceConfidence: 0.5,
        preferredSchedule: null,
        scheduleEvidence: null,
        scheduleConfidence: 0.5,
      },
    });

    return {
      replyText: escalation.emergencyMessageForPatient,
      toolsExecuted: [{ toolName: "escalate_to_human", result: escalation }],
      isEscalated: true,
    };
  }

  // If OpenAI API key is provided, run full GPT-4o with tool calling
  if (apiKey && apiKey !== "your-openai-api-key") {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...ZERO_DATA_RETENTION_HEADERS,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: CLINIC_OS_TRIAGE_SYSTEM_PROMPT },
            ...conversationHistory,
            { role: "user", content: incomingMessage },
          ],
          temperature: 0.2,
          tools: [
            {
              type: "function",
              function: {
                name: "check_calendar_availability",
                description: "Verifica turnos disponibles en la clínica.",
                parameters: {
                  type: "object",
                  properties: {
                    dateIso: { type: "string", description: "Fecha en formato YYYY-MM-DD" },
                    timeSlotPreference: { type: "string", enum: ["morning", "afternoon", "any"] },
                  },
                  required: ["dateIso"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "book_appointment",
                description: "Agenda y confirma un turno para el paciente.",
                parameters: {
                  type: "object",
                  properties: {
                    patientId: { type: "string" },
                    startTimeUtc: { type: "string", description: "Fecha/hora UTC en formato ISO" },
                    notes: { type: "string" },
                  },
                  required: ["patientId", "startTimeUtc"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "escalate_to_human",
                description: "Deriva al paciente a guardia o humano por emergencia vital.",
                parameters: {
                  type: "object",
                  properties: {
                    patientId: { type: "string" },
                    reason: { type: "string" },
                    urgencyLevel: { type: "string", enum: ["HIGH", "EMERGENCY"] },
                    summary: { type: "string" },
                  },
                  required: ["patientId", "reason", "urgencyLevel", "summary"],
                },
              },
            },
          ],
        }),
      });

      const data = await response.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      if (message?.tool_calls && message.tool_calls.length > 0) {
        for (const tc of message.tool_calls) {
          const fnName = tc.function.name;
          const fnArgs = JSON.parse(tc.function.arguments || "{}");

          if (fnName === "check_calendar_availability") {
            const res = await executeCheckCalendarAvailability(fnArgs, ctx);
            toolsExecuted.push({ toolName: fnName, result: res });
          } else if (fnName === "book_appointment") {
            const res = await executeBookAppointment({ ...fnArgs, patientId }, ctx);
            toolsExecuted.push({ toolName: fnName, result: res });
          } else if (fnName === "escalate_to_human") {
            const res = await executeEscalateToHuman({ ...fnArgs, patientId }, ctx);
            toolsExecuted.push({ toolName: fnName, result: res });
            return {
              replyText: res.emergencyMessageForPatient,
              toolsExecuted,
              isEscalated: true,
            };
          }
        }
      }

      // Also execute Evidence Ledger extraction
      const extractedUrgency = lowerMsg.includes("dolor") || lowerMsg.includes("operacion") ? "MEDIUM" : "LOW";
      const extraction = {
        urgencyLevel: extractedUrgency as "LOW" | "MEDIUM",
        urgencyEvidence: incomingMessage,
        urgencyConfidence: 0.88,
        symptoms: [incomingMessage.slice(0, 50)],
        symptomsEvidence: incomingMessage,
        symptomsConfidence: 0.85,
        healthInsurance: lowerMsg.includes("osde") ? "OSDE" : lowerMsg.includes("swiss") ? "Swiss Medical" : null,
        insurancePlan: null,
        affiliateNumber: null,
        insuranceEvidence: incomingMessage,
        insuranceConfidence: 0.8,
        preferredSchedule: lowerMsg.includes("tarde") ? "Tardes" : lowerMsg.includes("mañana") ? "Mañanas" : null,
        scheduleEvidence: incomingMessage,
        scheduleConfidence: 0.8,
      };

      await persistEvidenceToLedger({
        workspaceId,
        patientId,
        extraction,
      });

      return {
        replyText: message?.content || "¡Hola! He recibido tu consulta y registré tu información. ¿Qué día y horario te resultaría más cómodo para visitarnos?",
        evidenceExtraction: extraction,
        toolsExecuted,
        isEscalated: false,
      };
    } catch (err) {
      console.error("OpenAI API call failed, falling back to deterministic triage:", err);
    }
  }

  // Deterministic Fallback Mode (e.g. offline / test environment)
  const isPostOp = lowerMsg.includes("postop") || lowerMsg.includes("operad") || lowerMsg.includes("cirug");
  const extractedUrgency = isPostOp ? "MEDIUM" : "LOW";
  const insuranceDetected = lowerMsg.includes("osde")
    ? "OSDE"
    : lowerMsg.includes("swiss")
    ? "Swiss Medical"
    : lowerMsg.includes("galeno")
    ? "Galeno"
    : null;

  const extraction = {
    urgencyLevel: extractedUrgency as "LOW" | "MEDIUM",
    urgencyEvidence: incomingMessage,
    urgencyConfidence: 0.9,
    symptoms: [incomingMessage],
    symptomsEvidence: incomingMessage,
    symptomsConfidence: 0.9,
    healthInsurance: insuranceDetected,
    insurancePlan: null,
    affiliateNumber: null,
    insuranceEvidence: insuranceDetected ? `Mencionó ${insuranceDetected}` : null,
    insuranceConfidence: 0.85,
    preferredSchedule: lowerMsg.includes("tarde") ? "Tardes" : "Mañanas",
    scheduleEvidence: incomingMessage,
    scheduleConfidence: 0.8,
  };

  await persistEvidenceToLedger({
    workspaceId,
    patientId,
    extraction,
  });

  return {
    replyText: `Hola, recibí tu mensaje. Clasifiqué tu consulta con prioridad ${extractedUrgency}. ${insuranceDetected ? `Identifiqué cobertura con ${insuranceDetected}. ` : ""}¿Te gustaría que te agendemos un turno con la Dra. Mariana Morales para esta semana?`,
    evidenceExtraction: extraction,
    toolsExecuted,
    isEscalated: false,
  };
}
