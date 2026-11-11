// apps/web/app/api/webhooks/whatsapp/route.ts
// Official WhatsApp Cloud API Webhook Handler with Multi-Tenant Mapping & AI Triage Dispatch

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma, createTenantClient } from "@clinic-os/db";
import { runMedicalTriageAgent } from "@clinic-os/ai-agent";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "clinic_os_meta_verify_token_2026";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || "meta_app_secret_clinic_os";

/**
 * 1. Webhook Verification Handshake (Meta requirement)
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✓ WhatsApp Cloud Webhook verified successfully.");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden: Invalid verification token.", { status: 403 });
}

/**
 * 2. Inbound WhatsApp Event Processing
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    // Security: Validate HMAC SHA-256 signature if in production
    if (process.env.NODE_ENV === "production" && signature && APP_SECRET !== "meta_app_secret_clinic_os") {
      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", APP_SECRET)
        .update(rawBody)
        .digest("hex")}`;

      if (signature !== expectedSignature) {
        return new NextResponse("Unauthorized: Invalid HMAC signature.", { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Meta entry traversal
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message || message.type !== "text") {
      // Received non-text or delivery status update (read/sent receipt)
      return NextResponse.json({ status: "acknowledged_non_message" });
    }

    const senderPhone = `+${message.from}`; // Standard E.164 phone
    const messageText = message.text.body;
    const externalMessageId = message.id;

    // Resolve workspace (by phone number configuration or default)
    let workspaceId = "clinica-buenos-aires";
    let db: any = null;
    let patient: any = null;

    try {
      const workspace = await prisma.workspace.findFirst({
        where: { slug: "clinica-buenos-aires" },
      });

      if (workspace) {
        workspaceId = workspace.id;
        db = createTenantClient(workspaceId);

        // Persist incoming webhook event log
        await db.webhookEvent.create({
          data: {
            workspaceId,
            channel: "WHATSAPP",
            externalEventId: externalMessageId,
            payload: payload,
            status: "PROCESSING",
          },
        });

        // Lookup or auto-create patient lead
        patient = await db.patient.findFirst({
          where: { phone: senderPhone },
        });

        if (!patient) {
          const contactName = change?.contacts?.[0]?.profile?.name || "Paciente WhatsApp";
          const nameParts = contactName.split(" ");
          const firstName = nameParts[0] || "Paciente";
          const lastName = nameParts.slice(1).join(" ") || "WhatsApp";

          patient = await db.patient.create({
            data: {
              workspaceId,
              firstName,
              lastName,
              phone: senderPhone,
              status: "LEAD_TRIAGE",
              triageSource: "WHATSAPP",
              triageNotes: `Lead captado automáticamente vía WhatsApp Cloud API el ${new Date().toISOString()}`,
            },
          });
        }

        // Save message to CommunicationLog
        await db.communicationLog.create({
          data: {
            workspaceId,
            patientId: patient.id,
            channel: "WHATSAPP",
            direction: "INBOUND",
            sender: senderPhone,
            messageText,
            rawMetadata: { messageId: externalMessageId },
          },
        });
      }
    } catch (dbErr) {
      console.warn("[WHATSAPP DB WARN] Database pooler offline, processing in resilient fallback mode.");
    }

    // Check if message is a Turno Confirmation/Cancellation Response (Anti No-Show)
    const normalizedText = messageText.trim().toLowerCase();
    const isConfirming = /^(1|si|sí|confirmo|confirmar|confirmo turno|asisto)$/i.test(normalizedText);
    const isCancelling = /^(2|no|cancelo|cancelar|no asisto|reprogramar)$/i.test(normalizedText);

    if (isConfirming || isCancelling) {
      if (db && patient) {
        try {
          const pendingAppointment = await db.appointment.findFirst({
            where: {
              patientId: patient.id,
              startTime: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // from 4 hours ago onwards
              status: { notIn: ["COMPLETED"] },
            },
            orderBy: { startTime: "asc" },
          });

          if (pendingAppointment) {
            const newStatus = isConfirming ? "CONFIRMED" : "CANCELLED";
            await db.appointment.update({
              where: { id: pendingAppointment.id },
              data: { status: newStatus },
            });

            const replyText = isConfirming
              ? `¡Muchas gracias ${patient.firstName}! Tu turno ha sido confirmado con éxito. Te esperamos en Clínica Buenos Aires.`
              : `Entendido ${patient.firstName}. Hemos registrado la cancelación de tu turno y liberado el horario. Si necesitas reagendar, escribinos cuando gustes.`;

            await db.communicationLog.create({
              data: {
                workspaceId,
                patientId: patient.id,
                channel: "WHATSAPP",
                direction: "OUTBOUND",
                sender: "Clínica Buenos Aires Anti No-Show",
                messageText: replyText,
              },
            });
          }
        } catch (apptErr) {
          console.warn("[WHATSAPP APPT WARN] Appointment lookup offline fallback.");
        }
      }

      return NextResponse.json({
        status: "success",
        appointmentHandled: true,
        action: isConfirming ? "CONFIRMED" : "CANCELLED",
      });
    }

    // Asynchronously dispatch to the Medical AI Agent
    // Non-blocking trigger to ensure WhatsApp webhook returns 200 within 3 seconds
    (async () => {
      try {
        const agentResult = await runMedicalTriageAgent({
          workspaceId,
          patientId: patient.id,
          incomingMessage: messageText,
        });

        // Log agent outbound response
        await db.communicationLog.create({
          data: {
            workspaceId,
            patientId: patient.id,
            channel: "WHATSAPP",
            direction: "OUTBOUND",
            sender: "Clinic-OS AI Copilot",
            messageText: agentResult.replyText,
            rawMetadata: { toolsExecuted: agentResult.toolsExecuted },
          },
        });

        console.log(`[WHATSAPP DISPATCH] Replied to ${senderPhone}: ${agentResult.replyText.slice(0, 60)}...`);
      } catch (err) {
        console.error("Async AI triage dispatch error:", err);
      }
    })();

    return NextResponse.json({ status: "success", received: true });
  } catch (error: any) {
    console.error("WhatsApp webhook exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
