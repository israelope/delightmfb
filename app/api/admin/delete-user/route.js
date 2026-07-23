import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';

export async function POST(request) {
  // Step 1: confirm the caller is a signed-in, active admin — using the
  // normal cookie-based server client, which respects RLS/session state.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'admin' || callerProfile?.status !== 'active') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId.' }, { status: 400 });
  }
  if (userId === user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }

  // Step 2: only now switch to the service-role client, which bypasses
  // RLS and can reach the auth.users table directly.
  const serviceClient = createServiceRoleClient();

  const { data: targetProfile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (targetProfile?.role === 'admin') {
    const { count } = await serviceClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('status', 'active');

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last remaining admin.' },
        { status: 400 }
      );
    }
  }

  // Deleting the auth user cascades (via "on delete cascade" foreign
  // keys) through profiles → contributions / loans → loan_repayments,
  // so this one call cleans up everything tied to the account.
  const { error } = await serviceClient.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
