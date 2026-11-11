// apps/web/app/api/webhooks/meta/route.ts
// Meta Graph API Webhook Handler for Instagram and WhatsApp Direct Messaging

import { NextRequest, NextResponse } from "next/server";
import { prisma, createTenantClient } from "@clinic-os/db";
import { runMedicalTriageAgent, sendInstagramMessage, sendWhatsAppMessage } from "@clinic-os/ai-agent";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "clinic_os_meta_verify_token_2026";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // The Meta webhook payload can contain entries for IG or WA.
    const entry = payload.entry?.[0];

    // WhatsApp Message
    const waChange = entry?.changes?.[0]?.value;
    if (waChange?.messages && waChange.messages.length > 0) {
      const waMessage = waChange.messages[0];
      const senderPhone = waMessage.from; // Phone number without '+'
      const text = waMessage.text?.body;

      if (!text || !senderPhone) return NextResponse.json({ status: "acknowledged" });

      await handleIncomingMessage("whatsapp", senderPhone, text);
      return NextResponse.json({ status: "processed_whatsapp" });
    }

    // Instagram Message
    const messaging = entry?.messaging?.[0];
    if (messaging && messaging.message?.text) {
      const igSenderId = messaging.sender.id;
      const text = messaging.message.text;

      await handleIncomingMessage("instagram", igSenderId, text);
      return NextResponse.json({ status: "processed_instagram" });
    }

    return NextResponse.json({ status: "acknowledged_unknown" });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleIncomingMessage(channel: "whatsapp" | "instagram", senderId: string, text: string) {
  const workspace = await prisma.workspace.findFirst({
    where: { slug: "clinica-buenos-aires" },
  });

  if (!workspace) {
    console.error("Webhook processing failed: No workspace found.");
    return;
  }

  const db = createTenantClient(workspace.id);
  const identifier = channel === "whatsapp" ? `wa_${senderId}` : `ig_${senderId}`;

  // Map user to patient or create lead
  let patient = await db.patient.findFirst({
    where: { phone: identifier },
  });

  if (!patient) {
    patient = await db.patient.create({
      data: {
        workspaceId: workspace.id,
        firstName: "Lead",
        lastName: channel === "whatsapp" ? "WhatsApp" : "Instagram",
        phone: identifier,
        status: "LEAD_TRIAGE",
        triageSource: channel === "whatsapp" ? "WHATSAPP" : "INSTAGRAM",
        triageNotes: `Lead recibido vía ${channel} el ${new Date().toISOString()}`,
      },
    });
  }

  // Run triage agent to get the reply
  const result = await runMedicalTriageAgent({
    workspaceId: workspace.id,
    patientId: patient.id,
    incomingMessage: text,
  });

  // Reply back using the specific channel API
  if (result.replyText) {
    if (channel === "whatsapp") {
      await sendWhatsAppMessage(senderId, result.replyText);
    } else {
      await sendInstagramMessage(senderId, result.replyText);
    }
  }
}
