import { Landmark, HandCoins, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatNaira } from '@/lib/utils';

export default async function OverviewStats() {
  const supabase = await createClient();

  const [{ data: contributions }, { data: loans }, { count: activeMemberCount }] =
    await Promise.all([
      supabase.from('contributions').select('amount'),
      supabase.from('loans').select('principal, status'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'member')
        .eq('status', 'active'),
    ]);

  const totalContributions = (contributions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);

  const activeLoans = (loans ?? []).filter((l) => l.status === 'disbursed');
  const totalActiveLoans = activeLoans.reduce((sum, l) => sum + Number(l.principal), 0);

  const liquidity = totalContributions - totalActiveLoans;

  // Expected influx assumes members contribute roughly their historical
  // average each month — a reasonable placeholder until Milestone 3 gives
  // us real monthly patterns to work from.
  const avgContribution =
    contributions && contributions.length > 0 ? totalContributions / contributions.length : 0;
  const expectedInflux = avgContribution * (activeMemberCount ?? 0);

  const cards = [
    {
      label: 'Total Cooperative Liquidity',
      value: formatNaira(liquidity),
      hint: 'Contributions minus active loans',
      icon: Landmark,
    },
    {
      label: 'Total Active Loans',
      value: formatNaira(totalActiveLoans),
      hint: `${activeLoans.length} loan${activeLoans.length === 1 ? '' : 's'} disbursed, not yet cleared`,
      icon: HandCoins,
    },
    {
      label: 'Expected Monthly Influx',
      value: formatNaira(expectedInflux),
      hint: `Based on ${activeMemberCount ?? 0} active member${activeMemberCount === 1 ? '' : 's'}`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(({ label, value, hint, icon: Icon }) => (
        <div key={label} className="rounded-sm border border-rule bg-parchment-soft p-5">
          <div className="flex items-center justify-between">
            <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
              {label}
            </p>
            <Icon className="h-4 w-4 text-cooperative" strokeWidth={1.75} />
          </div>
          <p className="tabular mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
          <p className="mt-1 font-body text-xs text-ink-muted">{hint}</p>
        </div>
      ))}
    </div>
  );
}