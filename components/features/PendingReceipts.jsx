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
  const [goalsByUser, setGoalsByUser] = useState({}); // user_id -> [goal rows with productName]
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(null);
  const [splits, setSplits] = useState({}); // receipt id -> { savings, loan, goals: { goalId: amount } }
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  async function loadReceipts() {
    setLoading(true);
    const supabase = createClient();
    const [
      { data: receiptData, error: fetchError },
      { data: profiles },
      { data: loanRows },
      { data: goalRows },
      { data: types },
    ] = await Promise.all([
      supabase
        .from('contribution_receipts')
        .select('id, user_id, month_logged, amount, file_path, status, created_at, goal_id')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, cooperative_id'),
      supabase.from('loan_balances').select('*').eq('status', 'disbursed'),
      supabase.from('member_product_goals').select('*').eq('status', 'active'),
      supabase.from('product_types').select('id, name'),
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

    const nameById = {};
    (types ?? []).forEach((t) => {
      nameById[t.id] = t.name;
    });
    const goalMap = {};
    (goalRows ?? []).forEach((g) => {
      const withName = { ...g, productName: nameById[g.product_type_id] ?? g.product_type_id };
      if (!goalMap[g.user_id]) goalMap[g.user_id] = [];
      goalMap[g.user_id].push(withName);
    });
    setGoalsByUser(goalMap);

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
    const memberGoals = goalsByUser[receipt.user_id] ?? [];
    const goalAmounts = {};

    let remaining = total;

    // If this receipt was tagged to a specific goal, default the whole
    // amount there. Otherwise start everything in "savings" and let the
    // admin redistribute.
    if (receipt.goal_id && memberGoals.some((g) => g.id === receipt.goal_id)) {
      goalAmounts[receipt.goal_id] = total;
      remaining = 0;
    }

    setSplits((prev) => ({
      ...prev,
      [receipt.id]: { savings: remaining, loan: 0, goals: goalAmounts },
    }));
    setApplying(receipt.id);
  }

  function recomputeSavings(receiptId, total, loan, goals) {
    const allocated = loan + Object.values(goals).reduce((s, v) => s + (Number(v) || 0), 0);
    return Math.max(0, total - allocated);
  }

  function updateLoanSplit(receiptId, value, total) {
    setSplits((prev) => {
      const current = prev[receiptId];
      const loan = Number(value) || 0;
      const savings = recomputeSavings(receiptId, total, loan, current.goals);
      return { ...prev, [receiptId]: { ...current, loan, savings } };
    });
  }

  function updateGoalSplit(receiptId, goalId, value, total) {
    setSplits((prev) => {
      const current = prev[receiptId];
      const goals = { ...current.goals, [goalId]: Number(value) || 0 };
      const savings = recomputeSavings(receiptId, total, current.loan, goals);
      return { ...prev, [receiptId]: { ...current, goals, savings } };
    });
  }

  function updateSavingsSplit(receiptId, value) {
    setSplits((prev) => ({ ...prev, [receiptId]: { ...prev[receiptId], savings: Number(value) || 0 } }));
  }

  async function applyPayment(receipt) {
    const split = splits[receipt.id];
    if (!split) return;
    const total = Number(receipt.amount ?? 0);
    const goalTotal = Object.values(split.goals).reduce((s, v) => s + (Number(v) || 0), 0);
    const combined = split.savings + split.loan + goalTotal;

    if (Math.round(combined * 100) !== Math.round(total * 100)) {
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
      if (split.savings > 0) {
        const { error: contribError } = await supabase.from('contributions').insert({
          user_id: receipt.user_id,
          amount: split.savings,
          date: new Date().toISOString().slice(0, 10),
          month_logged: receipt.month_logged ?? new Date().toISOString().slice(0, 7),
          logged_by: user?.id,
        });
        if (contribError) throw contribError;
      }

      if (split.loan > 0) {
        const loan = activeLoanByUser[receipt.user_id];
        if (!loan) throw new Error('No active loan found for this member.');
        const { error: repayError } = await supabase.from('loan_repayments').insert({
          loan_id: loan.loan_id,
          amount: split.loan,
          logged_by: user?.id,
        });
        if (repayError) throw repayError;
      }

      for (const [goalId, goalAmount] of Object.entries(split.goals)) {
        if (Number(goalAmount) > 0) {
          const { error: goalError } = await supabase.from('product_goal_contributions').insert({
            goal_id: goalId,
            amount: Number(goalAmount),
            logged_by: user?.id,
          });
          if (goalError) throw goalError;
        }
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
        Members upload these with the amount they paid. Split a payment across savings, a loan,
        and any of their product goals before logging it.
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
              const memberGoals = goalsByUser[r.user_id] ?? [];
              const split = splits[r.id];

              return (
                <li key={r.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-body text-sm font-medium text-ink">{profile?.full_name}</p>
                      <p className="font-mono text-xs text-ink-muted">
                        {r.goal_id ? 'Product goal' : r.month_logged} · uploaded {formatDate(r.created_at)}
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
                            value={split.savings}
                            onChange={(e) => updateSavingsSplit(r.id, e.target.value)}
                            className="w-28 rounded-sm border border-rule bg-parchment-soft px-3 py-1.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                          />
                        </label>

                        {hasLoan && (
                          <label className="flex flex-col gap-1.5">
                            <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                              To loan repayment
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={split.loan}
                              onChange={(e) => updateLoanSplit(r.id, e.target.value, r.amount ?? 0)}
                              className="w-28 rounded-sm border border-rule bg-parchment-soft px-3 py-1.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                            />
                          </label>
                        )}

                        {memberGoals.map((g) => (
                          <label key={g.id} className="flex flex-col gap-1.5">
                            <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                              To {g.productName}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={split.goals[g.id] ?? 0}
                              onChange={(e) => updateGoalSplit(r.id, g.id, e.target.value, r.amount ?? 0)}
                              className="w-28 rounded-sm border border-rule bg-parchment-soft px-3 py-1.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                            />
                          </label>
                        ))}
                      </div>

                      {!hasLoan && memberGoals.length === 0 && (
                        <p className="mt-2 font-body text-xs text-ink-muted">
                          This member has no active loan or product goals, so the full amount
                          goes to savings.
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
