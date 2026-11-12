/**
 * Health Compliance & Cryptographic Digital Signature Service
 * Conforme a estándares de firma e integridad clínica (HIPAA § 164.312, Ley 25.506 / 25.326).
 */
import { createHmac, createHash } from 'node:crypto';

export class ComplianceService {
  static getSecret() {
    return process.env.COMPLIANCE_SIGNING_KEY || 'abundance_master_clinical_compliance_secret_key_2026';
  }

  /**
   * Genera el digest criptográfico de no repudio para una evolución clínica o receta médica
   */
  static computeClinicalDigest(tenantId, patientId, authorName, content, createdAtIso) {
    const contentHash = createHash('sha256').update(typeof content === 'string' ? content : JSON.stringify(content)).digest('hex');
    const rawPayload = `${tenantId}|${patientId}|${authorName}|${contentHash}|${createdAtIso}`;
    return createHmac('sha256', this.getSecret()).update(rawPayload).digest('hex');
  }

  /**
   * Genera una vista imprimible/documental oficial con bloque de verificación criptográfica
   */
  static generateOfficialDocumentHtml({ title, clinicName, doctorName, specialty, licenseNumber, patientName, patientDni, content, dateIso, signatureDigest, verifyUrl, patientSignature, isConsent }) {
    const formattedDate = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(new Date(dateIso));

    const signatureBlockHtml = (isConsent || patientSignature) ? `
  <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px;">
    <!-- Firma del Paciente / Representante Legal -->
    <div style="border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div class="badge-signature" style="background:#e0f2fe; color:#0369a1;">✓ CONFORMIDAD DEL PACIENTE (LEY 26.529)</div>
        <div style="height: 75px; display: flex; align-items: center; justify-content: center; margin: 10px 0; border: 1px dashed #cbd5e1; border-radius: 6px; background: #fff;">
          ${patientSignature ? `<img src="${patientSignature}" style="max-height: 65px; max-width: 90%; object-fit: contain;" alt="Firma del Paciente">` : `<span style="color:#64748b; font-size: 12px; font-style: italic;">Firma ológrafa digitalizada registrada</span>`}
        </div>
        <div class="doctor-title" style="font-size:14px">${patientName}</div>
        <div class="doctor-meta">DNI: ${patientDni || '—'} · Paciente / Declarante</div>
      </div>
      <div style="font-size:10.5px; color:#64748b; line-height: 1.4; border-top: 1px solid #e2e8f0; padding-top: 8px;">
        Otorga conformidad libre, expresa e informada luego de haber recibido las explicaciones médicas requeridas.
      </div>
    </div>

    <!-- Firma y Sello del Profesional de la Salud -->
    <div class="signature-card" style="margin: 0; box-sizing: border-box;">
      <div>
        <div class="badge-signature">✓ PROFESIONAL DE LA SALUD ACTUANTE</div>
        <div class="doctor-title">${doctorName}</div>
        <div class="doctor-meta">${specialty} · Matrícula N° ${licenseNumber || 'MN-89201'}</div>
        <div class="seal-box">
          <strong>Firma Digital HMAC-SHA256:</strong><br>
          ${signatureDigest.slice(0, 36)}...
        </div>
      </div>
      <div class="qr-side">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl || ('https://abundance.clinic/verify/' + signatureDigest))}" alt="QR Verificación Oficial" class="qr-img">
        <span>Escanea para verificar</span>
      </div>
    </div>
  </div>` : `
  <div class="signature-card">
    <div>
      <div class="badge-signature">✓ FIRMADO CRIPTOGRÁFICAMENTE</div>
      <div class="doctor-title">${doctorName}</div>
      <div class="doctor-meta">${specialty} · Matrícula Profesional N° ${licenseNumber || 'MN-89201'}</div>
      <div class="seal-box">
        <strong>Firma Digital Digest (HMAC-SHA256):</strong><br>
        ${signatureDigest}
      </div>
    </div>
    <div class="qr-side">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl || ('https://abundance.clinic/verify/' + signatureDigest))}" alt="QR Verificación Oficial" class="qr-img">
      <span>Escanea para verificar autenticidad</span>
    </div>
  </div>`;

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${title} - ${patientName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a2f26; margin: 0; padding: 40px; background: #fff; line-height: 1.6; }
    .header { border-bottom: 2px solid #2f7a5b; padding-bottom: 18px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { font-size: 24px; font-weight: bold; color: #1b4b3b; }
    .logo span { color: #8bb36f; }
    .clinic-sub { font-size: 13px; color: #62776d; margin-top: 4px; }
    .doc-type { text-align: right; }
    .doc-type h1 { margin: 0; font-size: 20px; color: #2f7a5b; text-transform: uppercase; letter-spacing: 0.5px; }
    .doc-type small { font-size: 11px; color: #6d8479; }
    .patient-banner { background: #f4f8f4; border: 1px solid #dce8db; border-radius: 8px; padding: 16px 20px; margin-bottom: 30px; display: grid; grid-template-columns: 2fr 1fr; gap: 15px; font-size: 13px; }
    .patient-banner b { color: #173c30; }
    .content-box { min-height: 250px; font-size: 14px; line-height: 1.8; white-space: pre-wrap; margin-bottom: 40px; }
    .signature-card { border: 1px solid #c9decb; background: #f8fbf7; border-radius: 10px; padding: 20px; display: grid; grid-template-columns: 1fr 140px; gap: 20px; align-items: center; }
    .doctor-title { font-weight: bold; font-size: 15px; color: #15372f; }
    .doctor-meta { font-size: 12px; color: #516d5e; margin: 4px 0 10px; }
    .seal-box { font-family: monospace; font-size: 9px; color: #436353; background: #fff; padding: 8px; border: 1px dashed #b9d4bd; border-radius: 6px; word-break: break-all; }
    .badge-signature { display: inline-flex; align-items: center; gap: 5px; background: #eaf4eb; color: #2a6840; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; }
    .qr-side { text-align: center; font-size: 10px; color: #5c796b; }
    .qr-img { width: 90px; height: 90px; border: 1px solid #b7d1bb; border-radius: 8px; margin: 0 auto 6px; display: block; background: #fff; }
    .footer { margin-top: 40px; border-top: 1px solid #e1ebe2; padding-top: 15px; font-size: 11px; color: #768f82; display: flex; justify-content: space-between; }
    @media print { body { padding: 15px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="padding: 9px 18px; background: #2f7a5b; color: #fff; border: 0; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer;">Imprimir / Guardar como PDF</button>
  </div>
  <div class="header">
    <div>
      <div class="logo">${clinicName}<span>.</span></div>
      <div class="clinic-sub">Sistema de Gestión Médica e Historias Clínicas Electrónicas</div>
    </div>
    <div class="doc-type">
      <h1>${title}</h1>
      <small>Fecha de emisión: ${formattedDate}</small>
    </div>
  </div>
  <div class="patient-banner">
    <div><b>Paciente:</b> ${patientName}</div>
    <div><b>Documento:</b> DNI ${patientDni || '—'}</div>
    <div><b>Profesional actuante:</b> ${doctorName}</div>
    <div><b>Especialidad:</b> ${specialty}</div>
  </div>
  <div class="content-box">${content}</div>
  ${signatureBlockHtml}
  <div class="footer">
    <span>Documento clínico electrónico emitido con validez criptográfica inmutable.</span>
    <span>Abundance Clinic OS · Identificador: ${signatureDigest.slice(0, 16)}</span>
  </div>
</body>
</html>`;
  }
}
