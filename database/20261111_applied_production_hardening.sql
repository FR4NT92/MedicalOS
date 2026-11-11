-- ============================================================================
-- ABUNDANCE CLINIC OS - HARDENING & OPTIMIZACIONES DE PRODUCCIÓN
-- Aplicado en proyecto Supabase Medical OS (jshyrwjfeyybdnzosgik)
-- Fecha: 11-Nov-2026
-- ============================================================================

-- 1. ÍNDICES DE RENDIMIENTO PARA TODAS LAS CLAVES FORÁNEAS Y FILTROS CLAVE
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON public.users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_workspace_id ON public.doctors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_patients_workspace_id ON public.patients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_patients_workspace_dni ON public.patients(workspace_id, dni);
CREATE INDEX IF NOT EXISTS idx_appointments_workspace_patient ON public.appointments(workspace_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_workspace_doctor ON public.appointments(workspace_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_slots ON public.appointments(workspace_id, doctor_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_id ON public.leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_status ON public.leads(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_records_workspace_patient ON public.records(workspace_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_records_amendment_of ON public.records(amendment_of) WHERE amendment_of IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prescriptions_workspace_patient ON public.prescriptions(workspace_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_consents_workspace_id ON public.consents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_consents_workspace_patient ON public.consents(workspace_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_workspace_patient ON public.payments(workspace_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_patient ON public.invoices(workspace_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_workspace_id ON public.inventory(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id ON public.audit_logs(workspace_id) WHERE workspace_id IS NOT NULL;

-- 2. TRIGGER DE INMUTABILIDAD PARA HISTORIAS CLÍNICAS (LEY 26.529)
CREATE OR REPLACE FUNCTION public.prevent_record_modifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RAISE EXCEPTION 'Las historias clínicas son inmutables. Para modificaciones debe registrarse una enmienda.';
END;
$$;

CREATE OR REPLACE TRIGGER trg_records_no_update BEFORE UPDATE ON public.records
FOR EACH ROW EXECUTE FUNCTION public.prevent_record_modifications();

CREATE OR REPLACE TRIGGER trg_records_no_delete BEFORE DELETE ON public.records
FOR EACH ROW EXECUTE FUNCTION public.prevent_record_modifications();

-- 3. FUNCIONES AUXILIARES PARA MULTI-TENANCY CON SEARCH_PATH SEGURO
CREATE OR REPLACE FUNCTION public.current_workspace_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
    SELECT coalesce(
        current_setting('request.jwt.claim.workspace_id', true),
        (current_setting('request.jwt.claims', true)::jsonb ->> 'workspace_id')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
    SELECT coalesce(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'SUPER_ADMIN',
        false
    );
$$;

-- 4. POLÍTICAS RLS AISLADAS POR WORKSPACE (OPTIMIZADAS CON SELECT SUBQUERY)
CREATE POLICY tenant_isolation_workspaces ON public.workspaces
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_users ON public.users
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_sessions ON public.sessions
    FOR ALL
    USING (
        user_id IN (SELECT id FROM public.users WHERE workspace_id = (SELECT public.current_workspace_id()))
        OR (SELECT public.is_super_admin())
    )
    WITH CHECK (
        user_id IN (SELECT id FROM public.users WHERE workspace_id = (SELECT public.current_workspace_id()))
        OR (SELECT public.is_super_admin())
    );

CREATE POLICY tenant_isolation_settings ON public.settings
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_integrations ON public.integrations
    FOR ALL
    USING ((SELECT public.is_super_admin()) OR (SELECT public.current_workspace_id()) IS NOT NULL)
    WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_doctors ON public.doctors
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_patients ON public.patients
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_appointments ON public.appointments
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_leads ON public.leads
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_records ON public.records
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_prescriptions ON public.prescriptions
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_consents ON public.consents
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_payments ON public.payments
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_invoices ON public.invoices
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_inventory ON public.inventory
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));

CREATE POLICY tenant_isolation_audit_logs ON public.audit_logs
    FOR ALL
    USING ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.current_workspace_id()) = workspace_id OR (SELECT public.is_super_admin()));
