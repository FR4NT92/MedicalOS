-- ==============================================================================
-- ABUNDANCE CLINIC OS - SEED DATA FOR DEMO & CLINICAL INTEGRATION
-- Includes: 2 Scoped Tenants, Clinicians, HL7 FHIR Patients, Vitals, Encounters
-- ==============================================================================

-- 1. SEED TENANTS
INSERT INTO public.tenants (id, name, slug, ghl_location_id, is_active)
VALUES 
    ('d3b07384-d113-4011-828e-5cb239f1c7d2', 'Centro Médico Metropolitano', 'cmm-01', 'ghl_loc_metropolitano_01', true),
    ('e8a15992-f224-4122-939f-6dc340e2d8e3', 'Clínica San Rafael', 'csr-02', 'ghl_loc_sanrafael_02', true)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED CLINICIANS & STAFF
INSERT INTO public.clinic_users (id, tenant_id, npi_number, role, first_name, last_name, email, is_active)
VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'd3b07384-d113-4011-828e-5cb239f1c7d2', 'MN-145892', 'CLINICIAN', 'Alejandro', 'Morales', 'dr.morales@abundance.clinic', true),
    ('c2222222-2222-2222-2222-222222222222', 'd3b07384-d113-4011-828e-5cb239f1c7d2', 'MN-178901', 'ADMIN', 'Luciana', 'Vázquez', 'admin.cmm@abundance.clinic', true),
    ('c3333333-3333-3333-3333-333333333333', 'e8a15992-f224-4122-939f-6dc340e2d8e3', 'MN-201944', 'CLINICIAN', 'Martín', 'Fierro', 'dr.fierro@sanrafael.med', true)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED FHIR PATIENTS
INSERT INTO public.fhir_patient (id, tenant_id, active, identifier, name, telecom, gender, birth_date, ghl_contact_id)
VALUES 
    (
        'p1000000-0000-0000-0000-000000000001',
        'd3b07384-d113-4011-828e-5cb239f1c7d2',
        true,
        '[{"system": "urn:oid:abundance:mrn", "value": "#AB-9012"}, {"system": "urn:oid:gov:dni", "value": "31902114"}]'::jsonb,
        '[{"use": "official", "family": "Gómez", "given": ["Valeria", "Sofía"]}]'::jsonb,
        '[{"system": "phone", "value": "+54 9 11 4455-6677", "use": "mobile"}, {"system": "email", "value": "valeria.gomez@gmail.com"}]'::jsonb,
        'female',
        '1984-06-15',
        'ghl_c_889211'
    ),
    (
        'p2000000-0000-0000-0000-000000000002',
        'd3b07384-d113-4011-828e-5cb239f1c7d2',
        true,
        '[{"system": "urn:oid:abundance:mrn", "value": "#AB-9013"}, {"system": "urn:oid:gov:dni", "value": "28450119"}]'::jsonb,
        '[{"use": "official", "family": "Rossi", "given": ["Carlos", "Alberto"]}]'::jsonb,
        '[{"system": "phone", "value": "+54 9 11 3322-1199", "use": "mobile"}]'::jsonb,
        'male',
        '1981-02-10',
        'ghl_c_774102'
    )
ON CONFLICT (id) DO NOTHING;

-- 4. SEED FHIR ENCOUNTERS
INSERT INTO public.fhir_encounter (id, tenant_id, status, subject_patient_id, clinician_id, period_start, ghl_appointment_id)
VALUES 
    (
        'e1000000-0000-0000-0000-000000000001',
        'd3b07384-d113-4011-828e-5cb239f1c7d2',
        'in-progress',
        'p1000000-0000-0000-0000-000000000001',
        'c1111111-1111-1111-1111-111111111111',
        timezone('utc'::text, now()) - interval '20 minutes',
        'ghl_apt_99120'
    )
ON CONFLICT (id) DO NOTHING;

-- 5. SEED FHIR OBSERVATIONS (LOINC VITAL SIGNS)
INSERT INTO public.fhir_observation (id, tenant_id, status, code, subject_patient_id, encounter_id, effective_date_time, value_quantity)
VALUES 
    (
        'o1000000-0000-0000-0000-000000000001',
        'd3b07384-d113-4011-828e-5cb239f1c7d2',
        'final',
        '{"coding": [{"system": "http://loinc.org", "code": "85354-9", "display": "Blood Pressure"}]}'::jsonb,
        'p1000000-0000-0000-0000-000000000001',
        'e1000000-0000-0000-0000-000000000001',
        timezone('utc'::text, now()) - interval '15 minutes',
        '{"value": 120, "unit": "mmHg"}'::jsonb
    ),
    (
        'o2000000-0000-0000-0000-000000000002',
        'd3b07384-d113-4011-828e-5cb239f1c7d2',
        'final',
        '{"coding": [{"system": "http://loinc.org", "code": "8867-4", "display": "Heart Rate"}]}'::jsonb,
        'p1000000-0000-0000-0000-000000000001',
        'e1000000-0000-0000-0000-000000000001',
        timezone('utc'::text, now()) - interval '15 minutes',
        '{"value": 72, "unit": "lpm"}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- 6. SEED AUDIT LOG
INSERT INTO public.audit_logs (tenant_id, user_id, action, resource_type, resource_id, tamper_proof_hash, created_at)
VALUES 
    (
        'd3b07384-d113-4011-828e-5cb239f1c7d2',
        'c1111111-1111-1111-1111-111111111111',
        'READ',
        'fhir_patient',
        'p1000000-0000-0000-0000-000000000001',
        '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        timezone('utc'::text, now()) - interval '20 minutes'
    );
