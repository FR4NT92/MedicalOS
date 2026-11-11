-- ==============================================================================
-- ABUNDANCE CLINIC OS - REGULATORY CONSENTS & DIGITAL SIGNATURES SCHEMA
-- Standards:
-- - HIPAA 45 CFR § 164.520 (Notice of Privacy Practices - Patient NPP Consent)
-- - FDA 21 CFR Part 11 Subpart C (Electronic Signatures & Non-Repudiation Manifests)
-- - HL7 FHIR v4.0.1 Consent (https://hl7.org/fhir/R4/consent.html)
-- - US 21st Century Cures Act § 520(o)(1)(E) Non-Device CDS Verification
-- ==============================================================================

-- 1. HL7 FHIR CONSENT TABLE (PATIENT HIPAA NPP & TELEMEDICINE CONSENTS)
CREATE TABLE IF NOT EXISTS public.fhir_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.fhir_patient(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'proposed', 'active', 'rejected', 'inactive', 'entered-in-error')),
    scope VARCHAR(50) NOT NULL DEFAULT 'patient-privacy', -- 'patient-privacy', 'treatment', 'research'
    category VARCHAR(100) NOT NULL DEFAULT 'HIPAA_NPP', -- 'HIPAA_NPP', 'TELEHEALTH_CONSENT', 'AI_ASSISTED_TRANSCRIPTION'
    npp_version VARCHAR(20) NOT NULL DEFAULT '2026.1',
    signer_name VARCHAR(255) NOT NULL,
    signer_relationship VARCHAR(50) NOT NULL DEFAULT 'patient' CHECK (signer_relationship IN ('patient', 'parent', 'guardian', 'legal-representative')),
    signed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    signature_digest VARCHAR(64) NOT NULL, -- SHA-256 Digest of canonical consent payload
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_fhir_consent_tenant ON public.fhir_consent(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fhir_consent_patient ON public.fhir_consent(tenant_id, patient_id);

-- 2. 21 CFR PART 11 CLINICAL SIGNATURE MANIFESTS TABLE
CREATE TABLE IF NOT EXISTS public.clinical_signature_manifests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    resource_type VARCHAR(100) NOT NULL DEFAULT 'fhir_clinical_impression',
    resource_id UUID NOT NULL,
    clinician_id UUID NOT NULL REFERENCES public.clinic_users(id) ON DELETE RESTRICT,
    npi_number VARCHAR(100) NOT NULL,
    clinician_legal_name VARCHAR(255) NOT NULL,
    signing_meaning VARCHAR(255) NOT NULL DEFAULT 'Author, review and legal approval of the medical record evolution. Human-in-the-Loop verified.',
    canonical_content_hash VARCHAR(64) NOT NULL,
    signature_digest VARCHAR(64) NOT NULL, -- HMAC-SHA256 non-repudiation signature
    signed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    manifest_payload JSONB NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clinical_signatures_tenant ON public.clinical_signature_manifests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clinical_signatures_resource ON public.clinical_signature_manifests(tenant_id, resource_id);

-- 3. IMMUTABILITY TRIGGER FOR SIGNATURE MANIFESTS
CREATE OR REPLACE FUNCTION public.fn_prevent_signature_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'COMPLIANCE VIOLATION: Clinical signature manifests are legally immutable under 21 CFR Part 11. Modification or deletion is strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_signature_manifests_immutable ON public.clinical_signature_manifests;
CREATE TRIGGER trg_signature_manifests_immutable
BEFORE UPDATE OR DELETE ON public.clinical_signature_manifests
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_signature_tampering();

-- 4. ROW-LEVEL SECURITY (RLS)
ALTER TABLE public.fhir_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_signature_manifests ENABLE ROW LEVEL SECURITY;

-- Consent Policies
CREATE POLICY tenant_isolation_fhir_consent_select ON public.fhir_consent
    FOR SELECT
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_fhir_consent_insert ON public.fhir_consent
    FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id());

-- Signature Manifests Policies
CREATE POLICY tenant_isolation_signature_manifests_select ON public.clinical_signature_manifests
    FOR SELECT
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_signature_manifests_insert ON public.clinical_signature_manifests
    FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id());
