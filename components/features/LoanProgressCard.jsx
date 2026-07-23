import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatNaira, formatDate } from '@/lib/utils';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';

export default async function LoanProgressCard({ userId }) {
  const supabase = await createClient();

  const { data: loan } = await supabase
    .from('loans')
    .select('principal, status, due_date, disbursed_at')
    .eq('user_id', userId)
    .eq('status', 'disbursed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!loan) {
    return (
      <div className="rounded-sm border border-rule bg-parchment-soft p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Loan repayment</h2>
        <p className="mt-3 font-body text-sm text-ink-muted">
          No active loan right now.{' '}
          <Link href="/member/loans" className="font-medium text-cooperative hover:underline">
            Request one
          </Link>{' '}
          if you're eligible.
        </p>
      </div>
    );
  }

  let percentElapsed = 0;
  if (loan.disbursed_at && loan.due_date) {
    const start = new Date(loan.disbursed_at).getTime();
    const end = new Date(loan.due_date).getTime();
    const now = Date.now();
    percentElapsed = end > start ? Math.round(((now - start) / (end - start)) * 100) : 0;
    percentElapsed = Math.min(100, Math.max(0, percentElapsed));
  }

  const isOverdue = loan.due_date && new Date(loan.due_date) < new Date();

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Loan repayment</h2>
        <Badge variant={isOverdue ? 'suspended' : 'available'}>
          {isOverdue ? 'overdue' : 'disbursed'}
        </Badge>
      </div>

      <p className="tabular mt-3 font-display text-2xl font-semibold text-ink">
        {formatNaira(loan.principal)}
      </p>
      <p className="mt-1 font-body text-xs text-ink-muted">
        Due {formatDate(loan.due_date)} — based on time elapsed since disbursement, not amount
        repaid.
      </p>

      <ProgressBar value={percentElapsed} className="mt-4" />
      <p className="mt-1.5 font-mono text-xs text-ink-muted">{percentElapsed}% of loan term elapsed</p>
    </div>
  );
}
