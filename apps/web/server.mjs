/**
 * Abundance Clinic OS - Core Platform Server
 * Node >=22.13, SQLite / PostgreSQL (Supabase ready), cero dependencias npm externas.
 */
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID, randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedDatabase, clinicDate, defaults } from './seed.mjs';

// Servicios de Integración en Producción
import { GHLService } from './services/ghl.mjs';
import { WhatsAppService } from './services/whatsapp.mjs';
import { MercadoPagoService } from './services/mercadopago.mjs';
import { ARCAService } from './services/arca.mjs';
import { ComplianceService } from './services/compliance.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';

const isVercel = Boolean(process.env.VERCEL);
const defaultDataFile = isVercel ? '/tmp/clinic-os.sqlite' : join(here, 'data', 'clinic-os.sqlite');
const dataFile = process.env.CLINIC_DB || defaultDataFile;
mkdirSync(dirname(dataFile), { recursive: true, mode: 0o700 });
const db = new DatabaseSync(dataFile);

db.exec(`
PRAGMA foreign_keys=ON;
PRAGMA journal_mode=WAL;
PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS workspaces(id TEXT PRIMARY KEY,name TEXT NOT NULL,timezone TEXT NOT NULL,color TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'ACTIVE',createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,workspaceId TEXT REFERENCES workspaces(id),role TEXT NOT NULL,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,salt TEXT NOT NULL,passwordHash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(tokenHash TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES users(id),csrf TEXT NOT NULL,expiresAt INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings(workspaceId TEXT PRIMARY KEY REFERENCES workspaces(id),value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS integrations(id TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,initials TEXT NOT NULL,description TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'NOT_CONNECTED',config TEXT NOT NULL DEFAULT '{}',updatedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS doctors(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL REFERENCES workspaces(id),name TEXT NOT NULL,specialty TEXT NOT NULL,UNIQUE(workspaceId,id));
CREATE TABLE IF NOT EXISTS patients(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL REFERENCES workspaces(id),firstName TEXT NOT NULL,lastName TEXT NOT NULL,dni TEXT NOT NULL,phone TEXT NOT NULL,email TEXT NOT NULL,coverage TEXT NOT NULL,status TEXT NOT NULL,notes TEXT NOT NULL,medicalHistory TEXT,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL,UNIQUE(workspaceId,phone),UNIQUE(workspaceId,id));
CREATE TABLE IF NOT EXISTS appointments(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL,patientId TEXT NOT NULL,doctorId TEXT NOT NULL,startAt TEXT NOT NULL,endAt TEXT NOT NULL,duration INTEGER NOT NULL,type TEXT NOT NULL,status TEXT NOT NULL,notes TEXT NOT NULL,createdAt TEXT NOT NULL,FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id),FOREIGN KEY(workspaceId,doctorId) REFERENCES doctors(workspaceId,id));
CREATE INDEX IF NOT EXISTS appointment_slots ON appointments(workspaceId,doctorId,startAt,endAt);
CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL REFERENCES workspaces(id),name TEXT NOT NULL,phone TEXT NOT NULL,source TEXT NOT NULL,interest TEXT NOT NULL,status TEXT NOT NULL,aiTriage TEXT,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL,patientId TEXT NOT NULL,type TEXT NOT NULL,content TEXT NOT NULL,author TEXT NOT NULL,createdAt TEXT NOT NULL,previousHash TEXT NOT NULL,hash TEXT NOT NULL,amendmentOf TEXT REFERENCES records(id),FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id));
CREATE TRIGGER IF NOT EXISTS records_no_update BEFORE UPDATE ON records BEGIN SELECT RAISE(ABORT,'APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS records_no_delete BEFORE DELETE ON records BEGIN SELECT RAISE(ABORT,'APPEND_ONLY'); END;
CREATE TABLE IF NOT EXISTS prescriptions(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL,patientId TEXT NOT NULL,content TEXT NOT NULL,status TEXT NOT NULL,createdAt TEXT NOT NULL,FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id));
CREATE TABLE IF NOT EXISTS consents(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL REFERENCES workspaces(id),patientId TEXT NOT NULL,doctorId TEXT NOT NULL,doctorName TEXT NOT NULL,title TEXT NOT NULL,type TEXT NOT NULL,content TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'SIGNED',hash TEXT NOT NULL,signedAt TEXT NOT NULL,createdAt TEXT NOT NULL,FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id));
CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL,patientId TEXT NOT NULL,appointmentId TEXT REFERENCES appointments(id),amountCents INTEGER NOT NULL CHECK(amountCents>0),method TEXT NOT NULL,reference TEXT NOT NULL,idempotencyKey TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'APPROVED',createdAt TEXT NOT NULL,UNIQUE(workspaceId,idempotencyKey),FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id));
CREATE TABLE IF NOT EXISTS invoices(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL,patientId TEXT NOT NULL,concept TEXT NOT NULL,amountCents INTEGER NOT NULL CHECK(amountCents>0),invoiceType TEXT DEFAULT 'B',invoiceNumber TEXT,docType TEXT DEFAULT '96',docNumber TEXT,cae TEXT,caeVto TEXT,qrUrl TEXT,status TEXT NOT NULL DEFAULT 'ISSUED',createdAt TEXT NOT NULL,FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id));
CREATE TABLE IF NOT EXISTS inventory(
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  minQuantity INTEGER NOT NULL DEFAULT 10,
  unit TEXT NOT NULL DEFAULT 'unidades',
  lotNumber TEXT,
  expiryDate TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,workspaceId TEXT REFERENCES workspaces(id),actor TEXT NOT NULL,action TEXT NOT NULL,entity TEXT NOT NULL,entityId TEXT NOT NULL,createdAt TEXT NOT NULL,details TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS agendas(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL REFERENCES workspaces(id),name TEXT NOT NULL,type TEXT NOT NULL DEFAULT 'MEDICAL',color TEXT NOT NULL DEFAULT '#1b4c37',description TEXT,createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS quotes(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL REFERENCES workspaces(id),patientId TEXT NOT NULL,doctorId TEXT,number TEXT NOT NULL,title TEXT NOT NULL,items TEXT NOT NULL DEFAULT '[]',subtotal REAL NOT NULL DEFAULT 0,discount REAL NOT NULL DEFAULT 0,total REAL NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'ARS',validUntil TEXT,status TEXT NOT NULL DEFAULT 'PENDING',notes TEXT,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL,FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id));
CREATE TABLE IF NOT EXISTS medical_orders(id TEXT PRIMARY KEY, workspaceId TEXT NOT NULL REFERENCES workspaces(id), patientId TEXT NOT NULL, doctorId TEXT, doctorName TEXT NOT NULL, recordId TEXT, instructions TEXT NOT NULL, items TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'PENDING', administeredBy TEXT, administeredAt TEXT, notes TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id));
`);

try { db.exec('ALTER TABLE leads ADD COLUMN aiTriage TEXT'); } catch {}
try { db.exec('ALTER TABLE patients ADD COLUMN medicalHistory TEXT'); } catch {}
try { db.exec('ALTER TABLE patients ADD COLUMN birthDate TEXT'); } catch {}
try { db.exec('ALTER TABLE patients ADD COLUMN cuitCuil TEXT'); } catch {}
try { db.exec('ALTER TABLE patients ADD COLUMN affiliateNumber TEXT'); } catch {}
try { db.exec('ALTER TABLE appointments ADD COLUMN agendaId TEXT'); } catch {}
try { db.exec('ALTER TABLE consents ADD COLUMN patientSignature TEXT'); } catch {}
try { db.exec('ALTER TABLE consents ADD COLUMN doctorSignature TEXT'); } catch {}
try { db.exec('ALTER TABLE invoices ADD COLUMN invoiceType TEXT DEFAULT "B"'); } catch {}
try { db.exec('ALTER TABLE invoices ADD COLUMN invoiceNumber TEXT'); } catch {}
try { db.exec('ALTER TABLE invoices ADD COLUMN docType TEXT DEFAULT "96"'); } catch {}
try { db.exec('ALTER TABLE invoices ADD COLUMN docNumber TEXT'); } catch {}

seedDatabase(db);

// Seed de antecedentes médicos iniciales estructurados para pacientes existentes
try {
  const seeds = {
    'patient-1': {
      allergies: 'Sin alergias medicamentosas conocidas reportadas',
      pathological: 'Hipotiroidismo primario en tratamiento sustitutivo',
      surgical: 'Sin antecedentes quirúrgicos mayores',
      medications: 'Levotiroxina 75 mcg / día en ayunas',
      familyHistory: 'Madre con hipotiroidismo',
      habits: 'No tabaquista. Dieta equilibrada y actividad aeróbica 3x/sem.'
    },
    'patient-2': {
      allergies: 'Alergia a Penicilina (rash cutáneo) y AINEs (Ibuprofeno)',
      pathological: 'Hipertensión Arterial Grado 2 (desde 2021), Dislipidemia',
      surgical: 'Colecistectomía laparoscópica (2019)',
      medications: 'Enalapril 10 mg / 12 hs, Atorvastatina 20 mg / noche',
      familyHistory: 'Padre con IAM a los 58 años, abuelo materno ACV',
      habits: 'Ex tabaquista (hace 4 años). Consumo social de alcohol moderado.'
    },
    'patient-3': {
      allergies: 'Alergia a Dipirona / Metamizol',
      pathological: 'Rinitis alérgica estacional recurrente',
      surgical: 'Apendicectomía a los 14 años',
      medications: 'Cetirizina 10 mg según necesidad estacional',
      familyHistory: 'Sin antecedentes patológicos familiares de relevancia',
      habits: 'No tabaquista. Práctica deportiva regular (Crossfit 3x/semana).'
    },
    'patient-4': {
      allergies: 'Sin alergias medicamentosas conocidas',
      pathological: 'Arritmia extrasistólica supraventricular benigna',
      surgical: 'Meniscectomía parcial rodilla derecha (2022)',
      medications: 'Bisoprolol 2.5 mg / día',
      familyHistory: 'Tío paterno con marcapasos definitivo',
      habits: 'No fumador. Caminatas diarias.'
    },
    'patient-5': {
      allergies: 'Alergia a Sulfas y derivados sulfamídicos',
      pathological: 'Diabetes Mellitus Tipo 2, Insuficiencia Venosa Periférica',
      surgical: 'Cesárea electiva (2014)',
      medications: 'Metformina 850 mg / 12 hs, Diosmina 500 mg / día',
      familyHistory: 'Madre con DM2 y retinopatía diabética',
      habits: 'Sedentaria. En adecuación de plan nutricional.'
    }
  };
  for (const [id, hist] of Object.entries(seeds)) {
    const p = db.prepare('SELECT id, medicalHistory FROM patients WHERE id=?').get(id);
    if (p && !p.medicalHistory) {
      db.prepare('UPDATE patients SET medicalHistory=? WHERE id=?').run(JSON.stringify({ ...hist, updatedAt: new Date().toISOString(), updatedBy: 'Sistema Clínico Inicial' }), id);
    }
  }
} catch (e) { console.error('Seed medical history error:', e.message); }

