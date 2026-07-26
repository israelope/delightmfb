import MemberManagement from '@/components/features/MemberManagement';

export default function AdminMembersPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Members</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Approve pending members and manage existing accounts.
      </p>
      <div className="mt-6">
        <MemberManagement />
      </div>
    </div>
  );
}