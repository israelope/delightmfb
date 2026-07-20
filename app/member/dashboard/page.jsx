import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/features/SignOutButton';

export default async function MemberDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, cooperative_id')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-parchment px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-cooperative">
              {profile?.cooperative_id}
            </p>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Welcome, {profile?.full_name}
            </h1>
          </div>
          <SignOutButton />
        </div>
        <p className="mt-8 font-body text-sm text-ink-muted">
          Your digital passbook (contribution ledger and loan eligibility) builds out in
          Milestone 3.
        </p>
      </div>
    </div>
  );
}
