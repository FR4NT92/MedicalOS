import { strictEqual, ok } from 'node:assert';

async function main() {
  console.log('Testing Abundance Clinic OS - Proactive AI Triage & Conversion...\n');

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
  console.log('1. Logged in as:', loginData.user.name, '(Workspace:', loginData.user.workspaceId, ')');

  // 2. Fetch initial state
  const state1 = await (await fetch('http://127.0.0.1:3000/api/state', { headers: { cookie } })).json();
  console.log('2. Initial leads count:', state1.leads.length);

  // 3. Run Batch AI Triage
  const triageRes = await fetch('http://127.0.0.1:3000/api/leads/ai-triage', {
    method: 'POST',
    headers: { cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
    body: JSON.stringify({})
  });
  strictEqual(triageRes.status, 200);
  const triageData = await triageRes.json();
  console.log('3. AI Triage executed. Triaged leads count:', triageData.triagedCount);

  // 4. Verify triaged leads
  const state2 = await (await fetch('http://127.0.0.1:3000/api/state', { headers: { cookie } })).json();
  const triaged = state2.leads.filter(l => l.aiTriage);
  console.log('4. Leads with AI recommendation:', triaged.length);
  for (const l of triaged) {
    console.log(`   - [${l.status}] ${l.name}: "${l.interest}" -> ${l.aiTriage.specialty} (${l.aiTriage.priorityLabel}) -> ${l.aiTriage.suggestedDoctorName}`);
  }

  // 5. Convert lead to patient in 1 click
  const leadToConvert = triaged[0];
  const convertRes = await fetch(`http://127.0.0.1:3000/api/leads/${leadToConvert.id}/convert-to-patient`, {
    method: 'POST',
    headers: { cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
    body: JSON.stringify({})
  });
  strictEqual(convertRes.status, 200);
  const convertData = await convertRes.json();
  console.log(`5. 1-Click conversion: Lead ${convertData.leadId} converted to Patient: ${convertData.patient.firstName} ${convertData.patient.lastName}`);
  ok(convertData.patient.id);

  // 6. Verify lead stage updated to CONVERTED
  const state3 = await (await fetch('http://127.0.0.1:3000/api/state', { headers: { cookie } })).json();
  const updatedLead = state3.leads.find(l => l.id === leadToConvert.id);
  strictEqual(updatedLead.status, 'CONVERTED');
  console.log('6. Verified lead status is now CONVERTED in database.');

  console.log('\n>>> PROACTIVE AI TRIAGE & ADMISSIONS TESTS PASSED 100% <<<');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
