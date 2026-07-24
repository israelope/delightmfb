import InviteCodeGenerator from '@/components/features/InviteCodeGenerator';

export default function AdminInviteCodesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Invite Codes</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Generate codes for prospective members, and clear out old used ones.
      </p>
      <div className="mt-6">
        <InviteCodeGenerator />
      </div>
    </div>
  );
}