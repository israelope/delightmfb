import InterestRateSettings from '@/components/features/InterestRateSettings';
import LoanFormSettings from '@/components/features/LoanFormSettings';
import DirectLoanCreator from '@/components/features/DirectLoanCreator';
import LoanQueue from '@/components/features/LoanQueue';

export default function AdminLoansPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Loans</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Review requests, disburse funds, and log repayments as they come in.
      </p>
      <div className="mt-6 space-y-6">
        <InterestRateSettings />
        <LoanFormSettings />
        <DirectLoanCreator />
        <LoanQueue />
      </div>
    </div>
  );
}
