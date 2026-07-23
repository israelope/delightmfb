import { Users, PiggyBank, HandCoins, ClipboardList, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatNaira } from '@/lib/utils';

function startOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function AdminStatCards() {
  const supabase = await createClient();

  const [
    { count: totalMembers },
    { count: newMembersThisMonth },
    { data: contributions },
    { data: outstandingLoans },
    { count: pendingLoans },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'member')
      .eq('status', 'active'),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'member')
      .eq('status', 'active')
      .gte('created_at', startOfMonthISO()),
    supabase.from('contributions').select('amount'),
    supabase.from('loan_balances').select('amount_outstanding').eq('status', 'disbursed'),
    supabase
      .from('loans')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'requested'),
  ]);

  const totalSavings = (contributions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
  const loansOutstanding = (outstandingLoans ?? []).reduce(
    (sum, l) => sum + Number(l.amount_outstanding),
    0
  );

  const cards = [
    {
      label: 'Total Members',
      value: String(totalMembers ?? 0),
      hint: `+${newMembersThisMonth ?? 0} this month`,
      icon: Users,
    },
    {
      label: 'Total Savings',
      value: formatNaira(totalSavings),
      hint: 'Active pool',
      icon: PiggyBank,
    },
    {
      label: 'Loans Outstanding',
      value: formatNaira(loansOutstanding),
      hint: `${(outstandingLoans ?? []).length} active loan${
        (outstandingLoans ?? []).length === 1 ? '' : 's'
      }`,
      icon: HandCoins,
    },
    {
      label: 'Pending Requests',
      value: String(pendingLoans ?? 0),
      hint: 'Awaiting review',
      icon: ClipboardList,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon }) => (
        <div key={label} className="rounded-sm border border-rule bg-parchment-soft p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cooperative/10">
              <Icon className="h-4 w-4 text-cooperative" strokeWidth={1.75} />
            </div>
            <TrendingUp className="h-4 w-4 text-cooperative" strokeWidth={1.75} />
          </div>
          <p className="mt-3 font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
            {label}
          </p>
          <p className="tabular mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
          <p className="mt-1 font-body text-xs text-ink-muted">{hint}</p>
        </div>
      ))}
    </div>
  );
}
