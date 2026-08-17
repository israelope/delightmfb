'use client';

import { useEffect, useState } from 'react';
import { HandCoins, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import FormattedNumberInput from '@/components/ui/FormattedNumberInput';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import LoanEligibilityStatus from '@/components/features/LoanEligibilityStatus';
import LoanDocumentUpload from '@/components/features/LoanDocumentUpload';

const ELIGIBILITY_MULTIPLIER = 2;
const TOPUP_THRESHOLD = 0.75;
const LOAN_BADGE_VARIANT = {
  requested: 'pending',
  approved: 'pending',
  disbursed: 'available',
  cleared: 'used',
  rejected: 'suspended',
};

export default function LoanPortal({ userId }) {
  const [totalSaved, setTotalSaved] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [loans, setLoans] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isMonthsEligible, setIsMonthsEligible] = useState(null);
  const [hasDocument, setHasDocument] = useState(null);

  async function loadData() {
    setLoading(true);
    setError('');
    const supabase = createClient();

    const [
      { data: contributions, error: contribError },
      { data: loanData, error: loanError },
      { data: settings },
    ] = await Promise.all([
      supabase.from('contributions').select('amount').eq('user_id', userId),
      supabase
        .from('loan_balances')
        .select('*')
        .eq('user_id', userId)
        .order('loan_id', { ascending: false }),
      supabase.from('cooperative_settings').select('default_interest_rate').eq('id', 1).single(),
    ]);

    if (contribError || loanError) {
      setError((contribError ?? loanError).message);
      setLoading(false);
      return;
    }

    setTotalSaved((contributions ?? []).reduce((sum, c) => sum + Number(c.amount), 0));
    setLoans(loanData ?? []);
    setInterestRate(settings?.default_interest_rate ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const pendingLoan = loans.find((l) => ['requested', 'approved'].includes(l.status));
  const disbursedLoans = loans.filter((l) => l.status === 'disbursed');

  const combinedDisbursed = disbursedLoans.reduce(
    (acc, l) => ({
      principal: acc.principal + Number(l.principal),
      totalRepayable: acc.totalRepayable + Number(l.total_repayable ?? 0),
      repaid: acc.repaid + Number(l.amount_repaid ?? 0),
    }),
    { principal: 0, totalRepayable: 0, repaid: 0 }
  );
  const disbursedPct =
    combinedDisbursed.totalRepayable > 0
      ? combinedDisbursed.repaid / combinedDisbursed.totalRepayable
      : 1; // no disbursed loan at all = nothing blocking a top-up

  const needsTopUpProgress = disbursedLoans.length > 0 && disbursedPct < TOPUP_THRESHOLD;
  const canRequestNew = !pendingLoan && !needsTopUpProgress;

  // Outstanding balance (includes interest, subtracts repayments)
  // from disbursed loans counts against the limit.
  const outstandingBalance = disbursedLoans.reduce(
    (sum, l) => sum + Number(l.amount_outstanding ?? 0),
    0
  );
  const limit = Math.max(0, (totalSaved - outstandingBalance) * ELIGIBILITY_MULTIPLIER);

  const requestedAmount = Number(amount);
  const isValidAmount = requestedAmount > 0 && requestedAmount <= limit;
  const previewTotal = requestedAmount > 0 ? requestedAmount * (1 + interestRate / 100) : 0;

  async function handleRequest(e) {
    e.preventDefault();
    if (!isValidAmount || !canRequestNew) return;

    setSubmitting(true);
    setError('');
    setSuccess(false);
    const supabase = createClient();

    const { error: insertError } = await supabase.from('loans').insert({
      user_id: userId,
      principal: requestedAmount,
      status: 'requested',
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setAmount('');
    setSuccess(true);
    await loadData();
  }

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Loans</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Borrow up to {ELIGIBILITY_MULTIPLIER}x your available balance.
          </p>
        </div>
        <HandCoins className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
      </div>

      {loading ? (
        <p className="mt-6 font-body text-sm text-ink-muted">Loading…</p>
      ) : (
        <>
          {disbursedLoans.length > 1 && (
            <div className="mt-5 rounded-sm border border-brass/30 bg-brass/10 px-4 py-3">
              <p className="font-body text-sm text-ink">
                You currently have {disbursedLoans.length} active loans totaling{' '}
                <span className="font-medium">{formatNaira(combinedDisbursed.totalRepayable)}</span>,
                with {formatNaira(combinedDisbursed.repaid)} repaid so far.
              </p>
            </div>
          )}

          <div className="mt-5 rounded-sm border border-rule bg-parchment px-4 py-3">
            <p className="font-body text-xs uppercase tracking-wider text-ink-muted">
              Your remaining borrowing limit
            </p>
            <p className="tabular mt-1 font-display text-xl font-semibold text-cooperative">
              {formatNaira(Math.max(0, limit))}
            </p>
            <p className="mt-1 font-body text-xs text-ink-muted">
              Based on {formatNaira(totalSaved)} in total contributions
              {outstandingBalance > 0 && <> minus {formatNaira(outstandingBalance)} outstanding loan balance</>}.
              Current interest rate: {interestRate}%.
            </p>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-4 rounded-sm bg-cooperative/10 px-3 py-2 font-body text-sm text-cooperative-dark">
              Loan request submitted — an admin will review it shortly.
            </p>
          )}

          {pendingLoan ? (
            <p className="mt-4 font-body text-sm text-ink-muted">
              You have a loan request awaiting admin action. You can request another once
              that's resolved.
            </p>
          ) : needsTopUpProgress ? (
            <div className="mt-4">
              <p className="font-body text-sm text-ink-muted">
                Repay at least 75% of your current loan before requesting a top-up — you're at{' '}
                {Math.round(disbursedPct * 100)}% now.
              </p>
              <ProgressBar value={disbursedPct * 100} className="mt-2" />
            </div>
          ) : limit <= 0 ? (
            <p className="mt-4 font-body text-sm text-ink-muted">
              Log more contributions to unlock further loan eligibility.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              <LoanEligibilityStatus userId={userId} onChange={(e) => setIsMonthsEligible(e?.is_eligible ?? false)} />
              <LoanDocumentUpload userId={userId} onChange={setHasDocument} />

              {isMonthsEligible && hasDocument ? (
                <form onSubmit={handleRequest} className="flex flex-wrap items-end gap-3 pt-1">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Amount to request
                    </span>
                    <FormattedNumberInput
                      min="1"
                      max={limit}
                      step="0.01"
                      placeholder="₦0.00"
                      value={amount}
                      onChange={setAmount}
                      className="w-44 rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                    />
                  </label>
                  <Button type="submit" variant="primary" loading={submitting} disabled={!isValidAmount}>
                    <Send className="h-4 w-4" strokeWidth={2.25} />
                    {disbursedLoans.length > 0 ? 'Request top-up' : 'Request loan'}
                  </Button>
                  {requestedAmount > 0 && (
                    <p className="w-full font-body text-xs text-ink-muted">
                      With a {interestRate}% interest rate, you'd repay a total of{' '}
                      <span className="font-medium text-ink">{formatNaira(previewTotal)}</span>.
                    </p>
                  )}
                </form>
              ) : (
                isMonthsEligible !== null &&
                hasDocument !== null && (
                  <p className="font-body text-xs text-ink-muted">
                    Meet both requirements above to unlock the request form.
                  </p>
                )
              )}
            </div>
          )}

          {loans.length > 0 && (
            <div className="mt-6 border-t border-rule pt-5">
              <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                Loan history
              </p>
              <ul className="mt-3 space-y-3">
                {loans.map((l) => {
                  const pct =
                    l.total_repayable > 0
                      ? Math.min(100, Math.round((l.amount_repaid / l.total_repayable) * 100))
                      : 0;
                  return (
                    <li key={l.loan_id} className="rounded-sm border border-rule bg-parchment px-3.5 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="tabular font-mono text-sm text-ink">
                            {formatNaira(l.principal)}
                            {l.interest_rate > 0 && (
                              <span className="ml-1.5 font-body text-xs text-ink-muted">
                                + {l.interest_rate}% interest
                              </span>
                            )}
                          </p>
                          {l.total_repayable && (
                            <p className="font-body text-xs text-ink-muted">
                              Total repayable: {formatNaira(l.total_repayable)}
                              {l.due_date && ` · Due ${new Date(l.due_date).toLocaleDateString('en-NG')}`}
                            </p>
                          )}
                          <p className="mt-1 font-mono text-[11px] text-ink-muted">
                            Requested {new Date(l.created_at).toLocaleDateString('en-NG')}
                            {l.disbursed_at && (
                              <> · Disbursed {new Date(l.disbursed_at).toLocaleDateString('en-NG')}</>
                            )}
                            {(l.status === 'cleared' || l.status === 'rejected') && (
                              <>
                                {' '}
                                · {l.status === 'cleared' ? 'Cleared' : 'Rejected'}{' '}
                                {new Date(l.updated_at).toLocaleDateString('en-NG')}
                              </>
                            )}
                          </p>
                        </div>
                        <Badge variant={LOAN_BADGE_VARIANT[l.status]}>{l.status}</Badge>
                      </div>

                      {l.status === 'disbursed' && (
                        <div className="mt-3">
                          <ProgressBar value={pct} />
                          <p className="mt-1.5 font-mono text-xs text-ink-muted">
                            {formatNaira(l.amount_repaid)} repaid of {formatNaira(l.total_repayable)} ({pct}%)
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}