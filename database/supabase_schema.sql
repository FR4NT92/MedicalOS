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
