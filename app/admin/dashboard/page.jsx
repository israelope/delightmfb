import AdminStatCards from '@/components/features/AdminStatCards';
import CollectionsChart from '@/components/features/CollectionsChart';
import AdminFundAllocationChart from '@/components/features/AdminFundAllocationChart';
import LoanStatusChart from '@/components/features/LoanStatusChart';
import PendingActionsCards from '@/components/features/PendingActionsCards';

export default function AdminOverviewPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        A snapshot of the cooperative's finances.
      </p>

      <div className="mt-6">
        <AdminStatCards />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-sm border border-rule bg-parchment-soft p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-ink">Monthly Collections</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Savings, loan repayments, and loans disbursed — last 6 months.
          </p>
          <div className="mt-4">
            <CollectionsChart />
          </div>
        </div>

        <div className="rounded-sm border border-rule bg-parchment-soft p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Fund Allocation</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Total cooperative fund distribution.
          </p>
          <div className="mt-4">
            <AdminFundAllocationChart />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-rule bg-parchment-soft p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Loan Status Breakdown</h2>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Every loan ever requested, by current status.
        </p>
        <div className="mt-4">
          <LoanStatusChart />
        </div>
      </div>

      <div className="mt-6">
        <PendingActionsCards />
      </div>
    </div>
  );
}
