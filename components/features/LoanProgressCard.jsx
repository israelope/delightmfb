import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatNaira, formatDate } from '@/lib/utils';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';

export default async function LoanProgressCard({ userId }) {
  const supabase = await createClient();

  const { data: loan } = await supabase
    .from('loan_balances')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'disbursed')
    .order('loan_id', { ascending: false })
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

  const pct =
    loan.total_repayable > 0
      ? Math.min(100, Math.round((loan.amount_repaid / loan.total_repayable) * 100))
      : 0;
  const isOverdue = loan.due_date && new Date(loan.due_date) < new Date();

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Loan repayment</h2>
        <Badge variant={isOverdue ? 'suspended' : 'available'}>
          {isOverdue ? 'overdue' : 'on track'}
        </Badge>
      </div>

      <p className="tabular mt-3 font-display text-2xl font-semibold text-ink">
        {formatNaira(loan.total_repayable)}
      </p>
      <p className="mt-1 font-body text-xs text-ink-muted">
        {formatNaira(loan.principal)} borrowed at {loan.interest_rate}% interest · Due{' '}
        {formatDate(loan.due_date)}
      </p>

      <ProgressBar value={pct} className="mt-4" />
      <p className="mt-1.5 font-mono text-xs text-ink-muted">
        {formatNaira(loan.amount_repaid)} repaid of {formatNaira(loan.total_repayable)} ({pct}%)
      </p>
    </div>
  );
}
