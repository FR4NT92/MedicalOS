-- ============================================================================
-- ABUNDANCE CLINIC OS - ESQUEMA DE PRODUCCIÓN POSTGRESQL / SUPABASE CON RLS
-- Multi-tenant isolation by tenant_id / workspace_id with Row Level Security
-- ============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabla de Espacios Clínicos / Clínicas (Tenants)
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    color TEXT NOT NULL DEFAULT '#357a60',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Usuarios con roles y pertenencia a Tenant
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST')),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de Sesiones Activas
CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf TEXT NOT NULL,
    expires_at BIGINT NOT NULL
);

-- 5. Tabla de Configuración de la Clínica
CREATE TABLE IF NOT EXISTS settings (
    workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 6. Tabla de Integraciones y Conexiones Centrales
CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    initials TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NOT_CONNECTED' CHECK (status IN ('CONNECTED', 'NOT_CONNECTED', 'ERROR')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Profesionales Médicos
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    license_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, id)
);

-- 8. Directorio de Pacientes
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    dni TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    coverage TEXT NOT NULL DEFAULT 'Particular',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCHARGED')),
    notes TEXT,
    medical_history JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, phone),
    UNIQUE(workspace_id, id)
);

-- 9. Agenda Médica y Turnos
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    type TEXT NOT NULL DEFAULT 'CONSULTATION' CHECK (type IN ('CONSULTATION', 'FOLLOW_UP', 'PROCEDURE', 'SURGERY')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY(workspace_id, patient_id) REFERENCES patients(workspace_id, id) ON DELETE CASCADE,
    FOREIGN KEY(workspace_id, doctor_id) REFERENCES doctors(workspace_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_appointment_slots ON appointments(workspace_id, doctor_id, start_at, end_at);

-- 10. Leads y Seguimiento Comercial / Admisión
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'Web Institucional',
    interest TEXT,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'ARCHIVED')),
    ai_triage JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Historias Clínicas Electrónicas (SOAP Inmutable con Hash Criptográfico)
CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SOAP_NOTE' CHECK (type IN ('SOAP_NOTE', 'AMENDMENT')),
    content JSONB NOT NULL,
    author TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_hash TEXT NOT NULL DEFAULT '',
    hash TEXT NOT NULL,
    amendment_of TEXT REFERENCES records(id),
    FOREIGN KEY(workspace_id, patient_id) REFERENCES patients(workspace_id, id) ON DELETE CASCADE
);

-- Regla de inmutabilidad en PostgreSQL
CREATE OR REPLACE FUNCTION prevent_record_modifications()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Las historias clínicas son inmutables. Para modificaciones debe registrarse una enmienda.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_records_no_update ON records;
CREATE TRIGGER trg_records_no_update BEFORE UPDATE ON records
FOR EACH ROW EXECUTE FUNCTION prevent_record_modifications();

DROP TRIGGER IF EXISTS trg_records_no_delete ON records;
CREATE TRIGGER trg_records_no_delete BEFORE DELETE ON records
FOR EACH ROW EXECUTE FUNCTION prevent_record_modifications();

-- 12. Recetas Médicas Electrónicas
CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISPENSED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY(workspace_id, patient_id) REFERENCES patients(workspace_id, id) ON DELETE CASCADE
);

-- 12b. Consentimientos Médicos Informados (Ley 26.529)
CREATE TABLE IF NOT EXISTS consents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES doctors(id),
    doctor_name TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'PROCEDURE' CHECK (type IN ('PROCEDURE', 'DIAGNOSTIC', 'GENERAL_TREATMENT')),
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SIGNED' CHECK (status IN ('SIGNED', 'REVOKED')),
    hash TEXT NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Cobros y Transacciones de Pago (con Idempotencia)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    appointment_id TEXT REFERENCES appointments(id),
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    method TEXT NOT NULL CHECK (method IN ('TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'MERCADOPAGO', 'OTRO')),
    reference TEXT,
    idempotency_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'APPROVED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, idempotency_key),
    FOREIGN KEY(workspace_id, patient_id) REFERENCES patients(workspace_id, id) ON DELETE CASCADE
);

-- 14. Facturación Electrónica (Comprobantes oficiales con CAE de ARCA ex-AFIP)
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    concept TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    invoice_type TEXT NOT NULL DEFAULT 'B' CHECK (invoice_type IN ('A', 'B', 'C')),
    invoice_number TEXT,
    doc_type TEXT NOT NULL DEFAULT '96',
    doc_number TEXT,
    cae TEXT,
    cae_expiration TIMESTAMPTZ,
    qr_url TEXT,
    status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY(workspace_id, patient_id) REFERENCES patients(workspace_id, id) ON DELETE CASCADE
);

