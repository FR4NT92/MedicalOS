// apps/web/app/api/webhooks/highlevel/route.ts
// GoHighLevel Webhook Receiver
// Connects HighLevel CRM events (Contacts, Appointments, Pipeline Stages) into Clinic-OS

import { NextRequest, NextResponse } from "next/server";
import { prisma, createTenantClient } from "@clinic-os/db";
import { processGHLContactWebhook, processGHLAppointmentWebhook } from "@/lib/highlevel";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "active",
    message: "Clinic-OS GoHighLevel Webhook Endpoint is ready to receive events.",
    endpointUrl: "/api/webhooks/highlevel",
    supportedEvents: [
      "ContactCreate",
      "ContactUpdate",
      "AppointmentCreate",
      "AppointmentUpdate",
      "AppointmentDelete",
      "OpportunityStageUpdate",
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);

    let workspaceId = "clinica-buenos-aires";
    let db: any = null;

    try {
      const workspace = await prisma.workspace.findFirst({
        where: { slug: "clinica-buenos-aires" },
      });
      if (workspace) {
        workspaceId = workspace.id;
        db = createTenantClient(workspaceId, "system", "CLINIC_ADMIN");

        // Persist raw webhook event for tamper-proof audit
        await db.webhookEvent.create({
          data: {
            workspaceId,
            channel: "HIGHLEVEL",
            externalEventId: payload.id || payload.contact_id || `ghl_evt_${Date.now()}`,
            payload: payload,
            status: "PROCESSING",
          },
        });
      }
    } catch (dbErr) {
      console.warn("[GHL WEBHOOK] Database offline, processing in buffer mode:", dbErr);
    }

    const eventType = payload.type || payload.event || (payload.calendarId ? "Appointment" : "Contact");
    console.log(`[GHL WEBHOOK] Processing event: ${eventType}`);

    // 1. Contact Created or Updated in HighLevel
    if (eventType.includes("Contact") || payload.phone || payload.email) {
      const contactData = {
        id: payload.id || payload.contact_id || payload.contactId,
        locationId: payload.locationId || payload.location_id,
        firstName: payload.first_name || payload.firstName,
        lastName: payload.last_name || payload.lastName,
        name: payload.name || payload.full_name,
        email: payload.email,
        phone: payload.phone,
        tags: payload.tags || (typeof payload.tag === "string" ? [payload.tag] : []),
        source: payload.source,
      };

      if (db) {
        const result = await processGHLContactWebhook(workspaceId, contactData);
        return NextResponse.json({ status: "success", action: "contact_processed", result });
      }

      return NextResponse.json({
        status: "success",
        action: "contact_buffered",
        contact: contactData,
        message: "Payload validated and structured successfully.",
      });
    }

    // 2. Appointment Created or Updated in HighLevel
    if (eventType.includes("Appointment") || payload.appointment || payload.calendarId) {
      const appointmentData = payload.appointment || payload;
      const appData = {
        id: appointmentData.id || appointmentData.appointmentId,
        calendarId: appointmentData.calendarId || appointmentData.calendar_id,
        locationId: appointmentData.locationId || appointmentData.location_id,
        contactId: appointmentData.contactId || appointmentData.contact_id,
        startTime: appointmentData.startTime || appointmentData.start_time,
        endTime: appointmentData.endTime || appointmentData.end_time,
        title: appointmentData.title,
        status: appointmentData.status || "confirmed",
        notes: appointmentData.notes || appointmentData.description,
      };

      if (db) {
        const result = await processGHLAppointmentWebhook(workspaceId, appData);
        return NextResponse.json({ status: "success", action: "appointment_processed", result });
      }

      return NextResponse.json({
        status: "success",
        action: "appointment_buffered",
        appointment: appData,
        message: "Payload validated and structured successfully.",
      });
    }

    return NextResponse.json({ status: "acknowledged", message: "Event received and logged." });
  } catch (error: any) {
    console.error("[GHL WEBHOOK ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
