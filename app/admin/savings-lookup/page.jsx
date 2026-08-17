import MemberSavingsLookup from '@/components/features/MemberSavingsLookup';

export default function AdminSavingsLookupPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Savings Lookup</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        View any member&apos;s total savings and transaction history.
      </p>
      <div className="mt-6">
        <MemberSavingsLookup />
      </div>
    </div>
  );
}
