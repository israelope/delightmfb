'use client';

import { useEffect, useMemo, useState } from 'react';
import { Receipt, Eye, Check, X, Split, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatNaira } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const PAGE_SIZE = 10;

export default function PendingReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [activeLoanByUser, setActiveLoanByUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(null);
  const [splits, setSplits] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  async function loadReceipts() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: receiptData, error: fetchError }, { data: profiles }, { data: loanRows }] =
      await Promise.all([
        supabase
          .from('contribution_receipts')
          .select('id, user_id, month_logged, amount, file_path, status, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, cooperative_id'),
        supabase.from('loan_balances').select('*').eq('status', 'disbursed'),
      ]);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const profileMap = {};
    (profiles ?? []).forEach((p) => {
      profileMap[p.id] = p;
    });
    setProfilesById(profileMap);

    const loanMap = {};
    (loanRows ?? []).forEach((l) => {
      loanMap[l.user_id] = l;
    });
    setActiveLoanByUser(loanMap);

    setReceipts(receiptData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadReceipts();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, statusFilter]);

  async function viewReceipt(filePath) {
    const supabase = createClient();
    const { data: signed, error: signError } = await supabase.storage
      .from('payment-receipts')
      .createSignedUrl(filePath, 60);

    if (signError || !signed) {
      setError('Could not open the receipt.');
      return;
    }
    window.open(signed.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function reject(id) {
    setError('');
    setBusyId(id);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from('contribution_receipts')
      .update({ status: 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    setBusyId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadReceipts();
  }

  function startApply(receipt) {
    const total = Number(receipt.amount ?? 0);
    const hasLoan = !!activeLoanByUser[receipt.user_id];
    const loanRemaining = hasLoan ? Number(activeLoanByUser[receipt.user_id].amount_outstanding) : 0;
    const toLoan = hasLoan ? Math.min(total, loanRemaining) : 0;
    setSplits((prev) => ({ ...prev, [receipt.id]: { toContribution: total - toLoan, toLoan } }));
    setApplying(receipt.id);
  }

  function updateSplit(receiptId, field, value, total) {
    const num = Number(value) || 0;
    setSplits((prev) => {
      const other = field === 'toLoan' ? 'toContribution' : 'toLoan';
      const otherValue = Math.max(0, total - num);
      return { ...prev, [receiptId]: { [field]: num, [other]: otherValue } };
    });
  }

  async function applyPayment(receipt) {
    const split = splits[receipt.id];
    if (!split) return;
    const { toContribution, toLoan } = split;
    const total = Number(receipt.amount ?? 0);

    if (toContribution < 0 || toLoan < 0 || Math.round((toContribution + toLoan) * 100) !== Math.round(total * 100)) {
      setError('The split must add up to the total receipt amount.');
      return;
    }

    setError('');
    setBusyId(receipt.id);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    try {
      if (toContribution > 0) {
        const { error: contribError } = await supabase.from('contributions').insert({
          user_id: receipt.user_id,
          amount: toContribution,
          date: new Date().toISOString().slice(0, 10),
          month_logged: receipt.month_logged,
          logged_by: user?.id,
        });
        if (contribError) throw contribError;
      }

      if (toLoan > 0) {
        const loan = activeLoanByUser[receipt.user_id];
        if (!loan) throw new Error('No active loan found for this member.');
        const { error: repayError } = await supabase.from('loan_repayments').insert({
          loan_id: loan.loan_id,
          amount: toLoan,
          logged_by: user?.id,
        });
        if (repayError) throw repayError;
      }

      const { error: updateError } = await supabase
        .from('contribution_receipts')
        .update({ status: 'processed', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', receipt.id);
      if (updateError) throw updateError;

      setApplying(null);
      await loadReceipts();
    } catch (err) {
      setError(err.message ?? 'Could not apply this payment.');
    } finally {
      setBusyId(null);
    }
  }

  const statusCounts = useMemo(() => {
    const counts = { all: receipts.length, pending: 0, processed: 0, rejected: 0 };
    receipts.forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    });
    return counts;
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return receipts.filter((r) => {
      const profile = profilesById[r.user_id];
      const matchesTerm =
        !term ||
        profile?.full_name?.toLowerCase().includes(term) ||
        profile?.cooperative_id?.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesTerm && matchesStatus;
    });
  }, [receipts, profilesById, search, statusFilter]);

  const visibleReceipts = filteredReceipts.slice(0, visibleCount);

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center gap-2">
        <Receipt className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
        <h2 className="font-display text-lg font-semibold text-ink">
          Payment receipts
          {statusCounts.pending > 0 && <span className="text-brass"> — {statusCounts.pending} pending</span>}
        </h2>
      </div>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Members upload these with the amount they paid. If they also have an active loan, you
        can split the payment between their savings and the loan before it's logged.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'processed', label: 'Processed' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'all', label: 'All' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-full border px-3 py-1.5 font-body text-xs font-medium transition-colors ${
              statusFilter === key
                ? 'border-cooperative bg-cooperative text-parchment-soft'
                : 'border-rule bg-parchment text-ink-muted hover:border-cooperative hover:text-cooperative'
            }`}
          >
            {label} <span className="font-mono">({statusCounts[key] ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder="Search by member name or cooperative ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-sm border border-rule bg-parchment py-2.5 pl-9 pr-3 font-body text-sm text-ink placeholder:text-ink-muted/60 focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 font-body text-sm text-ink-muted">Loading…</p>
      ) : filteredReceipts.length === 0 ? (
        <p className="mt-6 font-body text-sm text-ink-muted">
          {receipts.length === 0 ? 'No receipts uploaded yet.' : 'No receipts match your search.'}
        </p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-rule">
            {visibleReceipts.map((r) => {
              const profile = profilesById[r.user_id];
              const hasLoan = !!activeLoanByUser[r.user_id];
              const split = splits[r.id];

              return (
                <li key={r.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-body text-sm font-medium text-ink">{profile?.full_name}</p>
                      <p className="font-mono text-xs text-ink-muted">
                        {r.month_logged} · uploaded {formatDate(r.created_at)}
                        {r.amount != null && <> · {formatNaira(r.amount)}</>}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          r.status === 'pending' ? 'pending' : r.status === 'processed' ? 'available' : 'suspended'
                        }
                      >
                        {r.status}
                      </Badge>
                      <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => viewReceipt(r.file_path)}>
                        <Eye className="h-3.5 w-3.5" strokeWidth={2.25} />
                        View
                      </Button>
                      {r.status === 'pending' && (
                        <>
                          <Button
                            variant="secondary"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => (applying === r.id ? setApplying(null) : startApply(r))}
                          >
                            <Split className="h-3.5 w-3.5" strokeWidth={2.25} />
                            Apply payment
                          </Button>
                          <Button
                            variant="ghost"
                            className="px-3 py-1.5 text-xs text-brick hover:bg-brick/5"
                            loading={busyId === r.id}
                            onClick={() => reject(r.id)}
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {applying === r.id && split && (
                    <div className="mt-3 rounded-sm border border-rule bg-parchment p-4">
                      <p className="font-body text-xs text-ink-muted">
                        Total received: <span className="font-mono text-ink">{formatNaira(r.amount ?? 0)}</span>
                        {hasLoan && (
                          <>
                            {' '}
                            · Loan balance: {formatNaira(activeLoanByUser[r.user_id].amount_outstanding)}
                          </>
                        )}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4">
                        <label className="flex flex-col gap-1.5">
                          <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                            To savings
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={split.toContribution}
                            onChange={(e) => updateSplit(r.id, 'toContribution', e.target.value, r.amount ?? 0)}
                            className="w-32 rounded-sm border border-rule bg-parchment-soft px-3 py-1.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                            To loan repayment
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={!hasLoan}
                            value={split.toLoan}
                            onChange={(e) => updateSplit(r.id, 'toLoan', e.target.value, r.amount ?? 0)}
                            className="w-32 rounded-sm border border-rule bg-parchment-soft px-3 py-1.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative disabled:opacity-50"
                          />
                        </label>
                      </div>

                      {!hasLoan && (
                        <p className="mt-2 font-body text-xs text-ink-muted">
                          This member has no active loan, so the full amount goes to savings.
                        </p>
                      )}

                      <Button
                        variant="primary"
                        className="mt-4 px-3 py-1.5 text-xs"
                        loading={busyId === r.id}
                        onClick={() => applyPayment(r)}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Confirm & log
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {filteredReceipts.length > visibleCount && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-3 font-body text-xs font-medium text-cooperative hover:underline"
            >
              Show 10 more ({filteredReceipts.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}