-- 15. Inventario de Insumos y Medicamentos Clínicos
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 10,
    unit TEXT NOT NULL DEFAULT 'unidades',
    lot_number TEXT,
    expiry_date DATE,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISCONTINUED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Auditoría del Sistema (Trazabilidad estricta)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ACTIVACIÓN DE ROW LEVEL SECURITY (RLS) PARA AISLAMIENTO MULTI-TENANT
-- ============================================================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user workspace from Supabase JWT:
CREATE OR REPLACE FUNCTION current_workspace_id() RETURNS TEXT AS $$
    SELECT coalesce(
        current_setting('request.jwt.claim.workspace_id', true),
        (current_setting('request.jwt.claims', true)::jsonb ->> 'workspace_id')
    );
$$ LANGUAGE sql STABLE;

-- Helper function to check if current user is Super Admin:
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
    SELECT coalesce(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'SUPER_ADMIN',
        false
    );
$$ LANGUAGE sql STABLE;

-- Policies for Patients
CREATE POLICY tenant_isolation_patients ON patients
    FOR ALL
    USING (workspace_id = current_workspace_id() OR is_super_admin());

-- Policies for Appointments
CREATE POLICY tenant_isolation_appointments ON appointments
    FOR ALL
    USING (workspace_id = current_workspace_id() OR is_super_admin());

-- Policies for Leads
CREATE POLICY tenant_isolation_leads ON leads
    FOR ALL
    USING (workspace_id = current_workspace_id() OR is_super_admin());

-- Policies for Records (Doctors and Clinic Staff only)
CREATE POLICY tenant_isolation_records ON records
    FOR ALL
    USING (workspace_id = current_workspace_id());

-- Policies for Consents
CREATE POLICY tenant_isolation_consents ON consents
    FOR ALL
    USING (workspace_id = current_workspace_id());

-- Policies for Payments
CREATE POLICY tenant_isolation_payments ON payments
    FOR ALL
    USING (workspace_id = current_workspace_id() OR is_super_admin());

-- Policies for Invoices
CREATE POLICY tenant_isolation_invoices ON invoices
    FOR ALL
    USING (workspace_id = current_workspace_id() OR is_super_admin());

-- Policies for Inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_inventory ON inventory
    FOR ALL
    USING (workspace_id = current_workspace_id() OR is_super_admin());
-- ============================================================================
-- ABUNDANCE CLINIC OS - DATOS INICIALES (SEED) PARA SUPABASE
-- ============================================================================

-- 1. Espacios Clínicos (Workspaces / Tenants)
INSERT INTO workspaces (id, name, slug, timezone, color)
VALUES
    ('clinic-central', 'Clínica Médica Abundance', 'abundance-central', 'America/Argentina/Buenos_Aires', '#357a60'),
    ('clinic-nordelta', 'Abundance Medical Center', 'abundance-nordelta', 'America/Argentina/Buenos_Aires', '#2d6a50')
ON CONFLICT (id) DO NOTHING;

-- 2. Configuración predeterminada de la clínica
INSERT INTO settings (workspace_id, value)
VALUES
    ('clinic-central', '{"pauseAssistant":false,"pauseWebhooks":false,"pauseBilling":false,"opening":"09:00","closing":"18:00","slotMinutes":30}'::jsonb),
    ('clinic-nordelta', '{"pauseAssistant":false,"pauseWebhooks":false,"pauseBilling":false,"opening":"09:00","closing":"18:00","slotMinutes":30}'::jsonb)
ON CONFLICT (workspace_id) DO NOTHING;

