import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export interface MultitenantSession {
  userId: string | null;
  tenantId: string | null;
  role: string | null;
  email: string | null;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase.abundance.clinic';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // Fetch current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Extract custom claims injected by our custom_access_token_hook
  const tenantId = (user?.app_metadata?.tenant_id as string) || null;
  const role = (user?.app_metadata?.role as string) || null;

  // 1. Unauthenticated users trying to access protected dashboard routes
  if (!user && (path.startsWith('/dashboard') || path === '/')) {
    // If in dev environment and no live Supabase connection, allow dev bypass or redirect
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Authenticated users with no assigned tenant
  if (user && !tenantId && path.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/unassigned-tenant';
    return NextResponse.redirect(url);
  }

  // 3. Authenticated users trying to access login
  if (user && tenantId && path === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Inject multitenant security headers to downstream server components
  if (tenantId) {
    response.headers.set('x-tenant-id', tenantId);
    if (role) response.headers.set('x-user-role', role);
    if (user?.id) response.headers.set('x-user-id', user.id);
  }

  return response;
}
