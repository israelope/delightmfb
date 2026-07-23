import BatchContributionLogger from '@/components/features/BatchContributionLogger';
import MemberContributionEditor from '@/components/features/MemberContributionEditor';

export default function AdminContributionsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Contributions</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Log monthly savings for active members.
      </p>
      <div className="mb-6">
        <MemberContributionEditor />
      </div>
      <BatchContributionLogger />
    </div>
  );
}