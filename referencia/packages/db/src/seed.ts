// packages/db/src/seed.ts
import { prisma } from "./index";
import crypto from "crypto";

async function main() {
  console.log("Seeding Clinic-OS Multi-tenant Database...");

  // 1. Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "clinica-buenos-aires" },
    update: {},
    create: {
      name: "Clínica Buenos Aires",
      slug: "clinica-buenos-aires",
      taxId: "30-71429810-4",
      brandColor: "#589972",
      timezone: "America/Argentina/Buenos_Aires",
      phone: "+54 9 11 4821-9000",
      email: "recepcion@clinicabuenosaires.com.ar",
      address: "Av. Santa Fe 3205, Palermo, CABA",
    },
  });

  console.log(`Workspace created: ${workspace.name} (${workspace.id})`);

  // 2. Doctor / Admin
  const doctor = await prisma.user.upsert({
    where: {
      workspaceId_email: {
        workspaceId: workspace.id,
        email: "mariana.morales@clinicabuenosaires.com.ar",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      email: "mariana.morales@clinicabuenosaires.com.ar",
      name: "Dra. Mariana Morales",
      role: "DOCTOR",
      specialty: "Cirugía Plástica & Reparadora",
      licenseNumber: "MN 142.890",
      phone: "+54 9 11 5555-0101",
    },
  });

  console.log(`Doctor created: ${doctor.name} (${doctor.licenseNumber})`);

  // 3. Patients
  const patient1 = await prisma.patient.upsert({
    where: {
      workspaceId_phone: {
        workspaceId: workspace.id,
        phone: "+5491144440001",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      firstName: "Federico",
      lastName: "Diaz",
      dni: "34.892.110",
      email: "federico.diaz@gmail.com",
      phone: "+5491144440001",
      status: "ACTIVE",
      healthInsuranceName: "OSDE",
      healthInsurancePlan: "Plan 310",
      affiliateNumber: "18-4902110-02",
      insuranceValidated: true,
      triageUrgency: "HIGH",
      triageNotes: "Postoperatorio reciente. Drenaje serohemático leve en flanco izquierdo.",
      triageSymptoms: ["Dolor leve", "Drenaje controlado"],
      preferredSchedule: "Mediodía",
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: {
      workspaceId_phone: {
        workspaceId: workspace.id,
        phone: "+5491144440002",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      firstName: "Lucía",
      lastName: "Méndez",
      dni: "39.112.554",
      email: "lucia.mendez@outlook.com",
      phone: "+5491144440002",
      status: "LEAD_TRIAGE",
      healthInsuranceName: "Swiss Medical",
      healthInsurancePlan: "SMG20",
      affiliateNumber: "77-389124-01",
      insuranceValidated: true,
      triageUrgency: "MEDIUM",
      triageNotes: "Consulta estética mamaria. Lead captado por WhatsApp LeadConnector.",
      triageSymptoms: ["Asimetría mamaria", "Deseo de recambio protésico"],
      preferredSchedule: "Tardes",
      triageSource: "WHATSAPP",
    },
  });

  const patient3 = await prisma.patient.upsert({
    where: {
      workspaceId_phone: {
        workspaceId: workspace.id,
        phone: "+5491144440003",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      firstName: "Carlos",
      lastName: "Sánchez",
      dni: "28.455.901",
      email: "carlos.sanchez@empresa.com",
      phone: "+5491144440003",
      status: "SCHEDULED",
      healthInsuranceName: "Galeno",
      healthInsurancePlan: "Oro",
      affiliateNumber: "09-122394-00",
      insuranceValidated: true,
      triageUrgency: "LOW",
      triageNotes: "Control evolutivo anual.",
      triageSymptoms: ["Control rutinario"],
      preferredSchedule: "Mañanas",
      triageSource: "INSTAGRAM",
    },
  });

  console.log("Patients seeded successfully.");

  // 4. Appointments (in UTC)
  const now = new Date();
  const today1230 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 15, 30, 0)); // 12:30 ART = 15:30 UTC
  const today1315 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 16, 15, 0)); // 13:15 ART = 16:15 UTC

  await prisma.appointment.create({
    data: {
      workspaceId: workspace.id,
      patientId: patient1.id,
      doctorId: doctor.id,
      startTime: today1230,
      endTime: new Date(today1230.getTime() + 45 * 60 * 1000),
      type: "SURGERY",
      status: "CONFIRMED",
      notes: "Quirófano programado - Curación mayor y retiro de suturas.",
    },
  });

  await prisma.appointment.create({
    data: {
      workspaceId: workspace.id,
      patientId: patient3.id,
      doctorId: doctor.id,
      startTime: today1315,
      endTime: new Date(today1315.getTime() + 30 * 60 * 1000),
      type: "CONSULTATION",
      status: "PENDING",
      notes: "Consulta clínica en Consultorio 04.",
    },
  });

  // 5. Append-Only Medical Record (HCE with SHA-256)
  const clinicalContent = {
    subjetivo: "Paciente concurre a control de día 14 postoperatorio de dermolipectomía abdominal.",
    objetivo: "Herida quirúrgica limpia, afrontada, sin signos de flogosis ni dehiscencia.",
    evaluacion: "Evolución postquirúrgica satisfactoria (CIE-10: Z48.8).",
    plan: "Continuar faja compresiva 2 semanas más. Kinesiología de drenaje linfático.",
  };
  const sha256 = crypto.createHash("sha256").update(JSON.stringify(clinicalContent)).digest("hex");

  await prisma.medicalRecord.create({
    data: {
      workspaceId: workspace.id,
      patientId: patient1.id,
      authorId: doctor.id,
      type: "SOAP_NOTE",
      content: clinicalContent,
      diagnosisICD10: "Z48.8",
      diagnosisDescription: "Otros cuidados especificados posteriores a la cirugía",
      contentSha256: sha256,
      isSigned: true,
      signedAt: new Date(),
    },
  });

  // 6. Evidence Ledger Entry
  await prisma.evidenceLedgerEntry.create({
    data: {
      workspaceId: workspace.id,
      patientId: patient2.id,
      sourceMessageId: "msg-meta-wa-9021",
      fieldName: "triageUrgency",
      extractedValue: "MEDIUM",
      confidence: 0.94,
      evidenceQuote: "Hola! Quisiera consultar para hacerme un recambio de prótesis porque siento una molestia del lado derecho desde la semana pasada.",
      verifiedByHuman: true,
      verifiedByUserId: doctor.id,
    },
  });

  console.log("Clinic-OS Seed Completed Successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
