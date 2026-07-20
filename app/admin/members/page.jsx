import InviteCodeGenerator from '@/components/features/InviteCodeGenerator';
import MemberManagement from '@/components/features/MemberManagement';

export default function AdminMembersPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Members</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Generate invite codes and manage member accounts.
      </p>
      <div className="mt-6">
        <InviteCodeGenerator />
      </div>
      <MemberManagement />
    </div>
  );
}