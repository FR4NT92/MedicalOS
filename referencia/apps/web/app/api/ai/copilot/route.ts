// apps/web/app/api/ai/copilot/route.ts
// Proactive Clinical & Administrative AI Agent Endpoint
// Guardrails: Ley 26.529, Ley 25.326, HIPAA BAA Ready, Zero Data Retention (ZDR)

import { NextRequest, NextResponse } from "next/server";
import { runMedicalTriageAgent } from "@clinic-os/ai-agent";
import { prisma, createTenantClient } from "@clinic-os/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, patientId, phone, channel = "API" } = body;

    if (!message) {
      return NextResponse.json({ error: "Campo 'message' es requerido." }, { status: 400 });
    }

    let workspaceId = "clinica-buenos-aires";
    let resolvedPatientId = patientId || "guest_patient";
    let db: any = null;

    // Resilient workspace and patient lookup
    try {
      const workspace = await prisma.workspace.findFirst({
        where: { slug: "clinica-buenos-aires" },
      });
      if (workspace) {
        workspaceId = workspace.id;
        db = createTenantClient(workspaceId, "system", "CLINIC_ADMIN");

        if (phone && resolvedPatientId === "guest_patient") {
          let patient = await db.patient.findFirst({ where: { phone } });
          if (!patient) {
            patient = await db.patient.create({
              data: {
                workspaceId,
                firstName: "Consulta",
                lastName: "Directa IA",
                phone,
                status: "LEAD_TRIAGE",
                triageSource: channel === "WHATSAPP" ? "WHATSAPP" : "WEB_CHAT",
              },
            });
          }
          resolvedPatientId = patient.id;
        }
      }
    } catch (dbErr) {
      console.warn("[PROACTIVE AI] Database unavailable, proceeding with in-memory triage:", dbErr);
    }

    // Execute Autonomous Proactive AI Agent
    const agentResult = await runMedicalTriageAgent({
      workspaceId,
      patientId: resolvedPatientId,
      incomingMessage: message,
    });

    // Guardrail audit: Log communication in database if db is reachable
    if (db && resolvedPatientId !== "guest_patient") {
      try {
        await db.communicationLog.create({
          data: {
            workspaceId,
            patientId: resolvedPatientId,
            channel: channel === "WHATSAPP" ? "WHATSAPP" : "WEB_CHAT",
            direction: "OUTBOUND",
            sender: "Clinic-OS Proactive AI",
            messageText: agentResult.replyText,
            rawMetadata: {
              toolsExecuted: agentResult.toolsExecuted,
              isEscalated: agentResult.isEscalated,
            },
          },
        });
      } catch (logErr) {
        console.warn("[PROACTIVE AI] Could not write communication log:", logErr);
      }
    }

    return NextResponse.json({
      success: true,
      replyText: agentResult.replyText,
      toolsExecuted: agentResult.toolsExecuted,
      evidenceExtraction: agentResult.evidenceExtraction || null,
      isEscalated: agentResult.isEscalated,
    });
  } catch (error: any) {
    console.error("[PROACTIVE AI ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
