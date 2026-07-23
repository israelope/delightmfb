import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Passbook from '@/components/features/Passbook';

export default async function MemberPassbookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Savings</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Your wallet balance and full contribution history.
      </p>
      <div className="mt-6">
        <Passbook userId={user.id} />
      </div>
    </div>
  );
}
