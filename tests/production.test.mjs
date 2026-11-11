import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'clinic-os-prod-test-'));
const dbFile = join(dir, 'test-prod-' + Date.now() + '.sqlite');
const PORT = '3789';
const base = `http://127.0.0.1:${PORT}`;
let child, admin, superadmin;

async function start() {
  child = spawn(process.execPath, [join(root, 'apps/web/server.mjs')], {
    env: { ...process.env, PORT, CLINIC_DB: dbFile, NODE_ENV: 'production', ALLOWED_HOSTS: `127.0.0.1:${PORT},localhost:${PORT}` },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(base + '/api/health');
      if (r.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 50));
  }
  throw Error('Server startup failed');
}

async function stop() {
  if (child && !child.killed) {
    await new Promise(resolve => {
      child.once('exit', resolve);
      child.kill('SIGTERM');
    });
  }
}

async function req(path, { method = 'GET', data, session, headers = {} } = {}) {
  const r = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Cookie: session.cookie, 'X-CSRF-Token': session.csrf } : {}),
      ...headers
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) })
  });
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, body, headers: r.headers };
}

async function login(email, password) {
  const r = await req('/api/login', { method: 'POST', data: { email, password } });
  assert.equal(r.status, 200, 'Login failed: ' + JSON.stringify(r.body));
  return {
    cookie: r.headers.get('set-cookie').split(';')[0],
    csrf: r.body.csrf,
    user: r.body.user
  };
}

describe('Abundance Clinic OS - Validación Integral de Software Productivo', () => {
  before(async () => {
    try { rmSync(dbFile, { force: true }); } catch {}
    await start();
    admin = await login('admin@clinica.com', 'admin123');
    superadmin = await login('superadmin@clinica.com', 'admin123');
  });

  after(async () => {
    await stop();
    rmSync(dir, { recursive: true, force: true });
  });

  it('01 · Health check responde en modo productivo activo', async () => {
    const r = await req('/api/health');
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'ok');
  });

  it('02 · Autenticación y sesión clínica multi-tenant funcional', async () => {
    const r = await req('/api/session', { session: admin });
    assert.equal(r.status, 200);
    assert.equal(r.body.user.role, 'CLINIC_ADMIN');
    assert.equal(r.body.workspace.id, 'clinic-central');
    assert.ok(r.body.csrf);
  });

  it('03 · Alta y listado de pacientes con persistencia', async () => {
    const pData = {
      firstName: 'Federico',
      lastName: 'García',
      dni: '38.921.442',
      phone: '+541149201928',
      coverage: 'OSDE 310'
    };
    const createRes = await req('/api/patients', { method: 'POST', session: admin, data: pData });
    assert.equal(createRes.status, 201);
    assert.ok(createRes.body.id);

    const stateRes = await req('/api/state', { session: admin });
    assert.equal(stateRes.status, 200);
    assert.ok(stateRes.body.patients.some(p => p.id === createRes.body.id));
  });

  it('04 · Gestión de turnos y validación de disponibilidad horaria', async () => {
    const apptData = {
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      startAt: '2026-11-20T10:00:00-03:00',
      duration: 30,
      type: 'CONSULTATION',
      status: 'CONFIRMED',
      notes: 'Control cardiológico'
    };
    const res = await req('/api/appointments', { method: 'POST', session: admin, data: apptData });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'CONFIRMED');

    // Superposición debe ser rechazada con 409
    const conflictRes = await req('/api/appointments', { method: 'POST', session: admin, data: apptData });
    assert.equal(conflictRes.status, 409);
  });

  it('05 · Emisión de Receta Médica Electrónica con validez legal', async () => {
    const prescData = {
      patientId: 'patient-1',
      content: 'Paracetamol 500mg: 1 comprimido cada 8hs por 5 días.\nReposo clínico por 48hs.'
    };
    const res = await req('/api/prescriptions', { method: 'POST', session: admin, data: prescData });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'ACTIVE');
    assert.equal(res.body.legalValidity, true);

    // Documento HTML oficial con QR imprimible
    const docRes = await req(`/api/prescriptions/${res.body.id}/document`);
    assert.equal(docRes.status, 200);
    assert.ok(typeof docRes.body === 'string');
    assert.ok(docRes.body.includes('FIRMADO CRIPTOGRÁFICAMENTE'));
    assert.ok(docRes.body.includes('api.qrserver.com'));
  });

  it('06 · Emisión de Factura Oficial con CAE y QR RG 4291/4597 de ARCA', async () => {
    const invData = {
      patientId: 'patient-1',
      concept: 'Honorarios Médicos Consulta Especializada',
      amount: 45000,
      invoiceType: 'B'
    };
    const res = await req('/api/invoices', { method: 'POST', session: admin, data: invData });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'ISSUED');
    assert.ok(res.body.cae, 'Debe poseer código CAE');
    assert.ok(res.body.caeVto, 'Debe poseer fecha de vencimiento de CAE');
    assert.ok(res.body.qrUrl, 'Debe poseer URL normativa de QR ARCA/AFIP');
    assert.ok(res.body.qrUrl.includes('https://www.afip.gob.ar/fe/qr/?p='));

    // Documento fiscal imprimible
    const docRes = await req(`/api/invoices/${res.body.id}/document`);
    assert.equal(docRes.status, 200);
    assert.ok(typeof docRes.body === 'string');
    assert.ok(docRes.body.includes('AUTORIZADO POR ARCA (AFIP)'));
    assert.ok(docRes.body.includes(res.body.cae));

    // Compartir por WhatsApp
    const waRes = await req(`/api/invoices/${res.body.id}/whatsapp`, { method: 'POST', session: admin });
    assert.equal(waRes.status, 200);
    assert.ok(waRes.body.waLink.startsWith('https://wa.me/'));
  });

  it('07 · Gestión de Inventario de Insumos Clínicos y Auditoría', async () => {
    // Listar inventario inicial
    const state = await req('/api/state', { session: admin });
    const initialItem = state.body.inventory[0];
    assert.ok(initialItem, 'Debe haber insumos cargados en el inventario');

    // Registrar ajuste de stock
    const adjustRes = await req(`/api/inventory/${initialItem.id}/adjust`, {
      method: 'POST',
      session: admin,
      data: { delta: 10, reason: 'Ingreso por reposición de droguería' }
    });
    assert.equal(adjustRes.status, 200);
    assert.equal(adjustRes.body.quantity, initialItem.quantity + 10);
  });

  it('08 · Firma criptográfica e inmutabilidad de Historias Clínicas (SOAP)', async () => {
    const recData = {
      patientId: 'patient-1',
      subjective: 'Paciente refiere cefalea de 48hs de evolución.',
      objective: 'Tensión arterial 120/80 mmHg. Afebril.',
      assessment: 'Cefalea tensional primaria.',
      plan: 'Medicación sintomática y control en 7 días.'
    };
    const res = await req('/api/records', { method: 'POST', session: admin, data: recData });
    assert.equal(res.status, 201);
    assert.ok(res.body.hash);

    // Intento de edición directa prohibido por ley de historia clínica
    const patchRes = await req(`/api/records/${res.body.id}`, { method: 'PATCH', session: admin, data: { subjective: 'Alterado' } });
    assert.equal(patchRes.status, 405);
  });

  it('09 · Panel Super Admin centralizado de clínicas', async () => {
    const adminRes = await req('/api/admin', { session: superadmin });
    assert.equal(adminRes.status, 200);
    assert.ok(Array.isArray(adminRes.body.workspaces));
    assert.ok(adminRes.body.workspaces.length >= 2);
  });
});
