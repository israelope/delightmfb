import OverviewStats from '@/components/features/OverviewStats';

export default function AdminOverviewPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        A snapshot of the cooperative's finances.
      </p>
      <div className="mt-6">
        <OverviewStats />
      </div>
    </div>
  );
}