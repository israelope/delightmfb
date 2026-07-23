import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardStats from '@/components/features/DashboardStats';
import QuickActions from '@/components/features/QuickActions';
import SavingsGrowthChart from '@/components/features/SavingsGrowthChart';
import FundAllocationChart from '@/components/features/FundAllocationChart';
import LoanProgressCard from '@/components/features/LoanProgressCard';
import RecentTransactions from '@/components/features/RecentTransactions';

export default async function MemberDashboardPage() {
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

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Welcome back, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Member ID: <span className="font-mono">{profile?.cooperative_id}</span> · Status:{' '}
            <span className="font-medium text-cooperative">
              {profile?.status?.charAt(0).toUpperCase() + profile?.status?.slice(1)}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <DashboardStats userId={user.id} />
      </div>

      <div className="mt-8">
        <p className="mb-3 font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
          Quick Actions
        </p>
        <QuickActions />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-sm border border-rule bg-parchment-soft p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-ink">Savings Growth</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Cumulative savings over the last 6 months.
          </p>
          <div className="mt-4">
            <SavingsGrowthChart userId={user.id} />
          </div>
        </div>

        <div className="rounded-sm border border-rule bg-parchment-soft p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Fund Allocation</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">Your financial distribution.</p>
          <div className="mt-4">
            <FundAllocationChart userId={user.id} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LoanProgressCard userId={user.id} />
        <RecentTransactions userId={user.id} />
      </div>
    </div>
  );
}
