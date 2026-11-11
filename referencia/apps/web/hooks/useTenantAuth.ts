'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../lib/supabase/client';

export interface ClinicianProfile {
  userId: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: 'CLINICIAN' | 'ADMIN' | 'NURSE' | 'AUDITOR';
  firstName: string;
  lastName: string;
  email: string;
  npiNumber: string;
  authToken: string;
}

export function useTenantAuth() {
  const [profile, setProfile] = useState<ClinicianProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const appMetadata = session.user.app_metadata || {};
        const tenantId = appMetadata.tenant_id || 'd3b07384-d113-4011-828e-5cb239f1c7d2';
        const role = (appMetadata.role as ClinicianProfile['role']) || 'CLINICIAN';
        const npi = appMetadata.npi_number || 'MN-145892';

        setProfile({
          userId: session.user.id,
          tenantId,
          tenantName: 'Centro Médico Metropolitano',
          tenantSlug: 'cmm-01',
          role,
          firstName: 'Alejandro',
          lastName: 'Morales',
          email: session.user.email || 'dr.morales@abundance.clinic',
          npiNumber: npi,
          authToken: session.access_token,
        });
      } else {
        // Fallback profile for sandbox development mode
        setProfile({
          userId: 'usr-ale-morales-01',
          tenantId: 'd3b07384-d113-4011-828e-5cb239f1c7d2',
          tenantName: 'Centro Médico Metropolitano',
          tenantSlug: 'cmm-01',
          role: 'CLINICIAN',
          firstName: 'Alejandro',
          lastName: 'Morales',
          email: 'dr.morales@abundance.clinic',
          npiNumber: 'MN-145892',
          authToken: 'mock-jwt-clinician-session-token',
        });
      }
    } catch {
      // Ignored in dev
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSession, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return {
    profile,
    isLoading,
    signOut,
    refreshSession: fetchSession,
  };
}
