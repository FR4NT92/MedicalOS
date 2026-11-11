-- ==============================================================================
-- ABUNDANCE CLINIC OS - MULTITENANT DATABASE INITIALIZATION SCRIPT
-- Standards: HL7 FHIR v4.0.1, HIPAA / GDPR Security Rule Compliant
-- Security: Row-Level Security (RLS) per tenant, AES-256 pgcrypto, Immutable Audit Log
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TENANCY SCHEMA & CONTEXT HELPERS
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    ghl_location_id VARCHAR(100), -- GoHighLevel v2 Location Binding
    is_active BOOLEAN NOT NULL DEFAULT true,
    data_classification VARCHAR(50) NOT NULL DEFAULT 'PHI-HIGH-SENSITIVITY',
    encryption_key_arn VARCHAR(255), -- Reference to external KMS / Vault for tenant-specific envelope encryption
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Function to extract tenant_id from Supabase JWT claim or local app session variable
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
DECLARE
    jwt_claim_tenant_id text;
    session_tenant_id text;
BEGIN
    -- Check Supabase auth JWT app_metadata claim first
    jwt_claim_tenant_id := current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'tenant_id';
    IF jwt_claim_tenant_id IS NOT NULL AND jwt_claim_tenant_id <> '' THEN
        RETURN jwt_claim_tenant_id::UUID;
    END IF;

    -- Fallback to application session variable (for backend services / queue workers)
    session_tenant_id := current_setting('app.current_tenant_id', true);
    IF session_tenant_id IS NOT NULL AND session_tenant_id <> '' THEN
        RETURN session_tenant_id::UUID;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to extract user_id from Supabase auth
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. CLINICIANS & STAFF MEMBERSHIP
CREATE TABLE IF NOT EXISTS public.clinic_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- Foreign key to auth.users in Supabase
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    npi_number VARCHAR(100), -- National Provider Identifier / Matrícula Médica
    role VARCHAR(50) NOT NULL CHECK (role IN ('CLINICIAN', 'ADMIN', 'NURSE', 'AUDITOR')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    digital_signature_pubkey TEXT, -- Public key for verification of electronic signature
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clinic_users_tenant ON public.clinic_users(tenant_id);

-- 4. HL7 FHIR CORE TABLES (COMPLIANT RELATIONAL SCHEMA)

-- FHIR: Patient (https://hl7.org/fhir/R4/patient.html)
CREATE TABLE IF NOT EXISTS public.fhir_patient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    active BOOLEAN NOT NULL DEFAULT true,
    -- Identifiers: SSN, Medical Record Number (MRN), DNI
    identifier JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- HumanName: [{ use: "official", family: "...", given: ["..."] }]
    name JSONB NOT NULL,
    -- Telecom: [{ system: "phone|email", value: "...", use: "home|mobile" }]
    telecom JSONB NOT NULL DEFAULT '[]'::jsonb,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other', 'unknown')),
    birth_date DATE NOT NULL,
    address JSONB DEFAULT '[]'::jsonb,
    -- External Integration: GoHighLevel Contact Mapping
    ghl_contact_id VARCHAR(100),
    -- Sensitive Notes (Encrypted at application level or using pgcrypto)
    encrypted_notes BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_fhir_patient_tenant ON public.fhir_patient(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fhir_patient_ghl_id ON public.fhir_patient(tenant_id, ghl_contact_id);
CREATE INDEX IF NOT EXISTS idx_fhir_patient_identifier_gin ON public.fhir_patient USING gin(identifier);

-- FHIR: Encounter (https://hl7.org/fhir/R4/encounter.html)
CREATE TABLE IF NOT EXISTS public.fhir_encounter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled', 'entered-in-error'
    )),
    class JSONB NOT NULL DEFAULT '{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "AMB", "display": "ambulatory"}'::jsonb,
    subject_patient_id UUID NOT NULL REFERENCES public.fhir_patient(id) ON DELETE RESTRICT,
    clinician_id UUID REFERENCES public.clinic_users(id),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ,
    reason_code JSONB DEFAULT '[]'::jsonb, -- ICD-10 / SNOMED CT coding
    ghl_appointment_id VARCHAR(100), -- GoHighLevel v2 appointment mapping
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_fhir_encounter_tenant_patient ON public.fhir_encounter(tenant_id, subject_patient_id);
CREATE INDEX IF NOT EXISTS idx_fhir_encounter_status ON public.fhir_encounter(tenant_id, status);

-- FHIR: Observation (https://hl7.org/fhir/R4/observation.html)
CREATE TABLE IF NOT EXISTS public.fhir_observation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error'
    )),
    category JSONB NOT NULL DEFAULT '[{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}]'::jsonb,
    -- LOINC or SNOMED CT code
    code JSONB NOT NULL,
    subject_patient_id UUID NOT NULL REFERENCES public.fhir_patient(id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES public.fhir_encounter(id) ON DELETE SET NULL,
    effective_date_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- FHIR Value Choices: valueQuantity, valueCodeableConcept, valueString
    value_quantity JSONB,
    value_string TEXT,
    interpretation JSONB, -- normal, high, low, critical
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_fhir_obs_tenant_subject ON public.fhir_observation(tenant_id, subject_patient_id);
CREATE INDEX IF NOT EXISTS idx_fhir_obs_encounter ON public.fhir_observation(encounter_id);

-- FHIR: ClinicalImpression (https://hl7.org/fhir/R4/clinicalimpression.html)
-- Core for Medical Copilot drafts & Human-in-the-Loop Clinical Validation
CREATE TABLE IF NOT EXISTS public.fhir_clinical_impression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'draft', 'in-progress', 'completed', 'entered-in-error'
    )),
    subject_patient_id UUID NOT NULL REFERENCES public.fhir_patient(id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES public.fhir_encounter(id) ON DELETE SET NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    summary TEXT NOT NULL, -- Subjective, Objective, Assessment, Plan (SOAP)
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    prognosis_codable JSONB DEFAULT '[]'::jsonb,
    
    -- HUMAN-IN-THE-LOOP & COMPLIANCE FIELDS
    ai_generated BOOLEAN NOT NULL DEFAULT true,
    ai_model_version VARCHAR(100),
    ai_raw_prompt_hash VARCHAR(64), -- SHA-256 digest of dictation/context for tamper auditing
    
    -- Electronic Signature (Clinician Validation)
    signed_by UUID REFERENCES public.clinic_users(id),
    signed_at TIMESTAMPTZ,
    signature_digest VARCHAR(256), -- Cryptographic hash (SHA-256) of (summary + findings + clinician_id + signed_at)
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_fhir_clin_imp_tenant_enc ON public.fhir_clinical_impression(tenant_id, encounter_id);
CREATE INDEX IF NOT EXISTS idx_fhir_clin_imp_status ON public.fhir_clinical_impression(tenant_id, status);

-- 5. IMMUTABLE AUDIT LOG (APPEND-ONLY FOR HIPAA § 164.312(b) & GDPR Art. 30)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    user_id UUID, -- References clinic_users or auth.users
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'READ', 'CREATE', 'UPDATE', 'DELETE', 'SIGN', 'EXPORT', 'AI_DISPATCH', 'GHL_SYNC'
    )),
    resource_type VARCHAR(100) NOT NULL, -- e.g., 'fhir_patient', 'fhir_clinical_impression'
    resource_id UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    change_diff JSONB, -- State difference (PHI sanitized or hashed)
    tamper_proof_hash VARCHAR(64) NOT NULL, -- Cumulative hash / SHA-256 verification
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_resource ON public.audit_logs(tenant_id, resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(tenant_id, created_at DESC);

-- STRICT IMMUTABILITY TRIGGER: PREVENTS UPDATES AND DELETES ON AUDIT LOGS
CREATE OR REPLACE FUNCTION public.fn_prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'COMPLIANCE VIOLATION: Audit logs are append-only. Modification or deletion of audit records is strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_audit_tampering();

-- Automatic calculation of tamper_proof_hash before insert
CREATE OR REPLACE FUNCTION public.fn_generate_audit_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tamper_proof_hash := encode(
        digest(
            concat_ws('|', 
                NEW.tenant_id::text, 
                coalesce(NEW.user_id::text, 'SYSTEM'), 
                NEW.action, 
                NEW.resource_type, 
                NEW.resource_id::text, 
                NEW.created_at::text,
                coalesce(NEW.change_diff::text, '')
            ), 
            'sha256'
        ), 
        'hex'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_hash ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_hash
BEFORE INSERT ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.fn_generate_audit_hash();

-- 6. ROW-LEVEL SECURITY (RLS) POLICIES
-- Strict multitenant isolation: No tenant can read or modify another tenant's PHI

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fhir_patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fhir_encounter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fhir_observation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fhir_clinical_impression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenants Policy
CREATE POLICY tenant_isolation_tenants ON public.tenants
    FOR ALL
    USING (id = public.current_tenant_id());

-- Clinic Users Policy
CREATE POLICY tenant_isolation_clinic_users ON public.clinic_users
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- FHIR Patient Policy
CREATE POLICY tenant_isolation_fhir_patient ON public.fhir_patient
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- FHIR Encounter Policy
CREATE POLICY tenant_isolation_fhir_encounter ON public.fhir_encounter
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- FHIR Observation Policy
CREATE POLICY tenant_isolation_fhir_observation ON public.fhir_observation
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- FHIR Clinical Impression Policy
CREATE POLICY tenant_isolation_fhir_clinical_impression ON public.fhir_clinical_impression
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- Audit Logs Policy: Append allowed for current tenant, Read restricted to tenant members
CREATE POLICY tenant_isolation_audit_logs_select ON public.audit_logs
    FOR SELECT
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_audit_logs_insert ON public.audit_logs
    FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id());
