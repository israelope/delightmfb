import BatchContributionLogger from '@/components/features/BatchContributionLogger';

export default function AdminContributionsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Contributions</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Log monthly savings for active members.
      </p>
      <div className="mt-6">
        <BatchContributionLogger />
      </div>
    </div>
  );
}