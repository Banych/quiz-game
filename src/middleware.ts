import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAdminUser } from '@/infrastructure/auth/supabase-auth-client';

/**
 * Middleware to protect admin routes with Supabase Auth.
 * Checks for valid session and verifies user is in admin allowlist.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[MIDDLEWARE] Processing request for:', pathname);

  // Only protect /admin routes (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/login') {
    let supabaseResponse = NextResponse.next({
      request,
    });

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      });

      // IMPORTANT: Use getUser() which reads from JWT, not getSession()
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log('[MIDDLEWARE] User:', user?.email || 'none');

      // Redirect to login if no session
      if (!user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Verify user is in admin allowlist
      if (!isAdminUser(user.email)) {
        console.log('[MIDDLEWARE] User not in admin allowlist');
        // Return 403 Forbidden for authenticated but unauthorized users
        return new NextResponse('Forbidden: Admin access required', {
          status: 403,
        });
      }

      console.log('[MIDDLEWARE] User authorized');
      return supabaseResponse;
    } catch (error) {
      console.error('[MIDDLEWARE] Auth error:', error);
      // On error, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all admin routes including /admin itself
     */
    '/admin',
    '/admin/:path*',
  ],
};
