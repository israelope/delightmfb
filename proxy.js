import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Viewable by anyone, logged in or not — never redirected away.
const OPEN_PATHS = ['/', '/about', '/products'];

// Only for signed-out visitors — a logged-in user gets bounced to their
// dashboard instead of seeing these.
const GUEST_ONLY_PATHS = ['/login', '/register', '/forgot-password'];

export async function proxy(request) {
  const path = request.nextUrl.pathname;

  // Auth route handlers (password-reset token exchange) and API routes
  // manage their own security — they must be reachable without an
  // existing session, and shouldn't get HTML redirects injected into
  // what should be a JSON response.
  if (path.startsWith('/auth/') || path.startsWith('/api/')) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOpen = OPEN_PATHS.includes(path);
  const isGuestOnly = GUEST_ONLY_PATHS.includes(path);

  // Not signed in: open pages and guest-only pages are both fine.
  // Anything else requires a session.
  if (!user) {
    if (!isOpen && !isGuestOnly) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Signed in — look up their approval status and role.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  const destination = (profile) => {
    if (!profile || profile.status === 'pending') return '/pending';
    if (profile.status === 'suspended') return '/pending';
    return profile.role === 'admin' ? '/admin/dashboard' : '/member/dashboard';
  };

  // Signed-in users shouldn't see login/register/forgot-password again —
  // but open pages like /, /about, /products stay visible to everyone.
  if (isGuestOnly) {
    const url = request.nextUrl.clone();
    url.pathname = destination(profile);
    return NextResponse.redirect(url);
  }
  if (isOpen) {
    return response;
  }

  if (profile?.status === 'active') {
    // Active members shouldn't be stuck on the waiting room.
    if (path === '/pending') {
      const url = request.nextUrl.clone();
      url.pathname = destination(profile);
      return NextResponse.redirect(url);
    }
    // Keep members and admins in their own areas.
    if (path.startsWith('/admin') && profile.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/member/dashboard';
      return NextResponse.redirect(url);
    }
    if (path.startsWith('/member') && profile.role !== 'member') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  } else if (path.startsWith('/admin') || path.startsWith('/member')) {
    // Pending or suspended accounts cannot reach dashboards at all.
    const url = request.nextUrl.clone();
    url.pathname = '/pending';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