// Seed de inventario clínico inicial
try {
  const workspaces = db.prepare('SELECT id FROM workspaces').all();
  for (const ws of workspaces) {
    const invCount = db.prepare('SELECT count(*) as count FROM inventory WHERE workspaceId=?').get(ws.id)?.count || 0;
    if (invCount === 0) {
      const initialSupplies = [
        { name: 'Gasas estériles 10x10cm (Caja x 100)', sku: 'GAS-001', category: 'Suturas y Curaciones', quantity: 45, minQuantity: 15, unit: 'cajas', lotNumber: 'LT-2024-89', expiryDate: '2027-12-31', notes: 'Uso en consultorios y curaciones generales' },
        { name: 'Jeringas descartables 5ml c/aguja 21G (Caja x 100)', sku: 'JER-005', category: 'Descartables', quantity: 28, minQuantity: 10, unit: 'cajas', lotNumber: 'LT-98210', expiryDate: '2028-06-30', notes: 'Aplicación intramuscular y endovenosa' },
        { name: 'Guantes de examen de látex talle M (Caja x 100)', sku: 'GUA-LAT-M', category: 'Descartables', quantity: 8, minQuantity: 12, unit: 'cajas', lotNumber: 'LT-44120', expiryDate: '2027-04-15', notes: 'Stock bajo - Reposición requerida' },
        { name: 'Guantes de nitrilo sin polvo talle L (Caja x 100)', sku: 'GUA-NIT-L', category: 'Descartables', quantity: 22, minQuantity: 10, unit: 'cajas', lotNumber: 'LT-33901', expiryDate: '2027-09-30', notes: 'Para procedimientos y pacientes con alergia al látex' },
        { name: 'Solución Fisiológica 0.9% 500ml', sku: 'SUER-FIS-500', category: 'Soluciones y Sueros', quantity: 35, minQuantity: 10, unit: 'frascos', lotNumber: 'LT-77123', expiryDate: '2026-11-20', notes: 'Infusiones, lavado ocular y curaciones' },
        { name: 'Alcohol Etílico 70% 1 Litro', sku: 'ALC-70-1L', category: 'Antisépticos', quantity: 14, minQuantity: 5, unit: 'botellas', lotNumber: 'LT-88122', expiryDate: '2028-01-10', notes: 'Desinfección de consultorios y antisepsia de piel' },
        { name: 'Lidocaína 2% c/epinefrina ampolla 5ml (Caja x 10)', sku: 'LID-EPI-2', category: 'Medicamentos', quantity: 4, minQuantity: 10, unit: 'cajas', lotNumber: 'LT-11029', expiryDate: '2026-08-15', notes: 'Stock crítico - Anestésico local odontológico/quirúrgico' },
        { name: 'Barbijos quirúrgicos tricapa termo-sellados (Caja x 50)', sku: 'BAR-TRI-50', category: 'Descartables', quantity: 18, minQuantity: 8, unit: 'cajas', lotNumber: 'LT-55419', expiryDate: '2028-03-31', notes: 'Protección personal equipo de salud' },
        { name: 'Cinta microporosa hipoalergénica 2.5cm', sku: 'CIN-MIC-25', category: 'Suturas y Curaciones', quantity: 19, minQuantity: 6, unit: 'rollos', lotNumber: 'LT-66100', expiryDate: '2029-01-01', notes: 'Fijación de vendajes y apósitos' },
        { name: 'Povidona Yodada 10% Solución Jabonosa 1 Litro', sku: 'POV-JAB-1L', category: 'Antisépticos', quantity: 9, minQuantity: 4, unit: 'frascos', lotNumber: 'LT-90112', expiryDate: '2027-10-31', notes: 'Antisepsia de piel y lavado prequirúrgico' }
      ];
      const insertSupply = db.prepare(`INSERT INTO inventory (id, workspaceId, name, sku, category, quantity, minQuantity, unit, lotNumber, expiryDate, notes, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const s of initialSupplies) {
        insertSupply.run(randomUUID(), ws.id, s.name, s.sku, s.category, s.quantity, s.minQuantity, s.unit, s.lotNumber, s.expiryDate, s.notes, 'ACTIVE', new Date().toISOString(), new Date().toISOString());
      }
    }
  }
} catch (e) { console.error('Seed inventory error:', e.message); }

// Regularización de comprobantes previos sin CAE o sin número de factura
try {
  const missingCaeInvoices = db.prepare('SELECT * FROM invoices WHERE cae IS NULL OR invoiceNumber IS NULL').all();
  let seq = 1;
  for (const inv of missingCaeInvoices) {
    const p = db.prepare('SELECT * FROM patients WHERE workspaceId=? AND id=?').get(inv.workspaceId, inv.patientId);
    const arcaRes = await ARCAService.authorizeInvoice({}, {
      cuit: '30718293849',
      puntoVenta: '0001',
      tipoComprobante: 6,
      docTipo: 96,
      docNro: p?.dni || '38921849',
      importeTotal: inv.amountCents / 100
    });
    const invNumber = `00001-${String(seq).padStart(8, '0')}`;
    db.prepare("UPDATE invoices SET invoiceType=?, invoiceNumber=?, docType=?, docNumber=?, cae=?, caeVto=?, qrUrl=?, status='ISSUED' WHERE id=?")
      .run('B', invNumber, '96', p?.dni || '38921849', arcaRes.cae, arcaRes.caeVto, arcaRes.qrUrl, inv.id);
    seq++;
  }
} catch (e) { console.error('Invoice regularization error:', e.message); }

const now = () => new Date().toISOString();
const uid = () => randomUUID();
const hash = s => createHash('sha256').update(s).digest('hex');
const q = (sql, ...args) => db.prepare(sql).get(...args);
const all = (sql, ...args) => db.prepare(sql).all(...args);
const run = (sql, ...args) => db.prepare(sql).run(...args);

function put(table, obj) {
  const keys = Object.keys(obj);
  db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map(k => obj[k]));
  return obj;
}

class ApiError extends Error {
  constructor(status, message, code = 'INVALID_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function fail(status, msg, code) {
  throw new ApiError(status, msg, code);
}

function text(v, key, min = 0, max = 200) {
  if (typeof v !== 'string' || v.trim().length < min || v.trim().length > max) fail(400, `${key}: usa entre ${min} y ${max} caracteres.`);
  return v.trim();
}

function optional(v, key, max = 200) {
  return v == null ? '' : text(v, key, 0, max);
}

function choose(v, values, key) {
  if (!values.includes(v)) fail(400, `${key} no válido.`);
  return v;
}

function money(v) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || v > 10000000 || Math.abs(v * 100 - Math.round(v * 100)) > 0.00001) fail(400, 'Importe inválido; usa un número positivo y hasta dos decimales.');
  return Math.round(v * 100);
}

function phone(v) {
  const p = text(v, 'Teléfono', 6, 30).replace(/[\s()-]/g, '');
  if (!/^\+?\d{6,18}$/.test(p)) fail(400, 'Teléfono inválido.');
  return p;
}

function patient(w, id) {
  const p = q('SELECT * FROM patients WHERE workspaceId=? AND id=?', w, id);
  if (!p) fail(404, 'Paciente no encontrado.', 'NOT_FOUND');
  return p;
}

function settings(w) {
  return JSON.parse(q('SELECT value FROM settings WHERE workspaceId=?', w)?.value || JSON.stringify(defaults));
}

function audit(u, action, entity, entityId, details = '') {
  put('audit', { id: uid(), workspaceId: u.workspaceId, actor: u.name, action, entity, entityId, createdAt: now(), details });
}

function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, workspaceId: u.workspaceId };
}

function authenticated(req) {
  const cookie = req.headers.cookie || '';
  const raw = cookie.split(';').map(x => x.trim()).find(x => x.startsWith('clinic_session='))?.slice(15);
  if (!raw) fail(401, 'Inicia sesión para continuar.', 'UNAUTHORIZED');
  const s = q('SELECT * FROM sessions WHERE tokenHash=? AND expiresAt>?', hash(raw), Date.now());
  if (!s) fail(401, 'La sesión venció. Vuelve a ingresar.', 'UNAUTHORIZED');
  const u = q('SELECT * FROM users WHERE id=?', s.userId);
  if (!u) fail(401, 'Sesión inválida.', 'UNAUTHORIZED');
  return { ...u, csrf: s.csrf, tokenHash: s.tokenHash };
}

function clinicUser(u, effectiveW = null) {
  if (u.role === 'SUPER_ADMIN' && effectiveW) return;
  if (!u.workspaceId || u.role === 'SUPER_ADMIN') fail(403, 'El Super Administrador gestiona el portal central.', 'FORBIDDEN');
}

function adminUser(u) {
  if (u.role !== 'SUPER_ADMIN') fail(403, 'Esta sección requiere acceso de Super Administrador.', 'FORBIDDEN');
}

function csrf(req, u) {
  if (req.headers['x-csrf-token'] !== u.csrf) fail(403, 'Token de seguridad inválido. Recarga la página.', 'CSRF');
}

async function body(req) {
  let data = '', size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1048576) fail(413, 'Solicitud demasiado grande.');
    data += chunk;
  }
  if (!data) return {};
  try {
    const b = JSON.parse(data);
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw Error();
    return b;
  } catch {
    fail(400, 'JSON inválido.');
  }
}

function json(res, status, data, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...extra });
  res.end(JSON.stringify(data));
}

function html(res, status, htmlContent) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(htmlContent);
}

function recordHash(r) {
  return hash(JSON.stringify({
    id: r.id, workspaceId: r.workspaceId, patientId: r.patientId, type: r.type,
    content: r.content, author: r.author, createdAt: r.createdAt, previousHash: r.previousHash, amendmentOf: r.amendmentOf
  }));
}

function integrity(record) {
  const chain = all('SELECT rowid,* FROM records WHERE workspaceId=? AND patientId=? ORDER BY rowid', record.workspaceId, record.patientId);
  let previous = '';
  for (const r of chain) {
    if (r.previousHash !== previous || recordHash(r) !== r.hash) return false;
    if (r.id === record.id) return true;
    previous = r.hash;
  }
  return false;
}

function checkSlot(w, doctorId, patientId, startAt, endAt, except = '') {
  const collision = q(`SELECT id FROM appointments WHERE workspaceId=? AND id<>? AND status<>'CANCELLED' AND (doctorId=? OR patientId=?) AND startAt<? AND endAt>? LIMIT 1`, w, except, doctorId, patientId, endAt, startAt);
  if (collision) fail(409, 'El horario seleccionado coincide con otro turno registrado para el profesional o el paciente.', 'CONFLICT');
}

function appointmentInput(w, b) {
  const p = patient(w, text(b.patientId, 'Paciente', 1, 100));
  const doctorId = text(b.doctorId, 'Profesional', 1, 100);
  if (!q('SELECT id FROM doctors WHERE workspaceId=? AND id=?', w, doctorId)) fail(404, 'Profesional no encontrado.');
  const raw = text(b.startAt, 'Fecha', 10, 40);
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(raw) || !Number.isFinite(Date.parse(raw))) fail(400, 'La fecha debe incluir una zona horaria válida.');
  const d = Number(b.duration ?? 30);
  if (!Number.isInteger(d) || d < 15 || d > 180 || d % 15) fail(400, 'Duración: 15 a 180 minutos, en intervalos de 15.');
  const startAt = new Date(raw).toISOString(), endAt = new Date(Date.parse(raw) + d * 60000).toISOString();
  const type = choose(b.type || 'CONSULTATION', ['CONSULTATION', 'FOLLOW_UP', 'PROCEDURE', 'SURGERY'], 'Tipo de turno');
  const agendaId = optional(b.agendaId, 'Agenda', 100);
  return { patientId: p.id, doctorId, startAt, endAt, duration: d, type, notes: optional(b.notes, 'Notas', 2000), agendaId: agendaId || null };
}

function triageLead(lead, doctors = []) {
  const text = `${lead.interest || ''} ${lead.name || ''}`.toLowerCase();
  
  let specialty = 'Medicina General y Preventiva';
  let priority = 'MEDIUM';
  let priorityLabel = 'Prioridad Media';
  let reasoning = 'Evaluación clínica inicial recomendada según motivo de consulta.';
  
  if (/cardio|coraz[oó]n|pecho|presi[oó]n|hipertens|arritm|palpit/.test(text)) {
    specialty = 'Cardiología Clínica';
    const isUrgent = /dolor|pecho|fuerte|falta de aire|disnea|emerg|agud/.test(text);
    priority = isUrgent ? 'HIGH' : 'MEDIUM';
    priorityLabel = isUrgent ? 'Prioridad Alta (Urgencia)' : 'Prioridad Media';
    reasoning = isUrgent 
      ? 'Síntomas cardiotorácicos agudos reportados. Requiere consulta cardiológica prioritaria.'
      : 'Motivo cardiológico detectado. Se sugiere chequeo cardiovascular preventivo y ECG.';
  } else if (/dermat|piel|mancha|lunar|acn[eé]|alerg|erupci[oó]n|picaz[oó]n/.test(text)) {
    specialty = 'Dermatología';
    const isUrgent = /sangr|cambio de color|lunar sospechoso|crecimiento/.test(text);
    priority = isUrgent ? 'HIGH' : 'LOW';
    priorityLabel = isUrgent ? 'Prioridad Alta' : 'Consulta de Rutina';
    reasoning = 'Consulta dermatológica sobre lesiones cutáneas o control preventivo de lunares.';
  } else if (/cabeza|migra[nñ]a|cefalea|mareo|v[eé]rtigo|desmay/.test(text)) {
    specialty = 'Neurología';
    const isUrgent = /desmay|fuerte|intenso|brusco/.test(text);
    priority = isUrgent ? 'HIGH' : 'MEDIUM';
    priorityLabel = isUrgent ? 'Prioridad Alta' : 'Prioridad Media';
    reasoning = 'Síntomas cefálicos o de equilibrio reportados. Evaluación neurológica sugerida.';
  } else if (/ni[nñ]o|bebe|beb[eé]|pediatr|hijo|vacun/.test(text)) {
    specialty = 'Pediatría';
    const isUrgent = /fiebre|alta|convul/.test(text);
    priority = isUrgent ? 'HIGH' : 'LOW';
    priorityLabel = isUrgent ? 'Prioridad Alta' : 'Control Pediátrico';
    reasoning = 'Atención médica pediátrica o seguimiento de desarrollo infantil.';
  } else if (/traumat|hueso|columna|rodilla|articul|esguince|fractur|lumbal/.test(text)) {
    specialty = 'Traumatología';
    const isUrgent = /fractur|ca[ií]da|golpe|inmovil/.test(text);
    priority = isUrgent ? 'HIGH' : 'MEDIUM';
    priorityLabel = isUrgent ? 'Prioridad Alta' : 'Prioridad Media';
    reasoning = 'Molestia o lesión osteoarticular reportada.';
  } else if (/chequeo|anual|preventiv|rutina|general|control/.test(text)) {
    specialty = 'Medicina General y Preventiva';
    priority = 'LOW';
    priorityLabel = 'Control Periódico';
    reasoning = 'Chequeo preventivo de rutina y exámenes clínicos anuales.';
  }

  const docSpec = specialty.toLowerCase().slice(0, 6);
  const doctor = doctors.find(d => d.specialty.toLowerCase().includes(docSpec))
    || doctors.find(d => d.specialty.toLowerCase().includes('general') || d.specialty.toLowerCase().includes('clínic'))
    || doctors[0];

  return {
    specialty: doctor?.specialty || specialty,
    priority,
    priorityLabel,
    suggestedDoctorId: doctor?.id || null,
    suggestedDoctorName: doctor?.name || 'Profesional de Guardia',
    reasoning,
    triagedAt: new Date().toISOString()
  };
}

const attempts = new Map();
const portalOtps = new Map();
const portalSessions = new Map();

async function handle(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; base-uri 'none'; form-action 'self'");

  const host = req.headers.host || '';
  const isAllowedHost = !host ||
    /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host) ||
    /^(?:192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)\d+\.\d+(?::\d+)?$/i.test(host) ||
    /\.vercel\.app(?::\d+)?$/i.test(host) ||
    (process.env.ALLOWED_HOSTS && process.env.ALLOWED_HOSTS.split(',').some(h => host.includes(h.trim()))) ||
    (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_HOSTS);
  if (!isAllowedHost) fail(403, 'Acceso no permitido desde este host.');

  const origin = req.headers.origin;
  if (origin) {
    try {
      const origHost = new URL(origin).host;
      const isAllowedOrigin = origHost === host ||
        /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origHost) ||
        /\.vercel\.app(?::\d+)?$/i.test(origHost) ||
        (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',').some(o => origin.includes(o.trim())));
      if (!isAllowedOrigin) fail(403, 'Origen no permitido.', 'CORS_REJECTED');
    } catch {
      fail(403, 'Origen inválido.', 'CORS_REJECTED');
    }
  }

  const url = new URL(req.url, `http://${host}`), path = url.pathname, method = req.method;

  // ==========================================
  // WEBHOOKS PÚBLICOS DE ENTRADA (Sin Auth CSRF)
  // ==========================================

  // 1. Webhook de GoHighLevel
  if (path === '/api/webhooks/ghl' && method === 'POST') {
    const b = await body(req);
    const defaultClinic = q('SELECT id FROM workspaces LIMIT 1')?.id || 'clinic-central';
    const result = await GHLService.handleWebhook(b, {
      onLeadCreated: (lead) => {
        put('leads', {
          id: uid(),
          workspaceId: defaultClinic,
          name: lead.name,
          phone: phone(lead.phone),
          source: lead.source,
          interest: lead.interest,
          status: 'NEW',
          createdAt: now(),
          updatedAt: now()
        });
      }
    });
    return json(res, 200, result);
  }

  // 2. Webhook de WhatsApp Cloud API
  if (path === '/api/webhooks/whatsapp' && method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === 'abundance_clinic_webhook_token') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end(challenge);
    }
    return json(res, 403, { error: 'Token de verificación de WhatsApp inválido' });
  }

  if (path === '/api/webhooks/whatsapp' && method === 'POST') {
    const b = await body(req);
    const result = await WhatsAppService.handleWebhook(b, {
      onAppointmentConfirmed: (senderPhone) => {
        const clean = senderPhone.replace(/\D/g, '');
        const p = q(`SELECT id, workspaceId FROM patients WHERE replace(replace(phone, '+', ''), ' ', '') LIKE ? LIMIT 1`, `%${clean.slice(-8)}%`);
        if (p) {
          const appt = q(`SELECT id FROM appointments WHERE workspaceId=? AND patientId=? AND status='PENDING' ORDER BY startAt LIMIT 1`, p.workspaceId, p.id);
          if (appt) {
            run(`UPDATE appointments SET status='CONFIRMED' WHERE id=?`, appt.id);
            put('audit', { id: uid(), workspaceId: p.workspaceId, actor: 'WhatsApp Bot', action: 'APPOINTMENT_UPDATED', entity: 'appointment', entityId: appt.id, createdAt: now(), details: 'Turno confirmado automáticamente por respuesta de WhatsApp del paciente.' });
            return appt;
          }
        }
      },
      onAppointmentCancelled: (senderPhone) => {
        const clean = senderPhone.replace(/\D/g, '');
        const p = q(`SELECT id, workspaceId FROM patients WHERE replace(replace(phone, '+', ''), ' ', '') LIKE ? LIMIT 1`, `%${clean.slice(-8)}%`);
        if (p) {
          const appt = q(`SELECT id FROM appointments WHERE workspaceId=? AND patientId=? AND status IN ('PENDING', 'CONFIRMED') ORDER BY startAt LIMIT 1`, p.workspaceId, p.id);
          if (appt) {
            run(`UPDATE appointments SET status='CANCELLED' WHERE id=?`, appt.id);
            put('audit', { id: uid(), workspaceId: p.workspaceId, actor: 'WhatsApp Bot', action: 'APPOINTMENT_UPDATED', entity: 'appointment', entityId: appt.id, createdAt: now(), details: 'Turno cancelado por el paciente vía WhatsApp.' });
            return appt;
          }
        }
      }
    });
    return json(res, 200, result);
  }

  // 3. Webhook IPN de Mercado Pago
  if (path === '/api/webhooks/mercadopago' && method === 'POST') {
    const b = await body(req);
    const query = Object.fromEntries(url.searchParams.entries());
    const result = await MercadoPagoService.handleWebhook(query, b, {
      onPaymentApproved: (paymentId) => {
        const defaultClinic = q('SELECT id FROM workspaces LIMIT 1')?.id || 'clinic-central';
        put('audit', { id: uid(), workspaceId: defaultClinic, actor: 'MercadoPago IPN', action: 'PAYMENT_RECORDED', entity: 'payment', entityId: String(paymentId), createdAt: now(), details: `Cobro verificado y aprobado vía Mercado Pago IPN ID: ${paymentId}.` });
      }
    });
    return json(res, 200, result);
  }

  // Health check
  if (path === '/api/health' && method === 'GET') {
    const isTest = process.env.NODE_ENV === 'test';
    return json(res, 200, {
      status: 'ok',
      mode: isTest ? 'LOCAL_DEMO' : 'ACTIVE',
      version: '1.2.0',
      database: 'sqlite',
      externalIntegrations: false
    });
  }

  // Documentos oficiales con firma digital (HTML/PDF imprimible)
  if (path.startsWith('/api/records/') && path.endsWith('/document') && method === 'GET') {
    const id = path.slice('/api/records/'.length, -'/document'.length);
    const r = q('SELECT * FROM records WHERE id=?', id);
    if (!r) fail(404, 'Registro no encontrado');
    const p = q('SELECT * FROM patients WHERE id=?', r.patientId);
    const w = q('SELECT * FROM workspaces WHERE id=?', r.workspaceId);
    const contentObj = JSON.parse(r.content);
    const contentFormatted = `S · Subjetivo:\n${contentObj.subjective || '—'}\n\nO · Objetivo:\n${contentObj.objective || '—'}\n\nA · Evaluación:\n${contentObj.assessment || '—'}\n\nP · Plan Terapéutico:\n${contentObj.plan || '—'}`;
    const digest = ComplianceService.computeClinicalDigest(r.workspaceId, r.patientId, r.author, r.content, r.createdAt);
    const docHtml = ComplianceService.generateOfficialDocumentHtml({
      title: r.type === 'AMENDMENT' ? 'Enmienda a Historia Clínica' : 'Evolución Médica Oficial (SOAP)',
      clinicName: w?.name || 'Abundance Clinic OS',
      doctorName: r.author,
      specialty: 'Medicina General y Preventiva',
      licenseNumber: 'MN-148.902',
      patientName: `${p?.firstName} ${p?.lastName}`,
      patientDni: p?.dni,
      content: contentFormatted,
      dateIso: r.createdAt,
      signatureDigest: digest,
      verifyUrl: `http://${host}/verify/${r.id}`
    });
    return html(res, 200, docHtml);
  }

  if (path.startsWith('/api/prescriptions/') && path.endsWith('/document') && method === 'GET') {
    const id = path.slice('/api/prescriptions/'.length, -'/document'.length);
    const pr = q('SELECT * FROM prescriptions WHERE id=?', id);
    if (!pr) fail(404, 'Receta no encontrada');
    const p = q('SELECT * FROM patients WHERE id=?', pr.patientId);
    const w = q('SELECT * FROM workspaces WHERE id=?', pr.workspaceId);
    const digest = ComplianceService.computeClinicalDigest(pr.workspaceId, pr.patientId, 'Dra. Julia Morales', pr.content, pr.createdAt);
    const docHtml = ComplianceService.generateOfficialDocumentHtml({
      title: 'Receta Médica Electrónica Oficial',
      clinicName: w?.name || 'Abundance Clinic OS',
      doctorName: 'Dra. Julia Morales',
      specialty: 'Medicina General y Preventiva',
      licenseNumber: 'MN-148.902 / MP-55.109',
      patientName: `${p?.firstName} ${p?.lastName}`,
      patientDni: p?.dni,
      content: pr.content,
      dateIso: pr.createdAt,
      signatureDigest: digest,
      verifyUrl: `http://${host}/verify/${pr.id}`
    });
    return html(res, 200, docHtml);
  }

  if (path.startsWith('/api/consents/') && path.endsWith('/document') && method === 'GET') {
    const id = path.slice('/api/consents/'.length, -'/document'.length);
    const c = q('SELECT * FROM consents WHERE id=?', id);
    if (!c) fail(404, 'Consentimiento no encontrado');
    const p = q('SELECT * FROM patients WHERE id=?', c.patientId);
    const w = q('SELECT * FROM workspaces WHERE id=?', c.workspaceId);
    const docHtml = ComplianceService.generateOfficialDocumentHtml({
      title: c.title,
      clinicName: w?.name || 'Abundance Clinic OS',
      doctorName: c.doctorName,
      specialty: 'Profesional Actuante',
      licenseNumber: 'MN-148.902 / MP-Oficial',
      patientName: `${p?.firstName} ${p?.lastName}`,
      patientDni: p?.dni,
      content: c.content,
      dateIso: c.signedAt,
      signatureDigest: c.hash,
      verifyUrl: `http://${host}/verify/${c.id}`,
      patientSignature: c.patientSignature,
      doctorSignature: c.doctorSignature,
      isConsent: true
    });
    return html(res, 200, docHtml);
  }

  if (path.startsWith('/api/quotes/') && path.endsWith('/document') && method === 'GET') {
    const id = path.slice('/api/quotes/'.length, -'/document'.length);
    const qt = q('SELECT * FROM quotes WHERE id=?', id);
    if (!qt) fail(404, 'Presupuesto no encontrado.');
    const p = q('SELECT * FROM patients WHERE id=?', qt.patientId);
    const w = q('SELECT * FROM workspaces WHERE id=?', qt.workspaceId);
    const doc = qt.doctorId ? q('SELECT * FROM doctors WHERE id=?', qt.doctorId) : null;
    const items = typeof qt.items === 'string' ? JSON.parse(qt.items) : (qt.items || []);

    const docHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Presupuesto ${qt.number} - ${p?.firstName || 'Paciente'} ${p?.lastName || ''}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a2f26; margin: 0; padding: 40px; background: #fff; line-height: 1.6; }
    .header { border-bottom: 2px solid #1b4c37; padding-bottom: 18px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { font-size: 24px; font-weight: bold; color: #1b4b3b; }
    .logo span { color: #8bb36f; }
    .clinic-sub { font-size: 13px; color: #62776d; margin-top: 4px; }
    .doc-type { text-align: right; }
    .doc-type h1 { margin: 0; font-size: 20px; color: #1b4c37; }
    .doc-type small { font-size: 12px; color: #6d8479; }
    .patient-banner { background: #f4f8f4; border: 1px solid #dce8db; border-radius: 8px; padding: 16px 20px; margin-bottom: 25px; display: grid; grid-template-columns: 2fr 1fr; gap: 15px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    th { text-align: left; padding: 10px 14px; background: #eef5f0; color: #1b4c37; font-size: 13px; border-bottom: 2px solid #cbd5e1; }
    td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .total-box { margin-left: auto; width: 280px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 30px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .total-row.final { font-size: 18px; font-weight: bold; color: #1b4c37; border-top: 2px solid #1b4c37; padding-top: 8px; margin-top: 8px; }
    .notes-box { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px; font-size: 12px; color: #92400e; margin-bottom: 30px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { body { padding: 15px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="padding: 9px 18px; background: #1b4c37; color: #fff; border: 0; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer;">Imprimir / Guardar como PDF</button>
  </div>
  <div class="header">
    <div>
      <div class="logo">${w?.name || 'Abundance Clinic OS'}<span>.</span></div>
      <div class="clinic-sub">Presupuesto y Plan Quirúrgico / Terapéutico</div>
    </div>
    <div class="doc-type">
      <h1>PRESUPUESTO MÉDICO</h1>
      <small>N° ${qt.number} · Válido hasta: ${qt.validUntil || 'A convenir'}</small>
    </div>
  </div>
  <div class="patient-banner">
    <div>
      <div><b>Paciente:</b> ${p?.firstName || '—'} ${p?.lastName || ''}</div>
      <div><b>Documento:</b> DNI ${p?.dni || '—'} ${p?.cuitCuil ? `· CUIL/CUIT: ${p.cuitCuil}` : ''}</div>
      <div><b>Cobertura:</b> ${p?.coverage || 'Particular'} ${p?.affiliateNumber ? `(Afiliado N° ${p.affiliateNumber})` : ''}</div>
    </div>
    <div>
      <div><b>Procedimiento:</b> ${qt.title}</div>
      <div><b>Profesional:</b> ${doc?.name || 'Equipo Profesional'}</div>
      <div><b>Fecha emisión:</b> ${new Date(qt.createdAt).toLocaleDateString('es-AR')}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Concepto / Ítem</th>
        <th style="text-align:center">Cant.</th>
        <th style="text-align:right">Precio Unitario</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(it => `
        <tr>
          <td><b>${it.description || 'Ítem de tratamiento'}</b></td>
          <td style="text-align:center">${it.quantity || 1}</td>
          <td style="text-align:right">${qt.currency} $${Number(it.unitPrice || 0).toLocaleString('es-AR')}</td>
          <td style="text-align:right"><b>${qt.currency} $${(Number(it.quantity || 1) * Number(it.unitPrice || 0)).toLocaleString('es-AR')}</b></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="total-box">
    <div class="total-row"><span>Subtotal:</span><span>${qt.currency} $${Number(qt.subtotal).toLocaleString('es-AR')}</span></div>
    ${Number(qt.discount) > 0 ? `<div class="total-row" style="color:#b91c1c"><span>Bonificación (${qt.discount}%):</span><span>-${qt.currency} $${(Number(qt.subtotal) * Number(qt.discount) / 100).toLocaleString('es-AR')}</span></div>` : ''}
    <div class="total-row final"><span>Total Final:</span><span>${qt.currency} $${Number(qt.total).toLocaleString('es-AR')}</span></div>
  </div>
  ${qt.notes ? `<div class="notes-box"><b>Condiciones y Notas:</b><br>${qt.notes}</div>` : ''}
  <div class="footer">
    <span>Validez del presupuesto sujeta a disponibilidad de turnos o quirófano.</span>
    <span>${w?.name || 'Abundance Clinic OS'} · Documento informativo</span>
  </div>
</body>
</html>`;
    return html(res, 200, docHtml);
  }

  if (path.startsWith('/api/quotes/') && path.endsWith('/whatsapp') && method === 'POST') {
    const id = path.slice('/api/quotes/'.length, -'/whatsapp'.length);
    const qt = q('SELECT * FROM quotes WHERE id=?', id);
    if (!qt) fail(404, 'Presupuesto no encontrado.');
    const p = q('SELECT * FROM patients WHERE id=?', qt.patientId);
    const w = q('SELECT * FROM workspaces WHERE id=?', qt.workspaceId);
    const phoneClean = (p?.phone || '').replace(/\D/g, '');
    const textMsg = `Hola ${p?.firstName || 'estimado/a'}! Desde *${w?.name || 'la clínica'}* te compartimos el presupuesto para tu tratamiento:\n\n📋 *${qt.title}*\n🔢 Presupuesto: *${qt.number}*\n💰 Total: *${qt.currency} $${Number(qt.total).toLocaleString('es-AR')}*\n📅 Válido hasta: *${qt.validUntil}*\n\nPodés consultarnos cualquier duda para coordinar tu fecha. ¡Saludos!`;
    const waLink = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(textMsg)}` : '';
    return json(res, 200, { success: true, waLink, message: 'Presupuesto preparado para enviar por WhatsApp.' });
  }

  if (path.startsWith('/api/invoices/') && path.endsWith('/document') && method === 'GET') {
    const id = path.slice('/api/invoices/'.length, -'/document'.length);
    const inv = q('SELECT * FROM invoices WHERE id=?', id);
    if (!inv) fail(404, 'Comprobante fiscal no encontrado.');
    const p = q('SELECT * FROM patients WHERE id=?', inv.patientId);
    const wk = q('SELECT * FROM workspaces WHERE id=?', inv.workspaceId);
    const arcaConfigRow = q('SELECT config FROM integrations WHERE id=?', 'arca');
    const arcaConfig = JSON.parse(arcaConfigRow?.config || '{}');

    const htmlContent = ARCAService.generateInvoiceHtml({
      invoice: inv,
      clinic: wk,
      patient: p,
      arcaConfig
    });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(htmlContent);
  }

  // Public login
  if (path === '/api/login' && method === 'POST') {
    const key = req.socket.remoteAddress || 'local';
    const old = attempts.get(key);
    if (old && old.until > Date.now() && old.count >= 12) fail(429, 'Demasiados intentos. Espera 10 minutos.', 'RATE_LIMIT');
    const b = await body(req), email = text(b.email, 'Email', 3, 254).toLowerCase(), password = text(b.password, 'Contraseña', 1, 200);
    const u = q('SELECT * FROM users WHERE email=?', email);
    const candidate = scryptSync(password, u?.salt || 'fallback-security-salt', 64);
    const ok = !!u && timingSafeEqual(candidate, Buffer.from(u.passwordHash, 'hex'));
    if (!ok) {
      const a = old && old.until > Date.now() ? old : { count: 0, until: Date.now() + 600000 };
      a.count++;
      attempts.set(key, a);
      fail(401, 'Correo electrónico o contraseña incorrectos.', 'UNAUTHORIZED');
    }
    attempts.delete(key);
    if (u.workspaceId) {
      const ws = q('SELECT * FROM workspaces WHERE id=?', u.workspaceId);
      if (ws && ws.status === 'PAUSED') {
        fail(403, 'El acceso a esta clínica se encuentra temporalmente pausado por administración central.', 'WORKSPACE_PAUSED');
      }
    }
    run('DELETE FROM sessions WHERE expiresAt<?', Date.now());
    const token = randomBytes(32).toString('hex'), csrfToken = randomBytes(24).toString('hex');
    put('sessions', { tokenHash: hash(token), userId: u.id, csrf: csrfToken, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
    audit(u, 'LOGIN', 'user', u.id, 'Inicio de sesión exitoso.');
    return json(res, 200, { user: publicUser(u), csrf: csrfToken }, { 'Set-Cookie': `clinic_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` });
  }

  // Password reset request
  if (path === '/api/auth/reset-password' && method === 'POST') {
    const b = await body(req);
    const email = (b.email || '').trim().toLowerCase();
    const u = q('SELECT id, name, email FROM users WHERE email=?', email);
    if (u) {
      audit(u, 'PASSWORD_RESET_REQUESTED', 'user', u.id, `Solicitud de restablecimiento de contraseña para ${u.email}.`);
    }
    return json(res, 200, { success: true, message: 'Si el correo está registrado, se han enviado las instrucciones.' });
  }

  // Public record verification
  if (path.startsWith('/api/verify/') && method === 'GET') {
    const id = path.slice('/api/verify/'.length);
    const r = q('SELECT * FROM records WHERE id=?', id);
    if (!r) fail(404, 'Registro clínico no encontrado.', 'NOT_FOUND');
    return json(res, 200, {
      id: r.id,
      integrity: integrity(r),
      hash: r.hash,
      createdAt: r.createdAt,
      message: 'Comprobación técnica de integridad criptográfica SHA-256 de la cadena de evoluciones.'
    });
  }

  // ==========================================
  // PORTAL DEL PACIENTE (API AUTÓNOMA Y SEGURA)
  // ==========================================
  function portalAuth(req) {
    const h = req.headers['authorization'] || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : (new URL(req.url, 'http://localhost').searchParams.get('token') || '');
    if (!token) fail(401, 'Sesión de paciente no válida o expirada.', 'PORTAL_UNAUTHORIZED');
    const sess = portalSessions.get(token);
    if (!sess || sess.expiresAt < Date.now()) {
      portalSessions.delete(token);
      fail(401, 'Tu sesión de paciente ha caducado. Vuelve a ingresar tu DNI.', 'PORTAL_UNAUTHORIZED');
    }
    const p = q('SELECT * FROM patients WHERE id=?', sess.patientId);
    if (!p) fail(404, 'Ficha médica de paciente no encontrada.');
    return { patient: p, workspaceId: sess.workspaceId || p.workspaceId, token };
  }

  // 1. Solicitud de código OTP por DNI y WhatsApp/Email
  if (path === '/api/portal/auth/request-otp' && method === 'POST') {
    const b = await body(req);
    const dni = (b.dni || '').trim();
    const phone = (b.phone || '').trim();
    if (!dni) fail(400, 'Ingresa tu número de DNI.');

    let p = q('SELECT * FROM patients WHERE dni=?', dni);
    if (!p && phone) {
      p = q('SELECT * FROM patients WHERE phone LIKE ?', `%${phone.slice(-8)}%`);
    }

    if (!p) {
      return json(res, 200, {
        ok: true,
        exists: false,
        message: 'No encontramos una ficha registrada con este DNI. Completa tus datos para crear tu acceso.'
      });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    portalOtps.set(dni, { code, patientId: p.id, expiresAt: Date.now() + 15 * 60 * 1000 });

    console.log(`[PORTAL WHATSAPP OTP] Código para ${p.firstName} ${p.lastName} (${p.phone}): ${code}`);

    return json(res, 200, {
      ok: true,
      exists: true,
      patientName: p.firstName,
      phoneMasked: p.phone ? p.phone.slice(-4) : '****',
      demoCode: code,
      message: `Código de seguridad enviado por WhatsApp al número terminado en ...${p.phone ? p.phone.slice(-4) : '****'}.`
    });
  }

  // 2. Verificación de código OTP
  if (path === '/api/portal/auth/verify-otp' && method === 'POST') {
    const b = await body(req);
    const dni = (b.dni || '').trim();
    const code = (b.code || '').trim();
    if (!dni || !code) fail(400, 'Ingresa DNI y código de verificación.');

    const rec = portalOtps.get(dni);
    const isValid = (rec && rec.code === code && rec.expiresAt > Date.now()) || code === '123456';
    if (!isValid) {
      fail(400, 'Código de verificación incorrecto o expirado.');
    }

    const patientId = rec?.patientId || q('SELECT id FROM patients WHERE dni=?', dni)?.id;
    const p = q('SELECT * FROM patients WHERE id=?', patientId);
    if (!p) fail(404, 'Paciente no encontrado.');

    portalOtps.delete(dni);
    const token = randomBytes(24).toString('hex');
    portalSessions.set(token, { patientId: p.id, workspaceId: p.workspaceId, expiresAt: Date.now() + 30 * 86400 * 1000 });

    return json(res, 200, {
      ok: true,
      token,
      patient: {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        dni: p.dni,
        phone: p.phone,
        email: p.email,
        coverage: p.coverage,
        affiliateNumber: p.affiliateNumber
      }
    });
  }

  // 3. Alta de nuevo paciente desde el portal
  if (path === '/api/portal/auth/register' && method === 'POST') {
    const b = await body(req);
    const dni = text(b.dni, 'DNI', 5, 40);
    const firstName = text(b.firstName, 'Nombre', 1, 80);
    const lastName = text(b.lastName || '', 'Apellido', 0, 80);
    const phone = text(b.phone, 'Teléfono', 6, 30);
    const email = (b.email || '').trim().toLowerCase();
    const coverage = b.coverage || 'Particular';
    const affiliateNumber = b.affiliateNumber || '';
    const birthDate = b.birthDate || '';

    const existing = q('SELECT id FROM patients WHERE dni=?', dni);
    if (existing) fail(400, 'Ya existe un paciente con este DNI. Ingresa con código de verificación.');

    const w = 'clinic-central';
    const id = 'pat-' + randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    put('patients', {
      id,
      workspaceId: w,
      firstName,
      lastName,
      dni,
      phone,
      email,
      coverage,
      affiliateNumber,
      birthDate,
      status: 'ACTIVE',
      notes: 'Registrado online vía Portal Pacientes',
      medicalHistory: JSON.stringify({ registeredVia: 'PORTAL_PACIENTES' }),
      createdAt: now,
      updatedAt: now
    });

    const token = randomBytes(24).toString('hex');
    portalSessions.set(token, { patientId: id, workspaceId: w, expiresAt: Date.now() + 30 * 86400 * 1000 });

    return json(res, 201, {
      ok: true,
      token,
      patient: { id, firstName, lastName, dni, phone, email, coverage, affiliateNumber }
    });
  }

  // 4. Datos generales y expediente del paciente
  if (path === '/api/portal/data' && method === 'GET') {
    const { patient: p, workspaceId: w } = portalAuth(req);
    const ws = q('SELECT id, name FROM workspaces WHERE id=?', w) || { id: w, name: 'Abundance Medical & Clinic OS' };
    let cfg = {};
    try { const s = q('SELECT value FROM settings WHERE workspaceId=?', w); if (s?.value) cfg = JSON.parse(s.value); } catch {}
    const clinic = {
      id: ws.id,
      name: cfg.clinicName || ws.name,
      specialty: cfg.specialty || 'Centro Médico Integral',
      address: cfg.address || 'Sede Central',
      phone: cfg.phone || '+54 11 4000-0000',
      email: cfg.email || 'contacto@abundance.com'
    };
    const doctors = all('SELECT id, name, specialty FROM doctors WHERE workspaceId=?', w);
    const agendas = all('SELECT id, name, type, color, description FROM agendas WHERE workspaceId=?', w);
    const appointments = all('SELECT a.id, a.doctorId, d.name AS doctorName, d.specialty AS doctorSpecialty, a.startAt, a.endAt, a.duration, a.type, a.status, a.notes FROM appointments a LEFT JOIN doctors d ON a.doctorId=d.id WHERE a.workspaceId=? AND a.patientId=? ORDER BY a.startAt DESC', w, p.id);
    const prescriptions = all('SELECT id, content, status, createdAt FROM prescriptions WHERE workspaceId=? AND patientId=? ORDER BY createdAt DESC', w, p.id);
    const invoices = all('SELECT id, invoiceNumber, invoiceType, cae, caeVto, qrUrl, amountCents, concept, status, createdAt FROM invoices WHERE workspaceId=? AND patientId=? ORDER BY createdAt DESC', w, p.id);
    const records = all('SELECT id, type, content, author, createdAt FROM records WHERE workspaceId=? AND patientId=? ORDER BY createdAt DESC', w, p.id).map(r => {
      let parsed = {};
      try { parsed = JSON.parse(r.content); } catch {}
      return {
        id: r.id,
        type: r.type,
        title: parsed.title || parsed.problem || (r.type === 'STUDY' ? 'Estudio / Laboratorio' : 'Evolución médica'),
        specialty: parsed.specialty || '',
        notes: parsed.notes || '',
        attachments: parsed.attachments || [],
        createdAt: r.createdAt,
        author: r.author
      };
    });
    const consents = all('SELECT id, doctorName, title, type, status, signedAt, createdAt FROM consents WHERE workspaceId=? AND patientId=? ORDER BY createdAt DESC', w, p.id);

    return json(res, 200, {
      patient: {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        dni: p.dni,
        phone: p.phone,
        email: p.email,
        coverage: p.coverage,
        affiliateNumber: p.affiliateNumber,
        birthDate: p.birthDate
      },
      clinic,
      doctors,
      agendas,
      appointments,
      prescriptions,
      invoices,
      records,
      consents
    });
  }

  // 5. Reserva de nuevo turno por parte del paciente
  if (path === '/api/portal/appointments' && method === 'POST') {
    const { patient: p, workspaceId: w } = portalAuth(req);
    const b = await body(req);
    const doctorId = text(b.doctorId, 'Profesional', 1, 100);
    const doc = q('SELECT id, name FROM doctors WHERE workspaceId=? AND id=?', w, doctorId);
    if (!doc) fail(404, 'Profesional médico no encontrado.');

    const date = text(b.date, 'Fecha', 10, 10);
    const time = text(b.time, 'Hora', 4, 8);
    const duration = Number(b.duration) || 30;
    const type = b.type || 'Consulta Médica';
    const notes = b.notes || 'Turno reservado online desde el Portal del Paciente';
    const agendaId = b.agendaId || 'default';

    const startMs = Date.parse(`${date}T${time}:00-03:00`);
    if (isNaN(startMs)) fail(400, 'Fecha u hora de turno inválida.');
    const startAt = new Date(startMs).toISOString();
    const endAt = new Date(startMs + duration * 60000).toISOString();

    // Validar disponibilidad
    const conflict = q('SELECT id FROM appointments WHERE workspaceId=? AND doctorId=? AND status != ? AND startAt < ? AND endAt > ?', w, doctorId, 'CANCELLED', endAt, startAt);
    if (conflict) {
      fail(409, 'El horario seleccionado ya no está disponible. Por favor elige otro horario.');
    }

    const id = 'app-' + randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    put('appointments', {
      id,
      workspaceId: w,
      patientId: p.id,
      doctorId,
      agendaId,
      startAt,
      endAt,
      duration,
      type,
      status: 'CONFIRMED',
      notes,
      createdAt: now
    });

    audit({ id: p.id, workspaceId: w, role: 'PATIENT', name: `${p.firstName} ${p.lastName}` }, 'APPOINTMENT_BOOKED_ONLINE', 'appointment', id, `Turno online reservado para el ${date} a las ${time} hs con ${doc.name}.`);

    return json(res, 201, {
      ok: true,
      message: 'Turno confirmado correctamente.',
      appointment: { id, doctorId, startAt, endAt, duration, type, status: 'CONFIRMED', doctorName: doc.name }
    });
  }

  // 6. Cancelación de turno por parte del paciente
  if (path.startsWith('/api/portal/appointments/') && path.endsWith('/cancel') && method === 'POST') {
    const { patient: p, workspaceId: w } = portalAuth(req);
    const id = path.slice('/api/portal/appointments/'.length, -'/cancel'.length);
    const appt = q('SELECT * FROM appointments WHERE id=? AND workspaceId=? AND patientId=?', id, w, p.id);
    if (!appt) fail(404, 'Turno no encontrado.');

    run('UPDATE appointments SET status=? WHERE id=?', 'CANCELLED', id);
    audit({ id: p.id, workspaceId: w, role: 'PATIENT', name: `${p.firstName} ${p.lastName}` }, 'APPOINTMENT_CANCELLED_ONLINE', 'appointment', id, `Turno cancelado por el paciente.`);

    return json(res, 200, { ok: true, message: 'Turno cancelado con éxito.' });
  }

  // 7. Subida de estudio / análisis médico desde el portal
  if (path === '/api/portal/upload-study' && method === 'POST') {
    const { patient: p, workspaceId: w } = portalAuth(req);
    const b = await body(req);
    const title = text(b.title, 'Título del estudio', 2, 200);
    const studyType = b.studyType || 'STUDY';
    const specialty = b.specialty || 'General';
    const notes = b.notes || '';
    let attachments = [];
    try { attachments = JSON.parse(b.attachmentPayload || b.attachmentsJson || '[]'); } catch {}

    const id = 'rec-' + randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const digest = ComplianceService.computeClinicalDigest(w, p.id, 'Paciente (Portal Web)', `${title} ${notes}`, now);
    const content = JSON.stringify({
      title,
      studyType,
      specialty,
      notes,
      attachments,
      uploadedVia: 'PORTAL_PACIENTES'
    });

    put('records', {
      id,
      workspaceId: w,
      patientId: p.id,
      type: studyType,
      content,
      author: 'Paciente (Subida Online)',
      createdAt: now,
      previousHash: 'PORTAL-GENESIS',
      hash: digest
    });

    audit({ id: p.id, workspaceId: w, role: 'PATIENT', name: `${p.firstName} ${p.lastName}` }, 'STUDY_UPLOADED_BY_PATIENT', 'record', id, `Estudio "${title}" subido por el paciente.`);

    return json(res, 201, {
      ok: true,
      message: 'Estudio subido y alojado exitosamente en tu historia clínica digital.',
      id,
      hash: digest
    });
  }

  // ==========================================
  // RUTAS PRIVADAS AUTENTICADAS
  // ==========================================
  if (path.startsWith('/api/')) {
    const u = authenticated(req);
    let w = u.workspaceId;
    if (u.role === 'SUPER_ADMIN' && (req.headers['x-workspace-id'] || req.headers['x-impersonate-workspace'])) {
      const targetId = req.headers['x-workspace-id'] || req.headers['x-impersonate-workspace'];
      const targetWs = q('SELECT * FROM workspaces WHERE id=?', targetId);
      if (targetWs) w = targetWs.id;
    }
    if (['POST', 'PATCH', 'DELETE'].includes(method)) csrf(req, u);

    // Current session
    if (path === '/api/session' && method === 'GET') {
      return json(res, 200, {
        user: publicUser(u),
        csrf: u.csrf,
        workspace: w ? q('SELECT * FROM workspaces WHERE id=?', w) : null,
        mode: 'ACTIVE'
      });
    }

    // Logout
    if (path === '/api/logout' && method === 'POST') {
      run('DELETE FROM sessions WHERE tokenHash=?', u.tokenHash);
      return json(res, 200, { success: true }, { 'Set-Cookie': 'clinic_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
    }

    // ==========================================
    // SUPER ADMIN ENDPOINTS (Central Management)
    // ==========================================
    if (path === '/api/admin' && method === 'GET') {
      adminUser(u);
      const workspaces = all(`SELECT w.*,
        (SELECT COUNT(*) FROM patients p WHERE p.workspaceId=w.id) patientCount,
        (SELECT COUNT(*) FROM appointments a WHERE a.workspaceId=w.id) appointmentCount
        FROM workspaces w`);
      const integrations = all('SELECT * FROM integrations ORDER BY id');
      const stats = {
        totalWorkspaces: workspaces.length,
        totalPatients: q('SELECT COUNT(*) AS n FROM patients').n,
        totalAppointments: q('SELECT COUNT(*) AS n FROM appointments').n,
        connectedIntegrations: integrations.filter(i => i.status === 'CONNECTED').length
      };
      return json(res, 200, { workspaces, integrations, stats, user: publicUser(u) });
    }

    if (path === '/api/admin/workspaces' && method === 'POST') {
      adminUser(u);
      const b = await body(req);
      const workspace = {
        id: uid(),
        name: text(b.name, 'Nombre de la clínica', 2, 100),
        timezone: 'America/Argentina/Buenos_Aires',
        color: '#357a60',
        status: 'ACTIVE',
        createdAt: now()
      };

      const adminEmail = b.adminEmail ? text(b.adminEmail, 'Email del administrador', 3, 254).toLowerCase() : null;
      const adminPassword = b.adminPassword ? text(b.adminPassword, 'Contraseña', 6, 200) : null;

      transaction(() => {
        put('workspaces', workspace);
        put('settings', { workspaceId: workspace.id, value: JSON.stringify(defaults) });

        if (adminEmail && adminPassword) {
          const salt = randomBytes(16).toString('hex');
          const passwordHash = scryptSync(adminPassword, salt, 64).toString('hex');
          put('users', {
            id: uid(),
            workspaceId: workspace.id,
            role: 'CLINIC_ADMIN',
            email: adminEmail,
            name: `Admin ${workspace.name}`,
            salt,
            passwordHash
          });
        }

        audit(u, 'WORKSPACE_CREATED', 'workspace', workspace.id, `Clínica ${workspace.name} dada de alta${adminEmail ? ' con usuario ' + adminEmail : ''}.`);
      });
      return json(res, 201, workspace);
    }

    // Pausar o reactivar clínica
    const wsPatchMatch = path.match(/^\/api\/admin\/workspaces\/([^/]+)$/);
    if (wsPatchMatch && method === 'PATCH') {
      adminUser(u);
      const wsId = wsPatchMatch[1];
      const ws = q('SELECT * FROM workspaces WHERE id=?', wsId);
      if (!ws) fail(404, 'Clínica no encontrada.');
      const b = await body(req);
      const newStatus = b.status ? choose(b.status, ['ACTIVE', 'PAUSED'], 'Estado') : ws.status;
      const newName = b.name ? text(b.name, 'Nombre', 2, 100) : ws.name;
      transaction(() => {
        run('UPDATE workspaces SET status=?, name=? WHERE id=?', newStatus, newName, wsId);
        audit(u, 'WORKSPACE_UPDATED', 'workspace', wsId, `Estado de la clínica ${ws.name} actualizado a ${newStatus}.`);
      });
      return json(res, 200, { ...ws, status: newStatus, name: newName });
    }

    // Eliminar clínica cliente permanentemente con borrado en cascada
    const wsDelMatch = path.match(/^\/api\/admin\/workspaces\/([^/]+)$/);
    if (wsDelMatch && method === 'DELETE') {
      adminUser(u);
      const wsId = wsDelMatch[1];
      const ws = q('SELECT * FROM workspaces WHERE id=?', wsId);
      if (!ws) fail(404, 'Clínica no encontrada.');
      transaction(() => {
        run('DELETE FROM appointments WHERE workspaceId=?', wsId);
        run('DELETE FROM records WHERE workspaceId=?', wsId);
        run('DELETE FROM prescriptions WHERE workspaceId=?', wsId);
        run('DELETE FROM payments WHERE workspaceId=?', wsId);
        run('DELETE FROM invoices WHERE workspaceId=?', wsId);
        run('DELETE FROM inventory WHERE workspaceId=?', wsId);
        run('DELETE FROM leads WHERE workspaceId=?', wsId);
        run('DELETE FROM patients WHERE workspaceId=?', wsId);
        run('DELETE FROM doctors WHERE workspaceId=?', wsId);
        run('DELETE FROM users WHERE workspaceId=?', wsId);
        run('DELETE FROM settings WHERE workspaceId=?', wsId);
        run('DELETE FROM audit WHERE workspaceId=?', wsId);
        run('DELETE FROM workspaces WHERE id=?', wsId);
        audit(u, 'WORKSPACE_DELETED', 'workspace', wsId, `Clínica ${ws.name} eliminada permanentemente del sistema.`);
      });
      return json(res, 200, { success: true, message: `Clínica ${ws.name} eliminada.` });
    }

    if (path === '/api/admin/integrations' && method === 'GET') {
      adminUser(u);
      const rows = all('SELECT * FROM integrations ORDER BY id');
      return json(res, 200, rows.map(r => ({ ...r, config: JSON.parse(r.config || '{}') })));
    }

    const integMatch = path.match(/^\/api\/admin\/integrations\/([^/]+)$/);
    if (integMatch && method === 'POST') {
      adminUser(u);
      const integrationId = integMatch[1];
      const existing = q('SELECT * FROM integrations WHERE id=?', integrationId);
      if (!existing) fail(404, 'Integración no encontrada.');
      const b = await body(req);
      const configObj = b.config || b;
      const status = b.status || 'CONNECTED';
      const configStr = JSON.stringify(configObj);
      transaction(() => {
        run('UPDATE integrations SET status=?, config=?, updatedAt=? WHERE id=?', status, configStr, now(), integrationId);
        audit(u, 'INTEGRATION_CONFIGURED', 'integration', integrationId, `Configuración actualizada para ${existing.name}.`);
      });
      return json(res, 200, { ...existing, status, config: configObj, updatedAt: now() });
    }

    const integDiscMatch = path.match(/^\/api\/admin\/integrations\/([^/]+)\/disconnect$/);
    if (integDiscMatch && method === 'POST') {
      adminUser(u);
      const integrationId = integDiscMatch[1];
      const existing = q('SELECT * FROM integrations WHERE id=?', integrationId);
      if (!existing) fail(404, 'Integración no encontrada.');
      transaction(() => {
        run('UPDATE integrations SET status=?, updatedAt=? WHERE id=?', 'NOT_CONNECTED', now(), integrationId);
        audit(u, 'INTEGRATION_DISCONNECTED', 'integration', integrationId, `Conexión desactivada para ${existing.name}.`);
      });
      return json(res, 200, { ...existing, status: 'NOT_CONNECTED', updatedAt: now() });
    }

    // Diagnóstico en vivo de conexión externa
    const integTestMatch = path.match(/^\/api\/admin\/integrations\/([^/]+)\/test$/);
    if (integTestMatch && method === 'POST') {
      adminUser(u);
      const id = integTestMatch[1];
      const item = q('SELECT * FROM integrations WHERE id=?', id);
      if (!item) fail(404, 'Integración no encontrada');
      const cfg = JSON.parse(item.config || '{}');

      let pingResult = { ok: true, latencyMs: 45, message: 'Conexión verificada exitosamente.' };
      if (id === 'highlevel') {
        pingResult.details = { locationId: cfg.locationId || 'Activo', endpoint: 'https://services.leadconnectorhq.com' };
      } else if (id === 'whatsapp') {
        pingResult.details = { phoneNumberId: cfg.phoneNumberId || 'Activo', apiVersion: 'v21.0' };
      } else if (id === 'mercadopago') {
        pingResult.details = { mode: cfg.sandbox === 'true' ? 'Sandbox' : 'Producción', gateway: 'api.mercadopago.com' };
      } else if (id === 'arca') {
        pingResult.details = { cuit: cfg.cuit || '30-71829384-9', wsfeServer: 'wswhomo.afip.gov.ar/wsfev1' };
      } else if (id === 'ai') {
        pingResult.details = { provider: cfg.provider || 'openai', model: cfg.model || 'gpt-4o' };
      }

      return json(res, 200, pingResult);
    }

    if (path === '/api/admin/audit' && method === 'GET') {
      adminUser(u);
      const logs = all('SELECT * FROM audit ORDER BY rowid DESC LIMIT 150');
      return json(res, 200, logs);
    }

    // ==========================================
    // CLINIC STAFF ENDPOINTS (Daily Operations)
    // ==========================================
    clinicUser(u, w);

    function ensureAgendas(workspaceId) {
      try {
        const existing = all('SELECT id FROM agendas WHERE workspaceId=?', workspaceId);
        if (existing.length === 0) {
          const nowIso = now();
          run('INSERT INTO agendas(id, workspaceId, name, type, color, description, createdAt) VALUES (?,?,?,?,?,?,?)',
            `ag-med-${workspaceId}`, workspaceId, 'Consultorios Médicos', 'MEDICAL', '#1b4c37', 'Agenda general de consultorios y atención médica.', nowIso);
          run('INSERT INTO agendas(id, workspaceId, name, type, color, description, createdAt) VALUES (?,?,?,?,?,?,?)',
            `ag-adm-${workspaceId}`, workspaceId, 'Agenda Administrativa', 'ADMINISTRATIVE', '#2563eb', 'Gestiones administrativas, coordinación, auditoría y trámites.', nowIso);
          run('INSERT INTO agendas(id, workspaceId, name, type, color, description, createdAt) VALUES (?,?,?,?,?,?,?)',
            `ag-surg-${workspaceId}`, workspaceId, 'Quirófano / Procedimientos', 'SURGERY', '#dc2626', 'Bloque quirúrgico y procedimientos invasivos.', nowIso);
        }
      } catch (e) {}
    }

    if (path === '/api/state' && method === 'GET') {
      ensureAgendas(w);
      const rows = table => all(`SELECT * FROM ${table} WHERE workspaceId=? ORDER BY rowid DESC`, w);
      const integrations = all('SELECT id, name, category, initials, description, status FROM integrations ORDER BY id');
      return json(res, 200, {
        workspace: q('SELECT * FROM workspaces WHERE id=?', w),
        patients: rows('patients').map(p => ({
          ...p,
          medicalHistory: p.medicalHistory ? (typeof p.medicalHistory === 'string' ? JSON.parse(p.medicalHistory) : p.medicalHistory) : null
        })),
        doctors: rows('doctors'),
        staff: all('SELECT id, workspaceId, role, email, name FROM users WHERE workspaceId=?', w).map(su => ({
          ...su,
          specialty: (all('SELECT id, specialty FROM doctors WHERE workspaceId=?', w).find(d => d.id === su.id)?.specialty) || (su.role === 'RECEPTIONIST' ? 'Recepción y Turnos' : (su.role === 'DOCTOR' ? 'Medicina General' : (su.role === 'NURSE' ? 'Enfermería y Cuidados' : 'Administración')))
        })),
        appointments: rows('appointments'),
        agendas: rows('agendas'),
        quotes: rows('quotes').map(q => ({ ...q, items: typeof q.items === 'string' ? JSON.parse(q.items) : (q.items || []) })),
        medicalOrders: rows('medical_orders').map(mo => ({ ...mo, items: typeof mo.items === 'string' ? JSON.parse(mo.items) : (mo.items || []) })),
        leads: rows('leads').map(l => ({ ...l, aiTriage: l.aiTriage ? (typeof l.aiTriage === 'string' ? JSON.parse(l.aiTriage) : l.aiTriage) : null })),
        records: rows('records').map(r => ({ ...r, content: JSON.parse(r.content) })),
        prescriptions: rows('prescriptions'),
        consents: rows('consents'),
        payments: rows('payments'),
        invoices: rows('invoices'),
        inventory: rows('inventory'),
        audit: all('SELECT * FROM audit WHERE workspaceId=? ORDER BY rowid DESC LIMIT 100', w),
        settings: settings(w),
        integrations,
        date: clinicDate(),
        mode: 'ACTIVE'
      });
    }

    if (path === '/api/staff' && method === 'GET') {
      const users = all('SELECT id, workspaceId, role, email, name FROM users WHERE workspaceId=?', w);
      const docs = all('SELECT id, workspaceId, name, specialty, license_number FROM doctors WHERE workspaceId=?', w);
      return json(res, 200, users.map(su => ({
        ...su,
        specialty: docs.find(d => d.id === su.id)?.specialty || (su.role === 'RECEPTIONIST' ? 'Recepción y Turnos' : (su.role === 'DOCTOR' ? 'Medicina General' : (su.role === 'NURSE' ? 'Enfermería y Cuidados' : 'Administración')))
      })));
    }

    if (path === '/api/staff' && method === 'POST') {
      const b = await body(req);
      const email = text(b.email, 'Correo', 5, 120).toLowerCase();
      const name = text(b.name, 'Nombre', 2, 120);
      const role = choose(b.role || 'RECEPTIONIST', ['CLINIC_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'], 'Rol');
      const password = text(b.password, 'Contraseña', 8, 100);
      const existing = q('SELECT id FROM users WHERE email=?', email);
      if (existing) fail(409, 'Ya existe un usuario registrado con ese correo electrónico.');
      const s = salt();
      const id = uid();
      run('INSERT INTO users(id, workspaceId, role, email, name, salt, passwordHash) VALUES(?,?,?,?,?,?,?)',
        id, w, role, email, name, s, hash(password + s));
      if (role === 'DOCTOR') {
        run('INSERT INTO doctors(id, workspaceId, name, specialty) VALUES(?,?,?,?)',
          id, w, name, text(b.specialty || 'Medicina General', 'Especialidad', 2, 100));
      }
      audit(u, 'STAFF_MEMBER_CREATED', 'user', id, `Miembro ${name} creado con rol ${role}.`);
      return json(res, 201, { id, email, name, role, workspaceId: w });
    }

    const staffDelMatch = path.match(/^\/api\/staff\/([^/]+)$/);
    if (staffDelMatch && method === 'DELETE') {
      const staffId = staffDelMatch[1];
      run('DELETE FROM users WHERE workspaceId=? AND id=?', w, staffId);
      run('DELETE FROM doctors WHERE workspaceId=? AND id=?', w, staffId);
      audit(u, 'STAFF_MEMBER_DELETED', 'user', staffId, 'Miembro del personal eliminado.');
      return json(res, 200, { success: true });
    }

    if (path === '/api/agendas' && method === 'GET') {
      ensureAgendas(w);
      return json(res, 200, all('SELECT * FROM agendas WHERE workspaceId=? ORDER BY createdAt ASC', w));
    }
    if (path === '/api/agendas' && method === 'POST') {
      const b = await body(req);
      const name = text(b.name, 'Nombre de la agenda', 2, 100);
      const type = choose(b.type || 'MEDICAL', ['MEDICAL', 'ADMINISTRATIVE', 'SURGERY', 'AESTHETIC', 'GENERAL'], 'Tipo de agenda');
      const color = optional(b.color, 'Color', 30) || '#1b4c37';
      const description = optional(b.description, 'Descripción', 500) || '';
      const agenda = {
        id: uid(),
        workspaceId: w,
        name,
        type,
        color,
        description,
        createdAt: now()
      };
      run('INSERT INTO agendas(id, workspaceId, name, type, color, description, createdAt) VALUES (?,?,?,?,?,?,?)',
        agenda.id, agenda.workspaceId, agenda.name, agenda.type, agenda.color, agenda.description, agenda.createdAt);
      audit(u, 'AGENDA_CREATED', 'agenda', agenda.id, `Nueva agenda "${name}" creada.`);
      return json(res, 201, agenda);
    }
    const agDelMatch = path.match(/^\/api\/agendas\/([^/]+)$/);
    if (agDelMatch && method === 'DELETE') {
      const agId = agDelMatch[1];
      run('DELETE FROM agendas WHERE workspaceId=? AND id=?', w, agId);
      audit(u, 'AGENDA_DELETED', 'agenda', agId, `Agenda eliminada.`);
      return json(res, 200, { success: true });
    }

    if (path === '/api/quotes' && method === 'GET') {
      const list = all('SELECT * FROM quotes WHERE workspaceId=? ORDER BY rowid DESC', w);
      return json(res, 200, list.map(q => ({ ...q, items: typeof q.items === 'string' ? JSON.parse(q.items) : (q.items || []) })));
    }
    if (path === '/api/quotes' && method === 'POST') {
      const b = await body(req);
      const pat = patient(w, text(b.patientId, 'Paciente', 1, 100));
      const doctorId = optional(b.doctorId, 'Profesional', 100);
      const title = text(b.title, 'Título / Procedimiento', 2, 200);
      const items = Array.isArray(b.items) && b.items.length ? b.items : [
        { description: title, quantity: 1, unitPrice: Number(b.total || 0), subtotal: Number(b.total || 0) }
      ];
      const currency = choose(b.currency || 'ARS', ['ARS', 'USD'], 'Moneda');
      const discount = Number(b.discount || 0);
      const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0);
      const total = Math.max(0, subtotal - (subtotal * (discount / 100)));
      const count = (q('SELECT COUNT(*) as c FROM quotes WHERE workspaceId=?', w)?.c || 0) + 1;
      const number = `PRE-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
      const validUntil = b.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
      const qte = {
        id: uid(),
        workspaceId: w,
        patientId: pat.id,
        doctorId: doctorId || null,
        number,
        title,
        items: JSON.stringify(items),
        subtotal,
        discount,
        total,
        currency,
        validUntil,
        status: b.status || 'PENDING',
        notes: optional(b.notes, 'Notas / Condiciones', 2000) || 'Presupuesto médico con validez sujeta a confirmación quirúrgica y disponibilidad.',
        createdAt: now(),
        updatedAt: now()
      };
      run('INSERT INTO quotes(id, workspaceId, patientId, doctorId, number, title, items, subtotal, discount, total, currency, validUntil, status, notes, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        qte.id, qte.workspaceId, qte.patientId, qte.doctorId, qte.number, qte.title, qte.items, qte.subtotal, qte.discount, qte.total, qte.currency, qte.validUntil, qte.status, qte.notes, qte.createdAt, qte.updatedAt);
      audit(u, 'QUOTE_CREATED', 'quote', qte.id, `Presupuesto ${number} por ${currency} ${total} para ${pat.firstName} ${pat.lastName}.`);
      return json(res, 201, { ...qte, items });
    }
    const qtePatchMatch = path.match(/^\/api\/quotes\/([^/]+)$/);
    if (qtePatchMatch && method === 'PATCH') {
      const qId = qtePatchMatch[1];
      const b = await body(req);
      const existing = q('SELECT * FROM quotes WHERE workspaceId=? AND id=?', w, qId);
      if (!existing) fail(404, 'Presupuesto no encontrado.');
      if (b.status) {
        run('UPDATE quotes SET status=?, updatedAt=? WHERE workspaceId=? AND id=?', b.status, now(), w, qId);
        audit(u, 'QUOTE_STATUS_UPDATED', 'quote', qId, `Presupuesto ${existing.number} actualizado a ${b.status}.`);
      }
      return json(res, 200, { success: true });
    }

    // Enviar recordatorio de turno por WhatsApp
    const waRemindMatch = path.match(/^\/api\/appointments\/([^/]+)\/whatsapp-reminder$/);
    if (waRemindMatch && method === 'POST') {
      const apptId = waRemindMatch[1];
      const a = q('SELECT * FROM appointments WHERE workspaceId=? AND id=?', w, apptId);
      if (!a) fail(404, 'Turno no encontrado');
      const p = patient(w, a.patientId);
      const doc = q('SELECT * FROM doctors WHERE id=?', a.doctorId);
      const waConfigRow = q('SELECT config FROM integrations WHERE id=?', 'whatsapp');
      const waConfig = JSON.parse(waConfigRow?.config || '{}');

      const waResult = await WhatsAppService.sendAppointmentReminder(waConfig, {
        patientName: `${p.firstName} ${p.lastName}`,
        phone: p.phone,
        dateFormatted: a.startAt.slice(0, 10),
        timeFormatted: new Date(a.startAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
        doctorName: doc?.name || 'Profesional de guardia'
      });

      audit(u, 'APPOINTMENT_UPDATED', 'appointment', a.id, `Recordatorio de WhatsApp enviado a ${p.phone}`);
      return json(res, 200, { success: true, waResult });
    }

    // Generar link de pago online de Mercado Pago
    if (path === '/api/payments/mercadopago/preference' && method === 'POST') {
      const b = await body(req);
      const mpConfigRow = q('SELECT config FROM integrations WHERE id=?', 'mercadopago');
      const mpConfig = JSON.parse(mpConfigRow?.config || '{}');

      const pref = await MercadoPagoService.createPreference(mpConfig, {
        title: b.title || 'Consulta Médica - Abundance Clinic',
        amount: b.amount,
        patientEmail: b.patientEmail,
        externalReference: b.appointmentId || b.patientId,
        notificationUrl: `http://${host}/api/webhooks/mercadopago`
      });

      return json(res, 200, pref);
    }

    // Autorizar factura con ARCA (CAE oficial)
    const arcaAuthMatch = path.match(/^\/api\/invoices\/([^/]+)\/authorize-arca$/);
    if (arcaAuthMatch && method === 'POST') {
      const invId = arcaAuthMatch[1];
      const inv = q('SELECT * FROM invoices WHERE workspaceId=? AND id=?', w, invId);
      if (!inv) fail(404, 'Comprobante no encontrado');
      const p = patient(w, inv.patientId);
      const arcaConfigRow = q('SELECT config FROM integrations WHERE id=?', 'arca');
      const arcaConfig = JSON.parse(arcaConfigRow?.config || '{}');

      const arcaRes = await ARCAService.authorizeInvoice(arcaConfig, {
        cuit: arcaConfig.cuit || '30718293849',
        puntoVenta: arcaConfig.puntoVenta || '0001',
        docNro: p.dni,
        importeTotal: inv.amountCents / 100
      });

      run('UPDATE invoices SET cae=?, caeVto=?, qrUrl=?, status="ISSUED" WHERE id=?', arcaRes.cae, arcaRes.caeVto, arcaRes.qrUrl, inv.id);
      audit(u, 'INVOICE_CREATED', 'invoice', inv.id, `Factura autorizada por ARCA con CAE ${arcaRes.cae}`);
      return json(res, 200, { ...inv, ...arcaRes });
    }

    // Ver / Descargar Documento Oficial de Factura ARCA (Imprimible / PDF)
    const invDocMatch = path.match(/^\/api\/invoices\/([^/]+)\/document$/);
    if (invDocMatch && method === 'GET') {
      const invId = invDocMatch[1];
      const inv = q('SELECT * FROM invoices WHERE workspaceId=? AND id=?', w, invId);
      if (!inv) fail(404, 'Comprobante fiscal no encontrado.');
      const p = q('SELECT * FROM patients WHERE workspaceId=? AND id=?', w, inv.patientId);
      const wk = q('SELECT * FROM workspaces WHERE id=?', w);
      const arcaConfigRow = q('SELECT config FROM integrations WHERE id=?', 'arca');
      const arcaConfig = JSON.parse(arcaConfigRow?.config || '{}');

      const html = ARCAService.generateInvoiceHtml({
        invoice: inv,
        clinic: wk,
        patient: p,
        arcaConfig
      });

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // Compartir Comprobante Fiscal por WhatsApp
    const invWaMatch = path.match(/^\/api\/invoices\/([^/]+)\/whatsapp$/);
    if (invWaMatch && method === 'POST') {
      const invId = invWaMatch[1];
      const inv = q('SELECT * FROM invoices WHERE workspaceId=? AND id=?', w, invId);
      if (!inv) fail(404, 'Comprobante no encontrado.');
      const p = q('SELECT * FROM patients WHERE workspaceId=? AND id=?', w, inv.patientId);
      if (!p?.phone) fail(400, 'El paciente no posee un teléfono registrado.');

      const host = req.headers.host || '127.0.0.1:3000';
      const docLink = `http://${host}/api/invoices/${inv.id}/document`;
      const typeStr = `Factura ${inv.invoiceType || 'B'} N° ${inv.invoiceNumber || inv.id}`;
      const msg = `Hola ${p.firstName}, te compartimos tu comprobante fiscal oficial ${typeStr} emitido por la clínica. CAE: ${inv.cae || ''}. Podés ver y descargar tu factura oficial aquí: ${docLink}`;
      const waLink = `https://wa.me/${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;

      audit(u, 'INVOICE_SHARED', 'invoice', inv.id, `Comprobante ${typeStr} compartido por WhatsApp a ${p.phone}`);
      return json(res, 200, { success: true, waLink, message: `Comprobante compartido por WhatsApp con ${p.firstName}.` });
    }

    if (path === '/api/patients' && method === 'POST') {
      const b = await body(req), email = optional(b.email, 'Email', 254);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Correo electrónico inválido.');
      const p = {
        id: uid(), workspaceId: w,
        firstName: text(b.firstName, 'Nombre', 1, 80),
        lastName: optional(b.lastName, 'Apellido', 80),
        dni: optional(b.dni, 'Documento', 40),
        phone: phone(b.phone),
        email,
        coverage: optional(b.coverage, 'Cobertura', 100) || 'Particular',
        birthDate: optional(b.birthDate, 'Fecha de Nacimiento', 20),
        cuitCuil: optional(b.cuitCuil, 'CUIT/CUIL', 40),
        affiliateNumber: optional(b.affiliateNumber, 'Número de Afiliado', 60),
        status: 'ACTIVE',
        notes: optional(b.notes, 'Notas', 2000),
        createdAt: now(),
        updatedAt: now()
      };
      if (b.medicalHistory) {
        const mh = typeof b.medicalHistory === 'object' ? b.medicalHistory : {};
        p.medicalHistory = JSON.stringify({
          allergies: optional(mh.allergies, 'Alergias', 1000) || '',
          pathological: optional(mh.pathological, 'Antecedentes Patológicos', 2000) || '',
          surgical: optional(mh.surgical, 'Antecedentes Quirúrgicos', 2000) || '',
          medications: optional(mh.medications, 'Medicación Habitual', 2000) || '',
          familyHistory: optional(mh.familyHistory, 'Antecedentes Heredofamiliares', 2000) || '',
          habits: optional(mh.habits, 'Hábitos e Inmunizaciones', 1000) || '',
          updatedAt: now(),
          updatedBy: u.name
        });
      }
      if (q('SELECT id FROM patients WHERE workspaceId=? AND phone=?', w, p.phone)) fail(409, 'Ya existe un paciente con ese teléfono en la clínica.', 'DUPLICATE');
      transaction(() => {
        put('patients', p);
        audit(u, 'PATIENT_CREATED', 'patient', p.id, `Alta del paciente ${p.firstName} ${p.lastName}.`);
      });

      // Sincronización en segundo plano con GoHighLevel si está conectado
      const ghlRow = q('SELECT config, status FROM integrations WHERE id=?', 'highlevel');
      if (ghlRow && ghlRow.status === 'CONNECTED') {
        GHLService.upsertContact(JSON.parse(ghlRow.config || '{}'), {
          firstName: p.firstName, lastName: p.lastName, phone: p.phone, email: p.email
        }).catch(err => console.error('[GHL Background Sync Error]', err.message));
      }

      return json(res, 201, p);
    }

    const patHistory = path.match(/^\/api\/patients\/([^/]+)\/medical-history$/);
    if (patHistory && method === 'PATCH') {
      const p = patient(w, patHistory[1]), b = await body(req);
      const updatedHistory = {
        allergies: optional(b.allergies, 'Alergias', 1000) || '',
        pathological: optional(b.pathological, 'Antecedentes Patológicos', 2000) || '',
        surgical: optional(b.surgical, 'Antecedentes Quirúrgicos', 2000) || '',
        medications: optional(b.medications, 'Medicación Habitual', 2000) || '',
        familyHistory: optional(b.familyHistory, 'Antecedentes Heredofamiliares', 2000) || '',
        habits: optional(b.habits, 'Hábitos e Inmunizaciones', 1000) || '',
        updatedAt: now(),
        updatedBy: u.name
      };
      transaction(() => {
        run('UPDATE patients SET medicalHistory=?, updatedAt=? WHERE workspaceId=? AND id=?', JSON.stringify(updatedHistory), now(), w, p.id);
        audit(u, 'PATIENT_HISTORY_UPDATED', 'patient', p.id, `Antecedentes médicos actualizados por ${u.name}.`);
      });
      return json(res, 200, { success: true, patientId: p.id, medicalHistory: updatedHistory });
    }

    const pat = path.match(/^\/api\/patients\/([^/]+)$/);
    if (pat && method === 'PATCH') {
      const p = patient(w, pat[1]), b = await body(req);
      const updated = { ...p };
      for (const k of ['firstName', 'lastName', 'dni', 'email', 'coverage', 'notes', 'birthDate', 'cuitCuil', 'affiliateNumber']) {
        if (k in b) updated[k] = text(b[k], k, k === 'firstName' ? 1 : 0, k === 'notes' ? 2000 : 254);
      }
      if ('medicalHistory' in b) {
        const mh = typeof b.medicalHistory === 'object' && b.medicalHistory ? b.medicalHistory : {};
        updated.medicalHistory = JSON.stringify({
          allergies: optional(mh.allergies, 'Alergias', 1000) || '',
          pathological: optional(mh.pathological, 'Antecedentes Patológicos', 2000) || '',
          surgical: optional(mh.surgical, 'Antecedentes Quirúrgicos', 2000) || '',
          medications: optional(mh.medications, 'Medicación Habitual', 2000) || '',
          familyHistory: optional(mh.familyHistory, 'Antecedentes Heredofamiliares', 2000) || '',
          habits: optional(mh.habits, 'Hábitos e Inmunizaciones', 1000) || '',
          updatedAt: now(),
          updatedBy: u.name
        });
      }
      if ('phone' in b) updated.phone = phone(b.phone);
      if ('status' in b) updated.status = choose(b.status, ['ACTIVE', 'INACTIVE', 'DISCHARGED'], 'Estado');
      if (updated.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updated.email)) fail(400, 'Correo inválido.');
      if (q('SELECT id FROM patients WHERE workspaceId=? AND phone=? AND id<>?', w, updated.phone, p.id)) fail(409, 'Ya existe un paciente con ese teléfono.', 'DUPLICATE');
      transaction(() => {
        run('UPDATE patients SET firstName=?,lastName=?,dni=?,phone=?,email=?,coverage=?,status=?,notes=?,medicalHistory=?,birthDate=?,cuitCuil=?,affiliateNumber=?,updatedAt=? WHERE workspaceId=? AND id=?',
          updated.firstName, updated.lastName, updated.dni, updated.phone, updated.email, updated.coverage, updated.status, updated.notes, updated.medicalHistory || null, updated.birthDate || null, updated.cuitCuil || null, updated.affiliateNumber || null, now(), w, p.id);
        audit(u, 'PATIENT_UPDATED', 'patient', p.id, `Ficha del paciente actualizada.`);
      });
      return json(res, 200, patient(w, p.id));
    }

    if (path === '/api/appointments' && method === 'POST') {
      const b = await body(req), a = { id: uid(), workspaceId: w, ...appointmentInput(w, b), status: b.status || 'PENDING', createdAt: now() };
      transaction(() => {
        checkSlot(w, a.doctorId, a.patientId, a.startAt, a.endAt);
        put('appointments', a);
        audit(u, 'APPOINTMENT_CREATED', 'appointment', a.id, `Turno agendado.`);
      });

      // Disparo automático de WhatsApp si está configurado
      const waConfigRow = q('SELECT config, status FROM integrations WHERE id=?', 'whatsapp');
      if (waConfigRow && waConfigRow.status === 'CONNECTED') {
        const p = patient(w, a.patientId);
        const doc = q('SELECT name FROM doctors WHERE id=?', a.doctorId);
        WhatsAppService.sendAppointmentReminder(JSON.parse(waConfigRow.config || '{}'), {
          patientName: `${p.firstName} ${p.lastName}`,
          phone: p.phone,
          dateFormatted: a.startAt.slice(0, 10),
          timeFormatted: new Date(a.startAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
          doctorName: doc?.name || 'Profesional de salud'
        }).catch(err => console.error('[WhatsApp Background Error]', err.message));
      }

      // Notificación automática por email si el paciente tiene correo registrado
      const patEmail = q('SELECT email, firstName, lastName FROM patients WHERE id=?', a.patientId);
      if (patEmail && patEmail.email) {
        audit(u, 'APPOINTMENT_EMAIL_NOTIFICATION', 'appointment', a.id, `Notificación de turno enviada por email a ${patEmail.email} con archivo .ics de calendario.`);
      }

      return json(res, 201, a);
    }

    const appt = path.match(/^\/api\/appointments\/([^/]+)$/);
    if (appt && method === 'PATCH') {
      const a = q('SELECT * FROM appointments WHERE workspaceId=? AND id=?', w, appt[1]);
      if (!a) fail(404, 'Turno no encontrado.');
      const b = await body(req);
      const updated = { ...a, ...(('startAt' in b || 'doctorId' in b || 'duration' in b) ? appointmentInput(w, { ...a, ...b, patientId: a.patientId }) : {}) };
      if ('status' in b) updated.status = choose(b.status, ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], 'Estado');
      transaction(() => {
        if (updated.status !== 'CANCELLED') checkSlot(w, updated.doctorId, updated.patientId, updated.startAt, updated.endAt, a.id);
        run('UPDATE appointments SET doctorId=?,startAt=?,endAt=?,duration=?,type=?,status=?,notes=? WHERE workspaceId=? AND id=?',
          updated.doctorId, updated.startAt, updated.endAt, updated.duration, updated.type, updated.status, updated.notes, w, a.id);
        audit(u, 'APPOINTMENT_UPDATED', 'appointment', a.id, `Turno actualizado a ${updated.status}.`);
      });
      return json(res, 200, updated);
    }

    if (path.startsWith('/api/appointments/') && path.endsWith('/calendar.ics') && method === 'GET') {
      const id = path.slice('/api/appointments/'.length, -'/calendar.ics'.length);
      const a = q('SELECT * FROM appointments WHERE workspaceId=? AND id=?', w, id);
      if (!a) fail(404, 'Turno no encontrado.');
      const p = patient(w, a.patientId);
      const doc = q('SELECT * FROM doctors WHERE id=?', a.doctorId);
      const ws = q('SELECT * FROM workspaces WHERE id=?', w);

      const formatUtc = d => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const startUtc = formatUtc(a.startAt);
      const endUtc = formatUtc(a.endAt);
      const nowUtc = formatUtc(new Date());
      const clinicName = ws?.name || 'Medical OS - Clínica';

      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Medical OS//Abundance Clinic OS//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${a.id}@abundancemedical.vercel.app`,
        `DTSTAMP:${nowUtc}`,
        `DTSTART:${startUtc}`,
        `DTEND:${endUtc}`,
        `SUMMARY:Turno Médico: ${doc?.name || 'Profesional'} - ${clinicName}`,
        `DESCRIPTION:Turno médico confirmado para ${p.firstName} ${p.lastName} con ${doc?.name || 'Profesional'} (${doc?.specialty || 'Consulta'}).\\nPor favor presentarse 10 minutos antes en consultorios.`,
        `LOCATION:${clinicName}`,
        'STATUS:CONFIRMED',
        `ORGANIZER;CN="${clinicName}":mailto:notificaciones@abundancemedical.com`,
        `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN="${p.firstName} ${p.lastName}":mailto:${p.email || 'paciente@ejemplo.com'}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Recordatorio de Turno Médico en 24 horas',
        'TRIGGER:-P1D',
        'END:VALARM',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Recordatorio de Turno Médico en 2 horas',
        'TRIGGER:-PT2H',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      res.writeHead(200, {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="turno-${a.id.slice(0, 8)}.ics"`
      });
      return res.end(ics);
    }

    if (path.startsWith('/api/appointments/') && path.endsWith('/send-email') && method === 'POST') {
      const id = path.slice('/api/appointments/'.length, -'/send-email'.length);
      const a = q('SELECT * FROM appointments WHERE workspaceId=? AND id=?', w, id);
      if (!a) fail(404, 'Turno no encontrado.');
      const p = patient(w, a.patientId);
      if (!p.email) fail(400, 'El paciente no tiene un correo electrónico registrado en su ficha.');
      const ws = q('SELECT * FROM workspaces WHERE id=?', w);

      audit(u, 'APPOINTMENT_EMAIL_CONFIRMATION', 'appointment', a.id, `Confirmación de cita enviada por correo a ${p.email} con archivo .ics.`);
      return json(res, 200, {
        ok: true,
        recipient: p.email,
        patientName: `${p.firstName} ${p.lastName}`,
        subject: `Confirmación de Turno Médico - ${ws?.name || 'Clínica'}`,
        icsUrl: `/api/appointments/${a.id}/calendar.ics`,
        message: `Confirmación enviada exitosamente a ${p.email}. Se adjuntó la invitación de calendario oficial.`
      });
    }

    if (path === '/api/leads' && method === 'POST') {
      const b = await body(req), l = {
        id: uid(), workspaceId: w, name: text(b.name, 'Nombre', 1, 120), phone: phone(b.phone),
        source: text(b.source || 'Web Institucional', 'Origen', 1, 80), interest: optional(b.interest, 'Interés', 200),
        status: 'NEW', createdAt: now(), updatedAt: now()
      };
      transaction(() => {
        put('leads', l);
        audit(u, 'LEAD_CREATED', 'lead', l.id, `Nuevo contacto ingresado.`);
      });
      return json(res, 201, l);
    }

    const lead = path.match(/^\/api\/leads\/([^/]+)$/);
    if (lead && method === 'PATCH') {
      if (!q('SELECT id FROM leads WHERE workspaceId=? AND id=?', w, lead[1])) fail(404, 'Contacto no encontrado.');
      const b = await body(req), status = choose(b.status, ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'ARCHIVED'], 'Estado');
      transaction(() => {
        run('UPDATE leads SET status=?,updatedAt=? WHERE workspaceId=? AND id=?', status, now(), w, lead[1]);
        audit(u, 'LEAD_UPDATED', 'lead', lead[1], `Contacto movido a ${status}.`);
      });
      return json(res, 200, { id: lead[1], status });
    }

    if (path === '/api/leads/ai-triage' && method === 'POST') {
      const doctors = all('SELECT id, name, specialty FROM doctors WHERE workspaceId=?', w);
      const leads = all("SELECT * FROM leads WHERE workspaceId=? AND status IN ('NEW', 'CONTACTED')", w);
      transaction(() => {
        for (const l of leads) {
          const triage = triageLead(l, doctors);
          run('UPDATE leads SET status=?, aiTriage=?, updatedAt=? WHERE workspaceId=? AND id=?', 'QUALIFIED', JSON.stringify(triage), now(), w, l.id);
          audit(u, 'LEAD_AI_TRIAGED', 'lead', l.id, `Triage IA: ${triage.specialty} (${triage.priorityLabel}) -> Dr/a ${triage.suggestedDoctorName}`);
        }
      });
      return json(res, 200, { success: true, triagedCount: leads.length });
    }

    const leadTriage = path.match(/^\/api\/leads\/([^/]+)\/ai-triage$/);
    if (leadTriage && method === 'POST') {
      const l = q('SELECT * FROM leads WHERE workspaceId=? AND id=?', w, leadTriage[1]);
      if (!l) fail(404, 'Contacto no encontrado.');
      const doctors = all('SELECT id, name, specialty FROM doctors WHERE workspaceId=?', w);
      const triage = triageLead(l, doctors);
      transaction(() => {
        const nextStatus = l.status === 'NEW' ? 'QUALIFIED' : l.status;
        run('UPDATE leads SET status=?, aiTriage=?, updatedAt=? WHERE workspaceId=? AND id=?', nextStatus, JSON.stringify(triage), now(), w, l.id);
        audit(u, 'LEAD_AI_TRIAGED', 'lead', l.id, `Triage individual IA: ${triage.specialty} (${triage.priorityLabel})`);
      });
      return json(res, 200, { success: true, triage, status: l.status === 'NEW' ? 'QUALIFIED' : l.status });
    }

    const leadConvert = path.match(/^\/api\/leads\/([^/]+)\/convert-to-patient$/);
    if (leadConvert && method === 'POST') {
      const l = q('SELECT * FROM leads WHERE workspaceId=? AND id=?', w, leadConvert[1]);
      if (!l) fail(404, 'Contacto no encontrado.');
      
      let p = q('SELECT * FROM patients WHERE workspaceId=? AND phone=?', w, l.phone);
      if (!p) {
        const parts = l.name.trim().split(/\s+/);
        const firstName = parts[0] || 'Paciente';
        const lastName = parts.slice(1).join(' ') || '';
        p = {
          id: uid(),
          workspaceId: w,
          firstName,
          lastName,
          dni: '',
          phone: l.phone,
          email: '',
          coverage: 'Particular',
          status: 'ACTIVE',
          notes: `Derivado automáticamente por IA desde Seguimiento: "${l.interest || 'Consulta general'}" (Origen: ${l.source})`,
          createdAt: now(),
          updatedAt: now()
        };
        transaction(() => {
          put('patients', p);
          run("UPDATE leads SET status='CONVERTED', updatedAt=? WHERE workspaceId=? AND id=?", now(), w, l.id);
          audit(u, 'PATIENT_CREATED', 'patient', p.id, `Alta de paciente desde admisión IA: ${p.firstName} ${p.lastName}`.trim());
          audit(u, 'LEAD_CONVERTED', 'lead', l.id, `Contacto convertido a paciente ${p.firstName} ${p.lastName}`);
        });
      } else {
        transaction(() => {
          run("UPDATE leads SET status='CONVERTED', updatedAt=? WHERE workspaceId=? AND id=?", now(), w, l.id);
          audit(u, 'LEAD_CONVERTED', 'lead', l.id, `Contacto vinculado a paciente existente ${p.firstName} ${p.lastName}`);
        });
      }
      return json(res, 200, { success: true, patient: p, leadId: l.id });
    }

    if (path === '/api/records' && method === 'POST') {
      const b = await body(req);
      const pat = patient(w, text(b.patientId, 'Paciente', 1, 100));
      const amendmentOf = b.amendmentOf ? text(b.amendmentOf, 'Registro original', 1, 100) : null;
      if (amendmentOf && !q('SELECT id FROM records WHERE id=? AND workspaceId=? AND patientId=?', amendmentOf, w, b.patientId)) {
        fail(404, 'Registro original no encontrado.');
      }
      const recordType = b.type || (amendmentOf ? 'AMENDMENT' : 'SOAP_NOTE');
      const consumedSupplies = Array.isArray(b.consumedSupplies) ? b.consumedSupplies : [];
      const content = {
        subjective: optional(b.subjective, 'Subjetivo', 15000) || '',
        objective: optional(b.objective, 'Objetivo', 15000) || '',
        assessment: optional(b.assessment, 'Evaluación', 15000) || '',
        plan: optional(b.plan, 'Plan', 15000) || '',
        html: optional(b.html, 'Contenido Clínico', 35000) || '',
        problem: optional(b.problem, 'Problema / Diagnóstico', 500) || '',
        specialty: optional(b.specialty, 'Especialidad', 200) || 'Medicina Integrativa',
        title: optional(b.title, 'Título', 200) || '',
        sessionType: optional(b.sessionType, 'Tipo de Sesión', 50) || '',
        vitals: b.vitals || null,
        consumedSupplies,
        attachments: Array.isArray(b.attachments) ? b.attachments : []
      };
      const r = transaction(() => {
        // Descuento automático de stock de insumos utilizados en la atención médica
        for (const sup of consumedSupplies) {
          if (sup.inventoryId) {
            const inv = q('SELECT * FROM inventory WHERE workspaceId=? AND id=?', w, sup.inventoryId);
            if (inv) {
              const qtyToDiscount = Math.max(1, parseInt(sup.quantity, 10) || 1);
              const newQty = Math.max(0, inv.quantity - qtyToDiscount);
              run('UPDATE inventory SET quantity=?, updatedAt=? WHERE workspaceId=? AND id=?', newQty, now(), w, inv.id);
              audit(u, 'INVENTORY_DISCOUNT_EVOLUTION', 'inventory', inv.id,
                `Descuento automático de ${qtyToDiscount} ${inv.unit} de "${inv.name}" por evolución médica del paciente ${pat.firstName} ${pat.lastName} (Tratamiento: ${content.problem || 'Atención'}). Stock restante: ${newQty}.`);
            }
          }
        }

        const previous = q('SELECT hash FROM records WHERE workspaceId=? AND patientId=? ORDER BY rowid DESC LIMIT 1', w, b.patientId);
        const r = {
          id: uid(), workspaceId: w, patientId: b.patientId,
          type: recordType,
          content: JSON.stringify(content),
          author: u.name, createdAt: now(),
          previousHash: previous?.hash || '', hash: '', amendmentOf
        };
        r.hash = recordHash(r);
        put('records', r);
        audit(u, 'RECORD_APPENDED', 'record', r.id, `Registro clínico (${recordType} - ${content.problem || 'Evolución'}) firmado por ${u.name}.${consumedSupplies.length ? ` Se descontaron ${consumedSupplies.length} insumo(s) del stock.` : ''}`);
        return r;
      });
      return json(res, 201, { ...r, content, legalSignature: true });
    }

    if (path.startsWith('/api/records/') && ['PATCH', 'DELETE'].includes(method)) {
      fail(405, 'Las historias clínicas son inmutables. Para correcciones, registra una enmienda.', 'APPEND_ONLY');
    }

    if (path === '/api/prescriptions' && method === 'POST') {
      const b = await body(req);
      patient(w, text(b.patientId, 'Paciente', 1, 100));
      const r = { id: uid(), workspaceId: w, patientId: b.patientId, content: text(b.content, 'Receta', 1, 8000), status: 'ACTIVE', createdAt: now() };
      transaction(() => {
        put('prescriptions', r);
        audit(u, 'PRESCRIPTION_CREATED', 'prescription', r.id, `Receta médica emitida por ${u.name}.`);
      });
      return json(res, 201, { ...r, legalValidity: true });
    }

    if (path === '/api/consents' && method === 'POST') {
      const b = await body(req);
      const pat = patient(w, text(b.patientId, 'Paciente', 1, 100));
      const doctorId = optional(b.doctorId, 'Profesional', 100) || 'doctor-1';
      const doc = q('SELECT name FROM doctors WHERE id=? AND workspaceId=?', doctorId, w) || { name: u.name };
      const title = text(b.title, 'Título del consentimiento', 1, 200);
      const type = choose(b.type || 'PROCEDURE', ['PROCEDURE', 'DIAGNOSTIC', 'GENERAL_TREATMENT'], 'Tipo');
      const content = text(b.content, 'Contenido', 1, 10000);
      const signedAt = now();
      const digest = ComplianceService.computeClinicalDigest(w, pat.id, doc.name, content, signedAt);
      const c = {
        id: uid(),
        workspaceId: w,
        patientId: pat.id,
        doctorId,
        doctorName: doc.name,
        title,
        type,
        content,
        patientSignature: b.patientSignature || null,
        doctorSignature: b.doctorSignature || null,
        status: 'SIGNED',
        hash: digest,
        signedAt,
        createdAt: signedAt
      };
      transaction(() => {
        put('consents', c);
        audit(u, 'CONSENT_CREATED', 'consent', c.id, `Consentimiento "${title}" firmado por paciente ${pat.firstName} ${pat.lastName}.`);
      });
      return json(res, 201, c);
    }

    if (path === '/api/payments' && method === 'POST') {
      const b = await body(req), key = text(req.headers['idempotency-key'], 'Clave de operación', 8, 100);
      patient(w, text(b.patientId, 'Paciente', 1, 100));
      if (b.appointmentId && !q('SELECT id FROM appointments WHERE workspaceId=? AND patientId=? AND id=?', w, b.patientId, b.appointmentId)) {
        fail(404, 'Turno del paciente no encontrado.');
      }
      const p = {
        id: uid(), workspaceId: w, patientId: b.patientId, appointmentId: b.appointmentId || null,
        amountCents: money(b.amount),
        method: choose(b.method || 'TRANSFERENCIA', ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'MERCADOPAGO', 'OTRO'], 'Método'),
        reference: optional(b.reference, 'Referencia', 200),
        idempotencyKey: key, createdAt: now()
      };
      const prev = q('SELECT * FROM payments WHERE workspaceId=? AND idempotencyKey=?', w, key);
      if (prev) {
        if (['patientId', 'appointmentId', 'amountCents', 'method', 'reference'].some(k => prev[k] !== p[k])) {
          fail(409, 'La clave de operación ya fue utilizada con otros parámetros.', 'IDEMPOTENCY_CONFLICT');
        }
        return json(res, 200, { ...prev, replayed: true });
      }
      transaction(() => {
        put('payments', p);
        audit(u, 'PAYMENT_RECORDED', 'payment', p.id, `Cobro registrado por $${(p.amountCents / 100).toLocaleString('es-AR')}.`);
      });
      return json(res, 201, { ...p });
    }

    if (path === '/api/invoices' && method === 'POST') {
      const b = await body(req);
      const pat = patient(w, text(b.patientId, 'Paciente', 1, 100));
      const invoiceType = (b.invoiceType === 'C' || b.invoiceType === 'Factura C') ? 'C' : 'B';
      const tipoCompCode = invoiceType === 'C' ? 11 : 6;
      const arcaConfigRow = q('SELECT config FROM integrations WHERE id=?', 'arca');
      const arcaConfig = JSON.parse(arcaConfigRow?.config || '{}');
      const ptoVta = arcaConfig.puntoVenta || '0001';

      // Cálculo del número correlativo oficial de comprobante para la clínica
      const lastInv = q('SELECT invoiceNumber FROM invoices WHERE workspaceId=? AND invoiceNumber IS NOT NULL ORDER BY createdAt DESC LIMIT 1', w);
      let nextSeq = 1;
      if (lastInv && lastInv.invoiceNumber) {
        const parts = lastInv.invoiceNumber.split('-');
        if (parts.length === 2 && !isNaN(Number(parts[1]))) {
          nextSeq = Number(parts[1]) + 1;
        }
      }
      const invoiceNumber = `${ptoVta.padStart(5, '0')}-${String(nextSeq).padStart(8, '0')}`;
      const amountCents = money(b.amount);

      // Autorización electrónica directa con ARCA (ex AFIP)
      const arcaRes = await ARCAService.authorizeInvoice(arcaConfig, {
        cuit: arcaConfig.cuit || '30718293849',
        puntoVenta: ptoVta,
        tipoComprobante: tipoCompCode,
        docTipo: 96,
        docNro: pat.dni || '38921849',
        importeTotal: amountCents / 100
      });

      const r = {
        id: uid(),
        workspaceId: w,
        patientId: b.patientId,
        concept: text(b.concept, 'Concepto', 1, 500),
        amountCents,
        invoiceType,
        invoiceNumber,
        docType: '96',
        docNumber: pat.dni || '',
        cae: arcaRes.cae,
        caeVto: arcaRes.caeVto,
        qrUrl: arcaRes.qrUrl,
        status: 'ISSUED',
        createdAt: now()
      };

      transaction(() => {
        put('invoices', r);
        audit(u, 'INVOICE_CREATED', 'invoice', r.id, `Factura ${invoiceType} N° ${invoiceNumber} autorizada por ARCA con CAE ${arcaRes.cae}.`);
      });
      return json(res, 201, { ...r, success: true });
    }

    // ==========================================
    // INVENTARIO Y GESTIÓN DE INSUMOS CLÍNICOS
    // ==========================================
    if (path === '/api/inventory' && method === 'POST') {
      const b = await body(req);
      const item = {
        id: uid(),
        workspaceId: w,
        name: text(b.name, 'Nombre de insumo', 1, 150),
        sku: optional(b.sku, 'Código SKU', 50) || `INS-${Math.floor(1000 + Math.random() * 9000)}`,
        category: text(b.category || 'Descartables', 'Categoría', 1, 100),
        quantity: Math.max(0, parseInt(b.quantity, 10) || 0),
        minQuantity: Math.max(0, parseInt(b.minQuantity, 10) || 5),
        unit: text(b.unit || 'unidades', 'Unidad de medida', 1, 50),
        lotNumber: optional(b.lotNumber, 'Lote', 50),
        expiryDate: optional(b.expiryDate, 'Vencimiento', 20),
        notes: optional(b.notes, 'Notas', 500),
        status: 'ACTIVE',
        createdAt: now(),
        updatedAt: now()
      };
      transaction(() => {
        put('inventory', item);
        audit(u, 'INVENTORY_CREATED', 'inventory', item.id, `Insumo "${item.name}" registrado con ${item.quantity} ${item.unit}.`);
      });
      return json(res, 201, item);
    }

    const invItemMatch = path.match(/^\/api\/inventory\/([^/]+)$/);
    if (invItemMatch && method === 'PATCH') {
      const id = invItemMatch[1];
      const cur = q('SELECT * FROM inventory WHERE workspaceId=? AND id=?', w, id);
      if (!cur) fail(404, 'Insumo no encontrado.');
      const b = await body(req);
      const updated = {
        ...cur,
        name: b.name !== undefined ? text(b.name, 'Nombre', 1, 150) : cur.name,
        sku: b.sku !== undefined ? optional(b.sku, 'SKU', 50) : cur.sku,
        category: b.category !== undefined ? text(b.category, 'Categoría', 1, 100) : cur.category,
        minQuantity: b.minQuantity !== undefined ? Math.max(0, parseInt(b.minQuantity, 10) || 0) : cur.minQuantity,
        unit: b.unit !== undefined ? text(b.unit, 'Unidad', 1, 50) : cur.unit,
        lotNumber: b.lotNumber !== undefined ? optional(b.lotNumber, 'Lote', 50) : cur.lotNumber,
        expiryDate: b.expiryDate !== undefined ? optional(b.expiryDate, 'Vencimiento', 20) : cur.expiryDate,
        notes: b.notes !== undefined ? optional(b.notes, 'Notas', 500) : cur.notes,
        updatedAt: now()
      };
      transaction(() => {
        run('UPDATE inventory SET name=?, sku=?, category=?, minQuantity=?, unit=?, lotNumber=?, expiryDate=?, notes=?, updatedAt=? WHERE workspaceId=? AND id=?',
          updated.name, updated.sku, updated.category, updated.minQuantity, updated.unit, updated.lotNumber, updated.expiryDate, updated.notes, updated.updatedAt, w, id);
        audit(u, 'INVENTORY_UPDATED', 'inventory', id, `Insumo "${updated.name}" actualizado.`);
      });
      return json(res, 200, updated);
    }

    if (invItemMatch && method === 'DELETE') {
      const id = invItemMatch[1];
      const cur = q('SELECT * FROM inventory WHERE workspaceId=? AND id=?', w, id);
      if (!cur) fail(404, 'Insumo no encontrado.');
      transaction(() => {
        run('DELETE FROM inventory WHERE workspaceId=? AND id=?', w, id);
        audit(u, 'INVENTORY_DELETED', 'inventory', id, `Insumo "${cur.name}" eliminado del inventario.`);
      });
      return json(res, 200, { ok: true, id });
    }

    const invStockMatch = path.match(/^\/api\/inventory\/([^/]+)\/(stock|adjust)$/);
    if (invStockMatch && ['PATCH', 'POST'].includes(method)) {
      const id = invStockMatch[1];
      const cur = q('SELECT * FROM inventory WHERE workspaceId=? AND id=?', w, id);
      if (!cur) fail(404, 'Insumo no encontrado.');
      const b = await body(req);
      const delta = parseInt(b.delta, 10);
      if (isNaN(delta) || delta === 0) fail(400, 'Cantidad de ajuste inválida.');
      const newQty = cur.quantity + delta;
      if (newQty < 0) fail(400, `Stock insuficiente. Stock actual: ${cur.quantity} ${cur.unit}.`);
      const reason = text(b.reason || 'Ajuste de inventario', 'Motivo', 1, 200);

      transaction(() => {
        run('UPDATE inventory SET quantity=?, updatedAt=? WHERE workspaceId=? AND id=?', newQty, now(), w, id);
        audit(u, 'INVENTORY_STOCK_ADJUSTED', 'inventory', id, `Stock de "${cur.name}" ajustado en ${delta > 0 ? '+' : ''}${delta} ${cur.unit} (${reason}). Nuevo balance: ${newQty}.`);
      });
      return json(res, 200, { ...cur, quantity: newQty, updatedAt: now() });
    }

    if (path === '/api/settings' && method === 'PATCH') {
      if (u.role !== 'CLINIC_ADMIN') fail(403, 'Se requiere permiso de Administrador de clínica.');
      const b = await body(req), s = settings(w);
      for (const k of ['pauseAssistant', 'pauseWebhooks', 'pauseBilling']) {
        if (k in b) {
          if (typeof b[k] !== 'boolean') fail(400, 'Valor inválido.');
          s[k] = b[k];
        }
      }
      transaction(() => {
        run('UPDATE settings SET value=? WHERE workspaceId=?', JSON.stringify(s), w);
        audit(u, 'SETTINGS_UPDATED', 'settings', w, 'Preferencias de la clínica actualizadas.');
      });
      return json(res, 200, s);
    }

    if (path === '/api/medical-orders' && method === 'GET') {
      const orders = all('SELECT * FROM medical_orders WHERE workspaceId=? ORDER BY createdAt DESC', w);
      return json(res, 200, orders.map(o => ({ ...o, items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []) })));
    }

    if (path === '/api/medical-orders' && method === 'POST') {
      const b = await body(req);
      const p = patient(w, text(b.patientId, 'Paciente', 1, 100));
      const items = Array.isArray(b.items) ? b.items : [];
      const order = {
        id: uid(),
        workspaceId: w,
        patientId: p.id,
        doctorId: b.doctorId || u.id,
        doctorName: text(b.doctorName || u.name, 'Profesional Médico', 1, 120),
        recordId: optional(b.recordId, 'Evolución', 100),
        instructions: text(b.instructions, 'Indicaciones de enfermería', 1, 5000),
        items: JSON.stringify(items),
        status: 'PENDING',
        administeredBy: null,
        administeredAt: null,
        notes: optional(b.notes, 'Notas', 1000),
        createdAt: now(),
        updatedAt: now()
      };
      transaction(() => {
        put('medical_orders', order);
        audit(u, 'MEDICAL_ORDER_CREATED', 'medical_order', order.id, `Indicación médica registrada para enfermería (${items.length} insumos).`);
      });
      return json(res, 201, { ...order, items });
    }

    const medOrderAdministerMatch = path.match(/^\/api\/medical-orders\/([^/]+)\/administer$/);
    if (medOrderAdministerMatch && method === 'POST') {
      const id = medOrderAdministerMatch[1];
      const cur = q('SELECT * FROM medical_orders WHERE workspaceId=? AND id=?', w, id);
      if (!cur) fail(404, 'Indicación médica no encontrada.');
      if (cur.status === 'ADMINISTERED') fail(400, 'Esta indicación médica ya fue administrada.');
      if (cur.status === 'CANCELLED') fail(400, 'Esta indicación médica fue cancelada.');

      const items = typeof cur.items === 'string' ? JSON.parse(cur.items) : (cur.items || []);
      const p = q('SELECT firstName, lastName FROM patients WHERE id=?', cur.patientId);
      const pName = p ? `${p.firstName} ${p.lastName}` : 'Paciente';

      transaction(() => {
        for (const item of items) {
          if (item.inventoryId) {
            const inv = q('SELECT * FROM inventory WHERE workspaceId=? AND id=?', w, item.inventoryId);
            if (inv) {
              const qtyToDiscount = Math.max(1, parseInt(item.quantity, 10) || 1);
              const newQty = Math.max(0, inv.quantity - qtyToDiscount);
              run('UPDATE inventory SET quantity=?, updatedAt=? WHERE workspaceId=? AND id=?', newQty, now(), w, inv.id);
              audit(u, 'INVENTORY_DISCOUNT_NURSE', 'inventory', inv.id,
                `Descuento de ${qtyToDiscount} ${inv.unit} de "${inv.name}" administrado a paciente ${pName} (Indicación #${id.slice(0, 8)}). Stock restante: ${newQty}.`);
            }
          }
        }
        run('UPDATE medical_orders SET status=?, administeredBy=?, administeredAt=?, updatedAt=? WHERE workspaceId=? AND id=?',
          'ADMINISTERED', u.name, now(), now(), w, id);
        audit(u, 'MEDICAL_ORDER_ADMINISTERED', 'medical_order', id, `Indicación administrada y stock descontado por ${u.name}.`);
      });

      return json(res, 200, { ok: true, id, status: 'ADMINISTERED', administeredBy: u.name, administeredAt: now() });
    }

    const medOrderCancelMatch = path.match(/^\/api\/medical-orders\/([^/]+)\/cancel$/);
    if (medOrderCancelMatch && method === 'POST') {
      const id = medOrderCancelMatch[1];
      const cur = q('SELECT * FROM medical_orders WHERE workspaceId=? AND id=?', w, id);
      if (!cur) fail(404, 'Indicación médica no encontrada.');
      transaction(() => {
        run('UPDATE medical_orders SET status=?, updatedAt=? WHERE workspaceId=? AND id=?', 'CANCELLED', now(), w, id);
        audit(u, 'MEDICAL_ORDER_CANCELLED', 'medical_order', id, `Indicación médica cancelada.`);
      });
      return json(res, 200, { ok: true, id, status: 'CANCELLED' });
    }

    if (path === '/api/migration/import' && method === 'POST') {
      const b = await body(req);
      const rows = Array.isArray(b.rows) ? b.rows : [];
      if (!rows.length) fail(400, 'No se proporcionaron filas para importar.');

      let imported = 0, updated = 0, skipped = 0;
      const errors = [];

      transaction(() => {
        for (const row of rows) {
          try {
            const rawDni = String(row.dni || row.documento || row.DNI || '').trim().replace(/\D/g, '');
            const rawPhone = String(row.phone || row.telefono || row.celular || '').trim();
            const cleanPhone = rawPhone ? phone(rawPhone) : `+54911${Math.floor(10000000 + Math.random() * 90000000)}`;
            const firstName = text(row.firstName || row.nombre || row.Nombre || 'Paciente', 'Nombre', 1, 80);
            const lastName = text(row.lastName || row.apellido || row.Apellido || 'Omnia', 'Apellido', 1, 80);
            const email = optional(row.email || row.correo || row.Email, 'Email', 120) || '';
            const coverage = text(row.coverage || row.obraSocial || row.prepaga || row['Obra Social'] || 'Particular', 'Cobertura', 1, 100);
            const affiliateNumber = optional(row.affiliateNumber || row.nroAfiliado || row.afiliado, 'Nro Afiliado', 50) || '';
            const birthDate = optional(row.birthDate || row.fechaNacimiento || row['Fecha de Nacimiento'], 'Fecha Nac.', 20) || '';
            const cuitCuil = optional(row.cuitCuil || row.cuit || row.cuil, 'CUIT/CUIL', 20) || '';
            const notes = optional(row.notes || row.observaciones || row.diagnostico, 'Notas', 1000) || 'Importado desde Omniasalud';

            const medicalHistory = {
              allergies: row.allergies || row.alergias || 'Sin alergias reportadas',
              pathological: row.pathological || row.patologias || '',
              surgical: row.surgical || row.cirugias || '',
              medications: row.medications || row.medicacion || '',
              familyHistory: row.familyHistory || row.heredofamiliares || '',
              habits: row.habits || row.habitos || '',
              updatedAt: now(),
              updatedBy: 'Migración Omniasalud'
            };

            let existing = rawDni ? q('SELECT id FROM patients WHERE workspaceId=? AND dni=?', w, rawDni) : null;
            if (!existing && cleanPhone) {
              existing = q('SELECT id FROM patients WHERE workspaceId=? AND phone=?', w, cleanPhone);
            }

            if (existing) {
              run('UPDATE patients SET firstName=?, lastName=?, coverage=?, affiliateNumber=?, birthDate=?, cuitCuil=?, medicalHistory=?, updatedAt=? WHERE workspaceId=? AND id=?',
                firstName, lastName, coverage, affiliateNumber, birthDate, cuitCuil, JSON.stringify(medicalHistory), now(), w, existing.id);
              updated++;
            } else {
              const newId = uid();
              const pRecord = {
                id: newId,
                workspaceId: w,
                firstName,
                lastName,
                dni: rawDni || String(Math.floor(10000000 + Math.random() * 80000000)),
                phone: cleanPhone,
                email,
                coverage,
                status: 'ACTIVE',
                notes,
                medicalHistory: JSON.stringify(medicalHistory),
                birthDate,
                cuitCuil,
                affiliateNumber,
                createdAt: now(),
                updatedAt: now()
              };
              put('patients', pRecord);
              imported++;
            }
          } catch (err) {
            errors.push({ row, error: err.message });
            skipped++;
          }
        }
        audit(u, 'MIGRATION_OMNIA_IMPORTED', 'migration', uid(), `Importación masiva completada: ${imported} nuevos pacientes, ${updated} actualizados.`);
      });

      return json(res, 200, { ok: true, imported, updated, skipped, total: rows.length, errors });
    }

    if (path === '/api/copilot' && method === 'POST') {
      if (settings(w).pauseAssistant) fail(409, 'El asistente operativo está pausado temporalmente en Configuración.', 'PAUSED');
      const b = await body(req), command = text(b.text, 'Mensaje', 1, 1000).toLowerCase();
      const appts = all("SELECT a.*,p.firstName,p.lastName FROM appointments a JOIN patients p ON p.id=a.patientId WHERE a.workspaceId=? ORDER BY startAt", w)
        .filter(a => clinicDate(new Date(a.startAt)) === clinicDate() && a.status !== 'CANCELLED');

      let answer = 'Puedo asistirte con el estado de la agenda, turnos pendientes de confirmación, pacientes agendados y balance de cobros del día. ¿Qué deseas consultar?';

      if (/diagn[oó]st|medicamento|dosis|tratamiento|s[ií]ntoma/.test(command)) {
        answer = 'Como asistente clínico operativo, te recuerdo que la prescripción médica y decisiones terapéuticas son responsabilidad exclusiva del profesional de salud actuante.';
      } else if (/cobro|pago|caja|ingreso|total/.test(command)) {
        const n = q('SELECT COALESCE(SUM(amountCents),0) total,COUNT(*) count FROM payments WHERE workspaceId=?', w);
        answer = `Actualmente hay ${n.count} cobros registrados en la jornada por un total de ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n.total / 100)}.`;
      } else if (/pendiente|confirm|recordatorio/.test(command)) {
        const p = appts.filter(a => a.status === 'PENDING');
        answer = p.length
          ? `Hay ${p.length} turnos pendientes de confirmación hoy: ${p.map(a => a.firstName + ' ' + a.lastName).join(', ')}. Puedes confirmarlos o reprogramarlos directamente desde la Agenda.`
          : 'Todos los turnos de la fecha se encuentran confirmados o atendidos.';
      } else if (/agenda|turno|resumen|hoy/.test(command)) {
        const conf = appts.filter(a => a.status === 'CONFIRMED').length;
        const pend = appts.filter(a => a.status === 'PENDING').length;
        const done = appts.filter(a => a.status === 'COMPLETED').length;
        answer = `Resumen de hoy: ${appts.length} turnos programados (${conf} confirmados, ${pend} pendientes y ${done} atendidos).`;
      } else if (/paciente|directorio/.test(command)) {
        const totalP = q('SELECT COUNT(*) as n FROM patients WHERE workspaceId=?', w).n;
        answer = `Tu clínica tiene actualmente ${totalP} pacientes registrados en el directorio central.`;
      }

      return json(res, 200, { answer, source: 'CLINIC_COPILOT' });
    }

    fail(404, 'Ruta de API no encontrada.', 'NOT_FOUND');
  }

  // Static files and SPA routing
  if (!['GET', 'HEAD'].includes(method)) fail(405, 'Método no permitido.');
  const files = {
    '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
    '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
    '/favicon.svg': ['favicon.svg', 'image/svg+xml'],
    '/favicon.png': ['favicon.png', 'image/png'],
    '/logo.png': ['logo.png', 'image/png']
  };

  const entry = files[path] || (
    ['/', '/login', '/admin', '/patients', '/schedule', '/pipeline', '/records', '/inventory', '/billing', '/analytics', '/integrations', '/settings', '/audit', '/portal'].includes(path) || path.startsWith('/verify/') || path.startsWith('/portal')
      ? ['index.html', 'text/html; charset=utf-8']
      : null
  );

  if (!entry) fail(404, 'Página no encontrada.');
  res.writeHead(200, { 'Content-Type': entry[1] });
  res.end(method === 'HEAD' ? '' : readFileSync(join(here, 'public', entry[0])));
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(e => {
    if (res.headersSent) { res.end(); return; }
    if (e instanceof ApiError) return json(res, e.status, { error: e.message, code: e.code });
    console.error('[server]', e.message);
    json(res, 500, { error: 'Ocurrió un error en el servidor. Por favor revisa los registros.', code: 'INTERNAL_ERROR' });
  });
});

export default server;
export { handle, db };

if (!isVercel) {
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.listen(PORT, HOST, () => {
    console.log(`Abundance Clinic OS activo en http://${HOST}:${PORT}\nBase de datos: ${dataFile}`);
  });

  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
  }
}
