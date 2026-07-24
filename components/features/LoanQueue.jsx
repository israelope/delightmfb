'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  X,
  HandCoins,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

const STATUS_ORDER = { requested: 0, approved: 1, disbursed: 2, cleared: 3, rejected: 4 };
const BADGE_VARIANT = {
  requested: 'pending',
  approved: 'pending',
  disbursed: 'available',
  cleared: 'used',
  rejected: 'suspended',
};

function defaultDueDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

export default function LoanQueue() {
  const [loans, setLoans] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [repayments, setRepayments] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [dueDates, setDueDates] = useState({});
  const [rates, setRates] = useState({});
  const [repayAmounts, setRepayAmounts] = useState({});
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  async function loadLoans() {
    setLoading(true);
    setError('');
    const supabase = createClient();

    const [{ data: balances, error: fetchError }, { data: profiles }] = await Promise.all([
      supabase.from('loan_balances').select('*'),
      supabase.from('profiles').select('id, full_name, cooperative_id'),
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

    const sorted = [...(balances ?? [])].sort(
      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    );
    setLoans(sorted);
    setLoading(false);
  }

  useEffect(() => {
    loadLoans();
  }, []);

  async function updateLoan(id, fields) {
    setError('');
    setBusyId(id);
    const supabase = createClient();
    const { error: updateError } = await supabase.from('loans').update(fields).eq('id', id);
    setBusyId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadLoans();
  }

  async function deleteLoan(loan) {
    const profile = profilesById[loan.user_id];
    const confirmed = window.confirm(
      `Permanently remove this ${loan.status} loan (${formatNaira(loan.principal)}) for ${profile?.full_name}? This also deletes its repayment history and cannot be undone.`
    );
    if (!confirmed) return;

    setBusyId(loan.loan_id);
    setError('');
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('loans').delete().eq('id', loan.loan_id);
    setBusyId(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadLoans();
  }

  async function loadRepayments(loanId) {
    const supabase = createClient();
    const { data } = await supabase
      .from('loan_repayments')
      .select('id, amount, date, created_at')
      .eq('loan_id', loanId)
      .order('date', { ascending: false });
    setRepayments((prev) => ({ ...prev, [loanId]: data ?? [] }));
  }

  async function toggleExpand(loanId) {
    if (expanded === loanId) {
      setExpanded(null);
      return;
    }
    setExpanded(loanId);
    if (!repayments[loanId]) await loadRepayments(loanId);
  }

  async function logRepayment(loan) {
    const amount = Number(repayAmounts[loan.loan_id]);
    if (!amount || amount <= 0) {
      setError('Enter a valid repayment amount.');
      return;
    }
    setBusyId(loan.loan_id);
    setError('');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from('loan_repayments').insert({
      loan_id: loan.loan_id,
      amount,
      logged_by: user?.id,
    });

    setBusyId(null);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setRepayAmounts((prev) => ({ ...prev, [loan.loan_id]: '' }));
    await loadRepayments(loan.loan_id);
    await loadLoans();
  }

  async function deleteRepayment(loanId, repaymentId) {
    const confirmed = window.confirm("Delete this repayment entry? This can't be undone.");
    if (!confirmed) return;
    setBusyId(repaymentId);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from('loan_repayments')
      .delete()
      .eq('id', repaymentId);
    setBusyId(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadRepayments(loanId);
    await loadLoans();
  }

  const statusCounts = useMemo(() => {
    const counts = { all: loans.length, requested: 0, approved: 0, disbursed: 0, cleared: 0, rejected: 0 };
    loans.forEach((l) => {
      counts[l.status] = (counts[l.status] ?? 0) + 1;
    });
    return counts;
  }, [loans]);

  const filteredLoans = useMemo(() => {
    const term = search.trim().toLowerCase();
    return loans.filter((l) => {
      const profile = profilesById[l.user_id];
      const matchesTerm =
        !term ||
        profile?.full_name?.toLowerCase().includes(term) ||
        profile?.cooperative_id?.toLowerCase().includes(term);

      const matchesDate =
        !dateFilter ||
        [l.created_at, l.disbursed_at, l.updated_at].some(
          (ts) => ts && ts.slice(0, 10) === dateFilter
        );

      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;

      return matchesTerm && matchesDate && matchesStatus;
    });
  }, [loans, profilesById, search, dateFilter, statusFilter]);

  const openCount = loans.filter((l) => ['requested', 'approved'].includes(l.status)).length;

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">
          Loans{openCount > 0 && <span className="text-brass"> — {openCount} need action</span>}
        </h2>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Approve requests, disburse funds, and log repayments as they come in.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'requested', label: 'Requested' },
          { key: 'approved', label: 'Approved' },
          { key: 'disbursed', label: 'Disbursed' },
          { key: 'cleared', label: 'Cleared' },
          { key: 'rejected', label: 'Rejected' },
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

      <div className="mt-3 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by member name or cooperative ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm border border-rule bg-parchment py-2.5 pl-9 pr-3 font-body text-sm text-ink placeholder:text-ink-muted/60 focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          title="Filter by requested, disbursed, or cleared/rejected date"
          className="rounded-sm border border-rule bg-parchment px-3 py-2.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
        />
        {dateFilter && (
          <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => setDateFilter('')}>
            Clear date
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 font-body text-sm text-ink-muted">Loading…</p>
      ) : filteredLoans.length === 0 ? (
        <p className="mt-6 font-body text-sm text-ink-muted">
          {loans.length === 0 ? 'No loan requests yet.' : 'No loans match your search.'}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-rule">
          {filteredLoans.map((l) => {
            const profile = profilesById[l.user_id];
            const rate = rates[l.loan_id] ?? l.interest_rate ?? 0;
            const pct =
              l.total_repayable > 0
                ? Math.min(100, Math.round((l.amount_repaid / l.total_repayable) * 100))
                : 0;
            const isResolved = l.status === 'cleared' || l.status === 'rejected';

            return (
              <li key={l.loan_id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-medium text-ink">
                      {profile?.full_name}
                    </p>
                    <p className="font-mono text-xs text-ink-muted">{profile?.cooperative_id}</p>
                  </div>

                  <div className="tabular font-mono text-sm text-ink">
                    {formatNaira(l.principal)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={BADGE_VARIANT[l.status]}>{l.status}</Badge>

                    {l.status === 'requested' && (
                      <>
                        <label className="flex items-center gap-1.5">
                          <span className="font-body text-xs text-ink-muted">Interest %</span>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={rate}
                            onChange={(e) =>
                              setRates((prev) => ({ ...prev, [l.loan_id]: e.target.value }))
                            }
                            className="w-16 rounded-sm border border-rule bg-parchment px-2 py-1.5 font-mono text-xs text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                          />
                        </label>
                        <Button
                          variant="primary"
                          className="px-3 py-1.5 text-xs"
                          loading={busyId === l.loan_id}
                          onClick={() =>
                            updateLoan(l.loan_id, { status: 'approved', interest_rate: Number(rate) })
                          }
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-3 py-1.5 text-xs text-brick hover:bg-brick/5"
                          loading={busyId === l.loan_id}
                          onClick={() => updateLoan(l.loan_id, { status: 'rejected' })}
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Reject
                        </Button>
                      </>
                    )}

                    {l.status === 'approved' && (
                      <>
                        <label className="flex items-center gap-1.5">
                          <span className="font-body text-xs text-ink-muted">Interest %</span>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={rate}
                            onChange={(e) =>
                              setRates((prev) => ({ ...prev, [l.loan_id]: e.target.value }))
                            }
                            className="w-16 rounded-sm border border-rule bg-parchment px-2 py-1.5 font-mono text-xs text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                          />
                        </label>
                        <input
                          type="date"
                          value={dueDates[l.loan_id] ?? defaultDueDate()}
                          onChange={(e) =>
                            setDueDates((d) => ({ ...d, [l.loan_id]: e.target.value }))
                          }
                          className="rounded-sm border border-rule bg-parchment px-2 py-1.5 font-mono text-xs text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                        />
                        <Button
                          variant="primary"
                          className="px-3 py-1.5 text-xs"
                          loading={busyId === l.loan_id}
                          onClick={() =>
                            updateLoan(l.loan_id, {
                              status: 'disbursed',
                              interest_rate: Number(rate),
                              due_date: dueDates[l.loan_id] ?? defaultDueDate(),
                            })
                          }
                        >
                          <HandCoins className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Disburse
                        </Button>
                      </>
                    )}

                    {l.status === 'disbursed' && (
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => toggleExpand(l.loan_id)}
                      >
                        {expanded === l.loan_id ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                        Repayments
                      </Button>
                    )}

                    {isResolved && (
                      <Button
                        variant="ghost"
                        className="px-3 py-1.5 text-xs text-brick hover:bg-brick/5"
                        loading={busyId === l.loan_id}
                        onClick={() => deleteLoan(l)}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Remove from history
                      </Button>
                    )}
                  </div>
                </div>

                {/* Lifecycle dates */}
                <p className="mt-1.5 font-mono text-[11px] text-ink-muted">
                  Requested {formatDate(l.created_at)}
                  {l.disbursed_at && <> · Disbursed {formatDate(l.disbursed_at)}</>}
                  {isResolved && <> · {l.status === 'cleared' ? 'Cleared' : 'Rejected'} {formatDate(l.updated_at)}</>}
                </p>

                {l.status === 'disbursed' && (
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar value={pct} className="max-w-xs" />
                    <span className="shrink-0 font-mono text-xs text-ink-muted">
                      {formatNaira(l.amount_repaid)} / {formatNaira(l.total_repayable)} ({pct}%)
                    </span>
                  </div>
                )}

                {expanded === l.loan_id && (
                  <div className="mt-3 rounded-sm border border-rule bg-parchment p-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                          Log a repayment
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="₦0.00"
                          value={repayAmounts[l.loan_id] ?? ''}
                          onChange={(e) =>
                            setRepayAmounts((prev) => ({ ...prev, [l.loan_id]: e.target.value }))
                          }
                          className="w-36 rounded-sm border border-rule bg-parchment-soft px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                        />
                      </label>
                      <Button
                        variant="primary"
                        className="px-3 py-1.5 text-xs"
                        loading={busyId === l.loan_id}
                        onClick={() => logRepayment(l)}
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Log repayment
                      </Button>
                    </div>

                    <div className="mt-4">
                      {!repayments[l.loan_id] ? (
                        <p className="font-body text-xs text-ink-muted">Loading…</p>
                      ) : repayments[l.loan_id].length === 0 ? (
                        <p className="font-body text-xs text-ink-muted">No repayments logged yet.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {repayments[l.loan_id].map((r) => (
                            <li
                              key={r.id}
                              className="flex items-center justify-between rounded-sm bg-parchment-soft px-3 py-2"
                            >
                              <span className="font-body text-xs text-ink-muted">
                                {formatDate(r.date)}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="tabular font-mono text-sm text-ink">
                                  {formatNaira(r.amount)}
                                </span>
                                <button
                                  onClick={() => deleteRepayment(l.loan_id, r.id)}
                                  className="text-ink-muted hover:text-brick"
                                  aria-label="Delete repayment"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      
