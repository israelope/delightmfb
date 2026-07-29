'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

export default function AdminProductGoalsEditor() {
  const [allMembers, setAllMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [goals, setGoals] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function loadMembers() {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, cooperative_id')
        .order('full_name');
      setAllMembers(data ?? []);
    }
    loadMembers();
  }, []);

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return allMembers
      .filter(
        (m) =>
          m.full_name?.toLowerCase().includes(term) || m.cooperative_id?.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [allMembers, search]);

  async function selectMember(member) {
    setSelected(member);
    setSearch('');
    setError('');
    setNotice('');
    await loadGoals(member.id);
  }

  async function loadGoals(userId) {
    setLoadingGoals(true);
    const supabase = createClient();
    const [{ data: goalRows, error: fetchError }, { data: types }] = await Promise.all([
      supabase
        .from('member_product_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase.from('product_types').select('id, name'),
    ]);

    if (fetchError) {
      setError(fetchError.message);
      setLoadingGoals(false);
      return;
    }

    const nameById = {};
    (types ?? []).forEach((t) => {
      nameById[t.id] = t.name;
    });

    setGoals((goalRows ?? []).map((g) => ({ ...g, productName: nameById[g.product_type_id] ?? g.product_type_id })));
    setAmounts({});
    setLoadingGoals(false);
  }

  async function logPayment(goal) {
    const amount = Number(amounts[goal.id]);
    if (!amount || amount <= 0) {
      setError('Enter a valid amount before logging.');
      return;
    }
    setBusyId(goal.id);
    setError('');
    setNotice('');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from('product_goal_contributions').insert({
      goal_id: goal.id,
      amount,
      logged_by: user?.id,
    });

    setBusyId(null);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setNotice(`Logged ${formatNaira(amount)} toward ${goal.productName} for ${selected.full_name}.`);
    setAmounts((prev) => ({ ...prev, [goal.id]: '' }));
    await loadGoals(selected.id);
  }

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Log a product payment</h2>
      <p className="mt-1 font-body text-sm text-ink-muted">
        For payments reported offline — WhatsApp, a call, in person — with no receipt upload.
        Search a member, then log the amount straight to the right goal.
      </p>

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
          Search above and pick a member to get started.
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
            <p className="mt-4 rounded-sm bg-cooperative/10 px-3 py-2 font-body text-sm text-cooperative-dark">
              {notice}
            </p>
          )}

          {loadingGoals ? (
            <p className="mt-4 font-body text-sm text-ink-muted">Loading goals…</p>
          ) : goals.length === 0 ? (
            <p className="mt-4 font-body text-sm text-ink-muted">
              This member hasn't started saving toward any product yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {goals.map((g) => {
                const pct = g.target_amount > 0 ? Math.min(100, Math.round((g.amount_saved / g.target_amount) * 100)) : 0;
                return (
                  <li key={g.id} className="rounded-sm border border-rule bg-parchment px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-body text-sm font-medium text-ink">{g.productName}</p>
                        <p className="tabular font-mono text-xs text-ink-muted">
                          {formatNaira(g.amount_saved)} of {formatNaira(g.target_amount)}
                        </p>
                      </div>
                      <Badge variant={g.status === 'completed' ? 'available' : 'pending'}>
                        {g.status === 'completed' ? 'completed' : `${pct}%`}
                      </Badge>
                    </div>
                    <ProgressBar value={pct} className="mt-2" />

                    {g.status !== 'completed' && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="₦0.00"
                          value={amounts[g.id] ?? ''}
                          onChange={(e) => setAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                          className="w-32 rounded-sm border border-rule bg-parchment-soft px-3 py-1.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                        />
                        <Button
                          variant="primary"
                          className="px-3 py-1.5 text-xs"
                          loading={busyId === g.id}
                          onClick={() => logPayment(g)}
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Log payment
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
