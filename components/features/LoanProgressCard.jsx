import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatNaira, formatDate } from '@/lib/utils';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';

export default async function LoanProgressCard({ userId }) {
  const supabase = await createClient();

  const { data: loans } = await supabase
    .from('loan_balances')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'disbursed');

  if (!loans || loans.length === 0) {
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

  const totals = loans.reduce(
    (acc, l) => ({
      principal: acc.principal + Number(l.principal),
      totalRepayable: acc.totalRepayable + Number(l.total_repayable ?? 0),
      repaid: acc.repaid + Number(l.amount_repaid ?? 0),
    }),
    { principal: 0, totalRepayable: 0, repaid: 0 }
  );

  const pct = totals.totalRepayable > 0 ? Math.min(100, Math.round((totals.repaid / totals.totalRepayable) * 100)) : 0;

  const nearestDueDate = loans
    .map((l) => l.due_date)
    .filter(Boolean)
    .sort()[0];
  const isOverdue = nearestDueDate && new Date(nearestDueDate) < new Date();

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">
          Loan repayment{loans.length > 1 && <span className="text-brass"> ({loans.length} loans)</span>}
        </h2>
        <Badge variant={isOverdue ? 'suspended' : 'available'}>
          {isOverdue ? 'overdue' : 'on track'}
        </Badge>
      </div>

      <p className="tabular mt-3 font-display text-2xl font-semibold text-ink">
        {formatNaira(totals.totalRepayable)}
      </p>
      <p className="mt-1 font-body text-xs text-ink-muted">
        {formatNaira(totals.principal)} borrowed
        {nearestDueDate && <> · Next due {formatDate(nearestDueDate)}</>}
      </p>

      <ProgressBar value={pct} className="mt-4" />
      <p className="mt-1.5 font-mono text-xs text-ink-muted">
        {formatNaira(totals.repaid)} repaid of {formatNaira(totals.totalRepayable)} ({pct}%)
      </p>
    </div>
  );
}