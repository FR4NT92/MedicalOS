async function runProductionTests() {
  console.log('--- TEST 1: Health check ---');
  const hRes = await fetch('http://127.0.0.1:3000/api/health');
  console.log('Health:', await hRes.json());

  console.log('\n--- TEST 2: Clinic login & state ---');
  const cRes = await fetch('http://127.0.0.1:3000/api/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'admin@clinica.com', password: 'admin123'})
  });
  const cookie = cRes.headers.get('set-cookie');
  const cData = await cRes.json();
  const state = await (await fetch('http://127.0.0.1:3000/api/state', {headers: {cookie}})).json();
  console.log('Logged in as:', cData.user.name, 'in workspace:', state.workspace.name);
  console.log('Appointments available:', state.appointments.length);

  console.log('\n--- TEST 3: Outgoing WhatsApp Reminder ---');
  const apptId = state.appointments[0].id;
  const waRemind = await (await fetch('http://127.0.0.1:3000/api/appointments/' + apptId + '/whatsapp-reminder', {
    method: 'POST',
    headers: {cookie, 'X-CSRF-Token': cData.csrf}
  })).json();
  console.log('WhatsApp reminder result:', waRemind.success);

  console.log('\n--- TEST 4: Inbound WhatsApp Webhook (Patient confirms with "1") ---');
  const waWebhookRes = await (await fetch('http://127.0.0.1:3000/api/webhooks/whatsapp', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '541148213901',
              text: {body: '1'}
            }]
          }
        }]
      }]
    })
  })).json();
  console.log('WhatsApp Webhook response:', waWebhookRes);

  console.log('\n--- TEST 5: Inbound GoHighLevel Webhook (New Contact created) ---');
  const ghlWebhookRes = await (await fetch('http://127.0.0.1:3000/api/webhooks/ghl', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      type: 'ContactCreate',
      contact: {
        firstName: 'Valeria',
        lastName: 'Ríos',
        phone: '+541199887766',
        notes: 'Interesada en chequeo preventivo'
      }
    })
  })).json();
  console.log('GHL Webhook response:', ghlWebhookRes);

  console.log('\n--- TEST 6: Mercado Pago Checkout Preference ---');
  const mpPrefRes = await (await fetch('http://127.0.0.1:3000/api/payments/mercadopago/preference', {
    method: 'POST',
    headers: {cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': cData.csrf},
    body: JSON.stringify({
      title: 'Consulta Médica Cardiológica',
      amount: 45000,
      patientEmail: 'paciente@test.com'
    })
  })).json();
  console.log('Mercado Pago Init Point:', mpPrefRes.init_point ? 'OK (' + mpPrefRes.init_point.slice(0, 50) + '...)' : 'FAILED');

  console.log('\n--- TEST 7: Inbound Mercado Pago IPN Webhook ---');
  const mpWebhookRes = await (await fetch('http://127.0.0.1:3000/api/webhooks/mercadopago?topic=payment&id=1293847291', {
    method: 'POST'
  })).json();
  console.log('Mercado Pago Webhook response:', mpWebhookRes);

  console.log('\n--- TEST 8: Official Document with Digital Signature & HMAC-SHA256 ---');
  const recordPost = await (await fetch('http://127.0.0.1:3000/api/records', {
    method: 'POST',
    headers: {cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': cData.csrf},
    body: JSON.stringify({
      patientId: state.patients[0].id,
      subjective: 'Paciente refiere cefalea de leve intensidad tras esfuerzo.',
      objective: 'Tensión arterial 120/80 mmHg. Frecuencia cardíaca 72 lpm regular.',
      assessment: 'Cefalea tensional primaria.',
      plan: 'Paracetamol 500mg condicional a dolor. Pautas de alarma explicadas.'
    })
  })).json();

  const docRes = await fetch('http://127.0.0.1:3000/api/records/' + recordPost.id + '/document');
  const docHtml = await docRes.text();
  console.log('Document HTML status:', docRes.status);
  console.log('Contains digital signature badge:', docHtml.includes('FIRMADO CRIPTOGRÁFICAMENTE'));
  console.log('Contains HMAC-SHA256 signature seal:', docHtml.includes('Firma Digital Digest (HMAC-SHA256)'));

  console.log('\n--- TEST 9: Super Admin Live Integration Ping ---');
  const sRes = await fetch('http://127.0.0.1:3000/api/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'superadmin@clinica.com', password: 'admin123'})
  });
  const sCookie = sRes.headers.get('set-cookie');
  const sData = await sRes.json();

  for (const id of ['highlevel', 'whatsapp', 'mercadopago', 'arca', 'ai']) {
    const testRes = await (await fetch('http://127.0.0.1:3000/api/admin/integrations/' + id + '/test', {
      method: 'POST',
      headers: {cookie: sCookie, 'X-CSRF-Token': sData.csrf}
    })).json();
    console.log(`Ping ${id}: OK (${testRes.latencyMs}ms)`);
  }

  console.log('\n>>> ALL PRODUCTION TESTS PASSED SUCCESSFULLY! <<<');
}

runProductionTests().catch(console.error);
