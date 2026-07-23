import { TrendingUp, PiggyBank, CreditCard, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatNaira } from '@/lib/utils';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function DashboardStats({ userId }) {
  const supabase = await createClient();

  const [{ data: contributions }, { data: loans }] = await Promise.all([
    supabase.from('contributions').select('amount, month_logged').eq('user_id', userId),
    supabase
      .from('loans')
      .select('principal, status')
      .eq('user_id', userId)
      .in('status', ['approved', 'disbursed']),
  ]);

  const savingsBalance = (contributions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
  const loanBalance = (loans ?? []).reduce((sum, l) => sum + Number(l.principal), 0);
  const totalBalance = savingsBalance - loanBalance;
  const thisMonth = (contributions ?? [])
    .filter((c) => c.month_logged === currentMonth())
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const cards = [
    { label: 'Total Balance', value: totalBalance, icon: TrendingUp, tone: 'text-cooperative' },
    { label: 'Savings Balance', value: savingsBalance, icon: PiggyBank, tone: 'text-cooperative' },
    { label: 'Loan Balance', value: loanBalance, icon: CreditCard, tone: 'text-brick' },
    { label: 'This Month', value: thisMonth, icon: Calendar, tone: 'text-brass' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="rounded-sm border border-rule bg-parchment-soft p-5">
          <div className="flex items-center justify-between">
            <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
              {label}
            </p>
            <Icon className={`h-4 w-4 ${tone}`} strokeWidth={1.75} />
          </div>
          <p className="tabular mt-3 font-display text-2xl font-semibold text-ink">
            {formatNaira(value)}
          </p>
        </div>
      ))}
    </div>
  );
}
