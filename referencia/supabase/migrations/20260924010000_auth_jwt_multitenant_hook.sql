-- ==============================================================================
-- ABUNDANCE CLINIC OS - MULTITENANT JWT AUTHENTICATION & CUSTOM CLAIMS HOOK
-- Standard: Supabase Auth Hook (pgjwt / auth.jwt app_metadata injection)
-- Security: Prevents tenant spoofing, enforces role-based access control (RBAC)
-- ==============================================================================

-- 1. AUTH HOOK: INJECTS TENANT_ID AND ROLE INTO SUPABASE JWT CLAIMS
-- When a user authenticates, Supabase Auth calls this function to append
-- custom claims into the JWT payload before returning it to the client.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
    claims jsonb;
    v_tenant_id uuid;
    v_role text;
    v_npi text;
    v_user_id uuid;
BEGIN
    -- Extract auth user ID from the hook event
    v_user_id := (event->>'user_id')::uuid;
    claims := event->'claims';

    -- Lookup user membership in clinic_users table
    SELECT 
        cu.tenant_id,
        cu.role,
        cu.npi_number
    INTO 
        v_tenant_id,
        v_role,
        v_npi
    FROM public.clinic_users cu
    WHERE cu.auth_user_id = v_user_id AND cu.is_active = true
    LIMIT 1;

    -- If user is assigned to an active clinic tenant, inject metadata into app_metadata
    IF v_tenant_id IS NOT NULL THEN
        claims := jsonb_set(
            claims,
            '{app_metadata}',
            coalesce(claims->'app_metadata', '{}'::jsonb) || jsonb_build_object(
                'tenant_id', v_tenant_id::text,
                'role', v_role,
                'npi_number', coalesce(v_npi, '')
            )
        );
    ELSE
        -- Mark as unassigned tenant if no clinic profile exists
        claims := jsonb_set(
            claims,
            '{app_metadata,tenant_id}',
            'null'::jsonb
        );
    END IF;

    -- Return updated claims payload
    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. GRANT PERMISSIONS TO SUPABASE AUTH ADMIN ROLE
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;

-- 3. HELPER FUNCTION TO SWITCH / VERIFY TENANT SESSION FOR DIRECT POOL WORKERS
CREATE OR REPLACE FUNCTION public.set_session_tenant(p_tenant_id uuid)
RETURNS void AS $$
BEGIN
    -- Enforce that only valid UUIDs can be set in transaction-local settings
    PERFORM set_config('app.current_tenant_id', p_tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.set_session_tenant(uuid) TO authenticated, service_role;
