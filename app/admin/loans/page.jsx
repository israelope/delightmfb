import LoanQueue from '@/components/features/LoanQueue';

export default function AdminLoansPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Loans</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Review requests, disburse funds, and track repayment.
      </p>
      <div className="mt-6">
        <LoanQueue />
      </div>
    </div>
  );
}