'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, UserRound, Plus, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira } from '@/lib/utils';
import Button from '@/components/ui/Button';

function defaultDisbursementDate() {
  return new Date().toISOString().slice(0, 10);
}

function defaultDueDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

export default function DirectLoanCreator() {
  const [allMembers, setAllMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [defaultRate, setDefaultRate] = useState(0);

  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [disbursementDate, setDisbursementDate] = useState(defaultDisbursementDate());
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [amountRepaid, setAmountRepaid] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const [{ data: members }, { data: settings }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, cooperative_id').order('full_name'),
        supabase.from('cooperative_settings').select('default_interest_rate').eq('id', 1).single(),
      ]);
      setAllMembers(members ?? []);
      setDefaultRate(settings?.default_interest_rate ?? 0);
      setInterestRate(String(settings?.default_interest_rate ?? 0));
    }
    init();
  }, []);

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return allMembers
      .filter(
        (m) =>
          m.full_name?.toLowerCase().includes(term) ||
          m.cooperative_id?.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [allMembers, search]);

  const totalRepayable = useMemo(() => {
    const p = Number(principal);
    const r = Number(interestRate);
    if (!p || !r && r !== 0) return 0;
    return p * (1 + r / 100);
  }, [principal, interestRate]);

  function selectMember(member) {
    setSelected(member);
    setSearch('');
    setError('');
    setNotice('');
    setPrincipal('');
    setInterestRate(String(defaultRate));
    setRequestDate('');
    setDisbursementDate(defaultDisbursementDate());
    setDueDate(defaultDueDate());
    setAmountRepaid('');
  }

  function resetForm() {
    setPrincipal('');
    setInterestRate(String(defaultRate));
    setRequestDate('');
    setDisbursementDate(defaultDisbursementDate());
    setDueDate(defaultDueDate());
    setAmountRepaid('');
  }

  async function handleCreate() {
    const p = Number(principal);
    const r = Number(interestRate);
    const repaid = Number(amountRepaid) || 0;

    if (!p || p <= 0) {
      setError('Enter a valid principal amount.');
      return;
    }
    if (!requestDate) {
      setError('Select the date the loan was originally requested.');
      return;
    }
    if (!disbursementDate) {
      setError('Select the disbursement date.');
      return;
    }
    if (!dueDate) {
      setError('Select the due date.');
      return;
    }
    if (repaid < 0) {
      setError('Amount repaid cannot be negative.');
      return;
    }

    const repayable = p * (1 + r / 100);
    if (repaid > repayable) {
      setError('Amount repaid cannot exceed the total repayable amount.');
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');

    const res = await fetch('/api/admin/create-loan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selected.id,
        principal: p,
        interestRate: r,
        totalRepayable: repayable,
        dueDate,
        disbursedAt: disbursementDate,
        createdAt: requestDate,
        amountRepaid: repaid,
      }),
    });

    const data = await res.json();

    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || 'Failed to create loan.');
      return;
    }

    setNotice(
      `Loan created for ${selected.full_name}. ${formatNaira(p)} principal, ${formatNaira(repayable)} total repayable.`
    );
    resetForm();
  }

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Create a loan directly</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Award a loan to a member without them requesting it — useful for backfilling past records.
          </p>
        </div>
        <Plus className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
      </div>

      {/* Member search */}
      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder="Search by name or cooperative ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-sm border border-rule bg-parchment py-2.5 pl-9 pr-3 font-body text-sm text-ink placeholder:text-ink-muted/60 focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
        />
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-sm border border-rule bg-parchment-soft shadow-lg">
            {results.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => selectMember(m)}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-cooperative/5"
                >
                  <span className="font-body text-sm text-ink">{m.full_name}</span>
                  <span className="font-mono text-xs text-ink-muted">{m.cooperative_id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!selected ? (
        <p className="mt-6 flex items-center gap-2 font-body text-sm text-ink-muted">
          <UserRound className="h-4 w-4" strokeWidth={1.75} />
          Search above and pick a member to create a loan for.
        </p>
      ) : (
        <div className="mt-6">
          <div className="flex items-center justify-between rounded-sm border border-rule bg-parchment px-4 py-3">
            <div>
              <p className="font-body text-sm font-medium text-ink">{selected.full_name}</p>
              <p className="font-mono text-xs text-ink-muted">{selected.cooperative_id}</p>
            </div>
            <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setSelected(null)}>
              Change member
            </Button>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
              {error}
            </p>
          )}
          {notice && (
            <p className="mt-4 flex items-center gap-1.5 rounded-sm bg-cooperative/10 px-3 py-2 font-body text-sm text-cooperative-dark">
              <Check className="h-4 w-4" />
              {notice}
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                Principal amount (₦)
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="₦0.00"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                Interest rate (%)
              </span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                Date requested (backdated)
              </span>
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                Disbursement date
              </span>
              <input
                type="date"
                value={disbursementDate}
                onChange={(e) => setDisbursementDate(e.target.value)}
                className="rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                Due date
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                Total amount already repaid (₦)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="₦0.00"
                value={amountRepaid}
                onChange={(e) => setAmountRepaid(e.target.value)}
                className="rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
              />
            </label>
          </div>

          {totalRepayable > 0 && (
            <div className="mt-4 rounded-sm border border-rule bg-parchment px-4 py-3">
              <p className="font-body text-xs uppercase tracking-wider text-ink-muted">
                Total repayable
              </p>
              <p className="tabular mt-1 font-display text-xl font-semibold text-ink">
                {formatNaira(totalRepayable)}
              </p>
              {Number(amountRepaid) > 0 && (
                <p className="mt-1 font-body text-xs text-ink-muted">
                  Outstanding balance:{' '}
                  <span className="font-medium text-ink">
                    {formatNaira(totalRepayable - Number(amountRepaid))}
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="mt-4">
            <Button
              variant="primary"
              className="px-4 py-2 text-sm"
              loading={submitting}
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Create Loan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
