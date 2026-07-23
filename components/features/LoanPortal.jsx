'use client';

import { useEffect, useState } from 'react';
import { HandCoins, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

const ELIGIBILITY_MULTIPLIER = 2;
const OPEN_STATUSES = ['requested', 'approved', 'disbursed'];
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

  const limit = totalSaved * ELIGIBILITY_MULTIPLIER;
  const hasOpenLoan = loans.some((l) => OPEN_STATUSES.includes(l.status));
  const requestedAmount = Number(amount);
  const isValidAmount = requestedAmount > 0 && requestedAmount <= limit;
  const previewTotal = requestedAmount > 0 ? requestedAmount * (1 + interestRate / 100) : 0;

  async function handleRequest(e) {
    e.preventDefault();
    if (!isValidAmount || hasOpenLoan) return;

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
            Borrow up to {ELIGIBILITY_MULTIPLIER}x your total contributions.
          </p>
        </div>
        <HandCoins className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
      </div>

      {loading ? (
        <p className="mt-6 font-body text-sm text-ink-muted">Loading…</p>
      ) : (
        <>
          <div className="mt-5 rounded-sm border border-rule bg-parchment px-4 py-3">
            <p className="font-body text-xs uppercase tracking-wider text-ink-muted">
              Your borrowing limit
            </p>
            <p className="tabular mt-1 font-display text-xl font-semibold text-cooperative">
              {formatNaira(limit)}
            </p>
            <p className="mt-1 font-body text-xs text-ink-muted">
              Based on {formatNaira(totalSaved)} in total contributions. Current interest rate:{' '}
              {interestRate}%.
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

          {hasOpenLoan ? (
            <p className="mt-4 font-body text-sm text-ink-muted">
              You already have an open loan. You can request a new one once it's cleared.
            </p>
          ) : limit === 0 ? (
            <p className="mt-4 font-body text-sm text-ink-muted">
              Log at least one contribution to unlock loan eligibility.
            </p>
          ) : (
            <form onSubmit={handleRequest} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Amount to request
                </span>
                <input
                  type="number"
                  min="1"
                  max={limit}
                  step="0.01"
                  placeholder="₦0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-44 rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                />
              </label>
              <Button type="submit" variant="primary" loading={submitting} disabled={!isValidAmount}>
                <Send className="h-4 w-4" strokeWidth={2.25} />
                Request loan
              </Button>
              {requestedAmount > 0 && (
                <p className="w-full font-body text-xs text-ink-muted">
                  With a {interestRate}% interest rate, you'd repay a total of{' '}
                  <span className="font-medium text-ink">{formatNaira(previewTotal)}</span>.
                </p>
              )}
            </form>
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
