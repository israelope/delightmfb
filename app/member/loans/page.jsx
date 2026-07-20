import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoanPortal from '@/components/features/LoanPortal';

export default async function MemberLoansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Loans</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Check your borrowing limit, request a loan, and track repayment.
      </p>
      <div className="mt-6">
        <LoanPortal userId={user.id} />
      </div>
    </div>
  );
}