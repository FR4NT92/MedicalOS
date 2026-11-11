import { strictEqual, ok } from 'node:assert';

async function main() {
  console.log('Testing Abundance Clinic OS - Medical History & Informed Consents...\n');

  // 1. Login
  const loginRes = await fetch('http://127.0.0.1:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@clinica.com', password: 'admin123' })
  });
  strictEqual(loginRes.status, 200);
  const cookie = loginRes.headers.get('set-cookie');
  const loginData = await loginRes.json();
  const csrf = loginData.csrf;
  console.log('1. Logged in as:', loginData.user.name);

  // 2. Fetch state and check medical history
  const state = await (await fetch('http://127.0.0.1:3000/api/state', { headers: { cookie } })).json();
  const patientWithAllergies = state.patients.find(p => p.id === 'patient-2');
  ok(patientWithAllergies);
  ok(patientWithAllergies.medicalHistory);
  console.log('2. Patient Bruno Rossi medical history:');
  console.log('   - Alergias:', patientWithAllergies.medicalHistory.allergies);
  console.log('   - Patológicos:', patientWithAllergies.medicalHistory.pathological);
  console.log('   - Medicación:', patientWithAllergies.medicalHistory.medications);

  // 3. Update medical history via dedicated endpoint
  const updateRes = await fetch(`http://127.0.0.1:3000/api/patients/${patientWithAllergies.id}/medical-history`, {
    method: 'PATCH',
    headers: { cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
    body: JSON.stringify({
      allergies: 'Alergia severa a Penicilina (anafilaxia previa) y AINEs',
      pathological: 'Hipertensión Arterial Grado 2, Cardiopatía hipertensiva incipiente',
      surgical: 'Colecistectomía laparoscópica (2019)',
      medications: 'Enalapril 10mg / 12h, Carvedilol 6.25mg / día',
      familyHistory: 'Padre con IAM a los 58 años',
      habits: 'Ex fumador. Caminatas diarias.'
    })
  });
  strictEqual(updateRes.status, 200);
  const updateData = await updateRes.json();
  console.log('3. Medical history updated successfully:', updateData.success);
  strictEqual(updateData.medicalHistory.allergies, 'Alergia severa a Penicilina (anafilaxia previa) y AINEs');

  // 4. Create Informed Consent
  const consentRes = await fetch('http://127.0.0.1:3000/api/consents', {
    method: 'POST',
    headers: { cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
    body: JSON.stringify({
      patientId: patientWithAllergies.id,
      doctorId: 'doctor-1',
      title: 'Consentimiento para Punción y Biopsia Diagnóstica Ambulatoria',
      type: 'PROCEDURE',
      content: 'El paciente otorga su consentimiento informado tras haber recibido explicación detallada de la toma de muestra bajo anestesia local, habiéndose advertido la alergia a penicilina y AINEs.'
    })
  });
  strictEqual(consentRes.status, 201);
  const consentData = await consentRes.json();
  console.log('4. Informed consent created:');
  console.log('   - ID:', consentData.id);
  console.log('   - Título:', consentData.title);
  console.log('   - Firma digital HMAC-SHA256:', consentData.hash.slice(0, 32) + '...');

  // 5. Download official document
  const docRes = await fetch(`http://127.0.0.1:3000/api/consents/${consentData.id}/document`);
  strictEqual(docRes.status, 200);
  const html = await docRes.text();
  ok(html.includes('Consentimiento para Punción y Biopsia'));
  ok(html.includes('badge-signature') || html.includes('FIRMADO CRIPTOGRÁFICAMENTE'));
  console.log('5. Official Printable Consent Document rendered (Status 200, contains signature seal).');

  console.log('\n>>> MEDICAL HISTORY & INFORMED CONSENTS VERIFIED 100% <<<');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
