import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PassbookStamp from '@/components/ui/PassbookStamp';
import SignOutButton from '@/components/features/SignOutButton';

export default async function PendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, cooperative_id, status')
    .eq('id', user.id)
    .single();

  const isSuspended = profile?.status === 'suspended';

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto mb-8 h-32 w-32">
          <PassbookStamp label="AWAITING" state="waiting" className="h-32 w-32" />
        </div>

        <h1 className="font-display text-2xl font-semibold text-ink">
          {isSuspended ? 'Your account is suspended' : `Welcome, ${profile?.full_name ?? 'member'}`}
        </h1>

        <p className="mt-3 font-body text-sm leading-relaxed text-ink-muted">
          {isSuspended
            ? 'An admin has paused access to your passbook. Speak with a cooperative officer to resolve this.'
            : "An admin is checking your details against the cooperative's physical records. Your dashboard unlocks the moment you're approved — no further action is needed from you."}
        </p>

        {profile?.cooperative_id && (
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-ink-muted">
            Cooperative ID: <span className="text-ink">{profile.cooperative_id}</span>
          </p>
        )}

        <div className="mt-8">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
