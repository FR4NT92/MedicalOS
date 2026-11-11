// apps/web/lib/highlevel.ts
// GoHighLevel (GHL) API v2 Integration Client & Webhook Utilities
// Supports OAuth 2.0 / Location API Key, Inbound Webhooks & Outbound Sync

import { createTenantClient } from "@clinic-os/db";

const GHL_BASE_URL = process.env.GHL_API_BASE_URL || "https://services.leadconnectorhq.com";
const GHL_API_VERSION = process.env.GHL_API_VERSION || "2021-07-28";
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || "loc_demo_abundance_clinic";
const GHL_API_KEY = process.env.GHL_API_KEY || process.env.GHL_ACCESS_TOKEN || "";

export interface GHLContactPayload {
  id?: string;
  locationId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  customFields?: Array<{ id: string; key: string; value: any }>;
  source?: string;
  dateAdded?: string;
}

export interface GHLAppointmentPayload {
  id?: string;
  calendarId?: string;
  locationId?: string;
  contactId?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  status?: "new" | "confirmed" | "cancelled" | "showed" | "noshow" | "invalid";
  notes?: string;
}

/**
 * HighLevel API Request Wrapper
 */
async function ghlRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${GHL_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Version: GHL_API_VERSION,
    Authorization: `Bearer ${GHL_API_KEY}`,
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[GHL API] Warning on ${endpoint}: ${res.status} - ${errText}`);
      return { ok: false, status: res.status, error: errText };
    }
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (error: any) {
    console.error(`[GHL API] Fetch failed for ${endpoint}:`, error.message);
    return { ok: false, status: 500, error: error.message };
  }
}

/**
 * Syncs a Clinic-OS Patient to GoHighLevel as a Contact
 */
export async function syncPatientToGHL(patient: {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  ghlContactId?: string | null;
  tags?: string[];
}) {
  const payload = {
    locationId: GHL_LOCATION_ID,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email || undefined,
    phone: patient.phone,
    tags: [...(patient.tags || []), "Clinic-OS"],
    customFields: [
      { key: "clinic_patient_id", field_value: patient.id },
    ],
  };

  // If already linked, update contact; otherwise create
  if (patient.ghlContactId) {
    return await ghlRequest(`/contacts/${patient.ghlContactId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } else {
    return await ghlRequest(`/contacts/upsert`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Adds Tags to a GoHighLevel Contact (e.g. "Consulta Realizada", "Cirugía Confirmada")
 */
export async function addGHLTag(ghlContactId: string, tags: string[]) {
  if (!ghlContactId) return { ok: false, error: "Missing ghlContactId" };

  return await ghlRequest(`/contacts/${ghlContactId}/tags`, {
    method: "POST",
    body: JSON.stringify({ tags }),
  });
}

/**
 * Ingests an inbound HighLevel Contact Event into Clinic-OS
 * HighLevel is the CRM; Clinic-OS organizes the clinical records (Patient).
 */
export async function processGHLContactWebhook(
  workspaceId: string,
  contact: GHLContactPayload
) {
  const db = createTenantClient(workspaceId, "system", "CLINIC_ADMIN");

  const phone = contact.phone || `+549110000${Math.floor(Math.random() * 9000 + 1000)}`;
  const firstName = contact.firstName || contact.name?.split(" ")[0] || "Contacto";
  const lastName = contact.lastName || contact.name?.split(" ").slice(1).join(" ") || "HighLevel";
  const ghlContactId = contact.id || `ghl_${Date.now()}`;
  const tags = contact.tags || [];

  // Check if patient already exists by phone or ghlContactId
  let patient = await db.patient.findFirst({
    where: {
      OR: [
        { phone },
        { ghlContactId },
      ],
    },
  });

  if (patient) {
    // Update patient with fresh HighLevel details
    patient = await db.patient.update({
      where: { id: patient.id },
      data: {
        ghlContactId,
        ghlTags: Array.from(new Set([...patient.ghlTags, ...tags])),
        email: contact.email || patient.email,
        firstName: firstName !== "Contacto" ? firstName : patient.firstName,
        lastName: lastName !== "HighLevel" ? lastName : patient.lastName,
      },
    });
  } else {
    // Create new patient record from HighLevel CRM Lead
    patient = await db.patient.create({
      data: {
        workspaceId,
        firstName,
        lastName,
        phone,
        email: contact.email || null,
        ghlContactId,
        ghlTags: tags,
        status: "LEAD_TRIAGE",
        triageSource: "HIGHLEVEL",
        triageNotes: `Ingresado desde GoHighLevel CRM (ID: ${ghlContactId}) el ${new Date().toISOString()}`,
      },
    });
  }

  return { success: true, patientId: patient.id, patient };
}

/**
 * Ingests an inbound HighLevel Appointment Event into Clinic-OS Agenda
 */
export async function processGHLAppointmentWebhook(
  workspaceId: string,
  appointment: GHLAppointmentPayload
) {
  const db = createTenantClient(workspaceId, "system", "CLINIC_ADMIN");

  const ghlAppointmentId = appointment.id || `ghl_app_${Date.now()}`;
  const startTime = appointment.startTime ? new Date(appointment.startTime) : new Date();
  const endTime = appointment.endTime ? new Date(appointment.endTime) : new Date(startTime.getTime() + 45 * 60 * 1000);

  // 1. Resolve Patient
  let patient = appointment.contactId
    ? await db.patient.findFirst({ where: { ghlContactId: appointment.contactId } })
    : null;

  if (!patient) {
    // Create placeholder patient if contact doesn't exist yet
    patient = await db.patient.create({
      data: {
        workspaceId,
        firstName: "Paciente",
        lastName: `GHL #${ghlAppointmentId.slice(-4)}`,
        phone: `+54911${Math.floor(Math.random() * 90000000 + 10000000)}`,
        ghlContactId: appointment.contactId || null,
        ghlTags: ["HighLevel-Calendar"],
        status: "SCHEDULED",
        triageSource: "HIGHLEVEL",
      },
    });
  }

  // 2. Resolve Doctor (First available doctor in workspace)
  const doctor = await db.user.findFirst({
    where: { role: { in: ["DOCTOR", "CLINIC_ADMIN"] } },
  });

  if (!doctor) {
    throw new Error("No doctor found in workspace to assign appointment");
  }

  // Map GHL status to Clinic-OS status
  const statusMap: Record<string, "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"> = {
    new: "PENDING",
    confirmed: "CONFIRMED",
    cancelled: "CANCELLED",
    noshow: "CANCELLED",
    showed: "COMPLETED",
  };
  const status = statusMap[appointment.status || "confirmed"] || "CONFIRMED";

  // 3. Upsert Appointment
  const existing = await db.appointment.findFirst({
    where: { ghlAppointmentId },
  });

  let clinicApp;
  if (existing) {
    clinicApp = await db.appointment.update({
      where: { id: existing.id },
      data: {
        startTime,
        endTime,
        status,
        notes: appointment.notes || existing.notes,
      },
    });
  } else {
    clinicApp = await db.appointment.create({
      data: {
        workspaceId,
        patientId: patient.id,
        doctorId: doctor.id,
        startTime,
        endTime,
        status,
        type: "CONSULTATION",
        ghlAppointmentId,
        notes: appointment.notes || `Agendado automáticamente desde GoHighLevel (ID: ${ghlAppointmentId})`,
      },
    });
  }

  return { success: true, appointmentId: clinicApp.id, clinicApp };
}
