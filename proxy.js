import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register'];

export async function proxy(request) {
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

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.includes(path);

  // Not signed in: block anything that isn't public.
  if (!user) {
    if (!isPublic) {
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

  // Signed-in users shouldn't see the login/register pages again.
  if (isPublic && path !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = destination(profile);
    return NextResponse.redirect(url);
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
