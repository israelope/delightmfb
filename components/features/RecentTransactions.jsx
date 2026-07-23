import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatNaira, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

export default async function RecentTransactions({ userId }) {
  const supabase = await createClient();

  const { data: contributions } = await supabase
    .from('contributions')
    .select('id, amount, date, month_logged')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5);

  const rows = contributions ?? [];

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Recent Transactions</h2>
        <Link
          href="/member/passbook"
          className="font-body text-xs font-medium text-cooperative hover:underline"
        >
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 font-body text-sm text-ink-muted">Nothing logged yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-rule">
          {rows.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cooperative/10">
                  <Wallet className="h-4 w-4 text-cooperative" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-body text-sm text-ink">Monthly Savings Contribution</p>
                  <p className="font-mono text-xs text-ink-muted">{formatDate(c.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="tabular font-mono text-sm text-ink">{formatNaira(c.amount)}</p>
                <Badge variant="available" className="mt-0.5">
                  Completed
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