-- 3. Integraciones Centrales
INSERT INTO integrations (id, name, category, initials, description, status, config)
VALUES
    ('highlevel', 'GoHighLevel', 'CRM y Pipelines', 'HL', 'Sincronización bidireccional de pacientes, oportunidades en embudos y agendamiento de turnos.', 'NOT_CONNECTED', '{"locationId":"","apiKey":"","webhookUrl":""}'::jsonb),
    ('whatsapp', 'WhatsApp Business API', 'Mensajería y Notificaciones', 'WA', 'Envío automático de confirmaciones de turnos, recordatorios 24h antes y reprogramaciones.', 'NOT_CONNECTED', '{"phoneNumberId":"","appId":"","token":"","templateName":"recordatorio_turno"}'::jsonb),
    ('mercadopago', 'Mercado Pago', 'Pasarela de Cobros', 'MP', 'Cobro de copagos y consultas mediante links de pago, checkout integrado y notificaciones IPN.', 'NOT_CONNECTED', '{"accessToken":"","publicKey":"","sandbox":false}'::jsonb),
    ('arca', 'ARCA (ex AFIP)', 'Facturación Electrónica', 'AR', 'Emisión de comprobantes fiscales oficiales (Facturas A, B, C) con obtención directa de CAE.', 'NOT_CONNECTED', '{"cuit":"","puntoVenta":"0001","certPath":"","privateKeyPath":"","ambiente":"homologacion"}'::jsonb),
    ('ai', 'Proveedor de Inteligencia Artificial', 'Asistente Clínico y Operativo', 'IA', 'Copiloto para resumen de historias clínicas, triage y automatización de respuestas a pacientes.', 'NOT_CONNECTED', '{"provider":"OpenAI","apiKey":"","model":"gpt-4o","temperature":0.3}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Profesionales Médicos
INSERT INTO doctors (id, workspace_id, name, specialty, license_number)
VALUES
    ('doctor-1', 'clinic-central', 'Dra. Julia Morales', 'Medicina General y Preventiva', 'MN 142.890'),
    ('doctor-2', 'clinic-central', 'Dr. Tomás Benítez', 'Cardiología Clínica', 'MN 138.450')
ON CONFLICT (id) DO NOTHING;

-- 5. Pacientes Iniciales con Antecedentes Médicos (Ley 26.529)
INSERT INTO patients (id, workspace_id, first_name, last_name, dni, phone, email, coverage, status, medical_history)
VALUES
    ('patient-1', 'clinic-central', 'Valeria', 'Ríos', '35.482.901', '+54 11 4821-3920', 'valeria.rios@email.com', 'OSDE 310', 'ACTIVE',
     '{"allergies":"Sin alergias medicamentosas conocidas reportadas","pathological":"Hipotiroidismo primario en tratamiento sustitutivo","surgical":"Sin antecedentes quirúrgicos mayores","medications":"Levotiroxina 75 mcg / día en ayunas","familyHistory":"Madre con hipotiroidismo","habits":"No tabaquista. Dieta equilibrada y actividad aeróbica 3x/sem."}'::jsonb),
    ('patient-2', 'clinic-central', 'Bruno', 'Rossi', '31.298.441', '+54 11 5918-2041', 'bruno.rossi@email.com', 'Swiss Medical', 'ACTIVE',
     '{"allergies":"Alergia severa a Penicilina (anafilaxia previa) y AINEs (Ibuprofeno)","pathological":"Hipertensión Arterial Grado 2 (desde 2021), Dislipidemia","surgical":"Colecistectomía laparoscópica (2019)","medications":"Enalapril 10 mg / 12 hs, Atorvastatina 20 mg / noche","familyHistory":"Padre con IAM a los 58 años, abuelo materno ACV","habits":"Ex tabaquista (hace 4 años). Consumo social de alcohol moderado."}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 6. Inventario Inicial de Insumos Médicos
INSERT INTO inventory (id, workspace_id, name, sku, category, quantity, min_quantity, unit, lot_number, expiry_date, notes, status)
VALUES
    ('inv-1', 'clinic-central', 'Gasas estériles 10x10cm (Caja x 100)', 'GAS-001', 'Suturas y Curaciones', 45, 15, 'cajas', 'LT-2024-89', '2027-12-31', 'Uso en consultorios y curaciones generales', 'ACTIVE'),
    ('inv-2', 'clinic-central', 'Jeringas descartables 5ml c/aguja 21G (Caja x 100)', 'JER-005', 'Descartables', 28, 10, 'cajas', 'LT-98210', '2028-06-30', 'Aplicación intramuscular y endovenosa', 'ACTIVE'),
    ('inv-3', 'clinic-central', 'Guantes de examen de látex talle M (Caja x 100)', 'GUA-LAT-M', 'Descartables', 8, 12, 'cajas', 'LT-44120', '2027-04-15', 'Stock bajo - Reposición requerida', 'ACTIVE'),
    ('inv-4', 'clinic-central', 'Guantes de nitrilo sin polvo talle L (Caja x 100)', 'GUA-NIT-L', 'Descartables', 22, 10, 'cajas', 'LT-33901', '2027-09-30', 'Para procedimientos y pacientes alérgicos al látex', 'ACTIVE'),
    ('inv-5', 'clinic-central', 'Solución Fisiológica 0.9% 500ml', 'SUER-FIS-500', 'Soluciones y Sueros', 35, 10, 'frascos', 'LT-77123', '2026-11-20', 'Infusiones, lavado ocular y curaciones', 'ACTIVE'),
    ('inv-6', 'clinic-central', 'Alcohol Etílico 70% 1 Litro', 'ALC-70-1L', 'Antisépticos', 14, 5, 'botellas', 'LT-88122', '2028-01-10', 'Desinfección de consultorios y piel', 'ACTIVE'),
    ('inv-7', 'clinic-central', 'Lidocaína 2% c/epinefrina ampolla 5ml (Caja x 10)', 'LID-EPI-2', 'Medicamentos', 4, 10, 'cajas', 'LT-11029', '2026-08-15', 'Stock crítico - Anestésico local', 'ACTIVE'),
    ('inv-8', 'clinic-central', 'Barbijos quirúrgicos tricapa termo-sellados (Caja x 50)', 'BAR-TRI-50', 'Descartables', 18, 8, 'cajas', 'LT-55419', '2028-03-31', 'Protección personal equipo de salud', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
