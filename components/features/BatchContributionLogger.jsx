'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { formatNaira } from '@/lib/utils';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function BatchContributionLogger() {
  const [month, setMonth] = useState(currentMonth());
  const [members, setMembers] = useState([]);
  const [logged, setLogged] = useState({}); // { user_id: amount } already saved for this month
  const [amounts, setAmounts] = useState({}); // { user_id: string } being typed now
  const [fillAll, setFillAll] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  async function loadData() {
    setLoading(true);
    setError('');
    const supabase = createClient();

    const [{ data: memberData, error: memberError }, { data: contribData, error: contribError }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, cooperative_id')
          .eq('role', 'member')
          .eq('status', 'active')
          .order('full_name'),
        supabase.from('contributions').select('user_id, amount').eq('month_logged', month),
      ]);

    if (memberError || contribError) {
      setError((memberError ?? contribError).message);
      setLoading(false);
      return;
    }

    setMembers(memberData ?? []);
    const loggedMap = {};
    (contribData ?? []).forEach((c) => {
      loggedMap[c.user_id] = Number(c.amount);
    });
    setLogged(loggedMap);
    setAmounts({});
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const pendingRows = useMemo(
    () =>
      members
        .filter((m) => !(m.id in logged))
        .filter((m) => amounts[m.id] && Number(amounts[m.id]) > 0),
    [members, logged, amounts]
  );

  function applyToAllEmpty() {
    if (!fillAll || Number(fillAll) <= 0) return;
    const next = { ...amounts };
    members.forEach((m) => {
      if (!(m.id in logged)) next[m.id] = fillAll;
    });
    setAmounts(next);
  }

  async function handleSave() {
    if (pendingRows.length === 0) return;
    setSaving(true);
    setError('');
    setSuccessCount(0);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const today = new Date().toISOString().slice(0, 10);
    const rows = pendingRows.map((m) => ({
      user_id: m.id,
      amount: Number(amounts[m.id]),
      date: today,
      month_logged: month,
      logged_by: user?.id,
    }));

    const { error: insertError } = await supabase.from('contributions').insert(rows);

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccessCount(rows.length);
    await loadData();
  }

  return (
    <div className="mt-8 rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Log contributions</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Enter this month's savings for each member, then save them all at once.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
            Month
          </span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-rule pt-5">
        <span className="font-body text-xs text-ink-muted">Apply one amount to everyone unlogged:</span>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="₦0.00"
          value={fillAll}
          onChange={(e) => setFillAll(e.target.value)}
          className="w-32 rounded-sm border border-rule bg-parchment px-3 py-1.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
        />
        <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={applyToAllEmpty}>
          Fill all
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}
      {successCount > 0 && (
        <p className="mt-4 flex items-center gap-1.5 rounded-sm bg-cooperative/10 px-3 py-2 font-body text-sm text-cooperative-dark">
          <Check className="h-4 w-4" /> Logged {successCount} contribution
          {successCount === 1 ? '' : 's'} for {month}.
        </p>
      )}

      {loading ? (
        <p className="mt-6 font-body text-sm text-ink-muted">Loading members…</p>
      ) : members.length === 0 ? (
        <p className="mt-6 font-body text-sm text-ink-muted">No active members yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-rule">
          {members.map((m) => {
            const alreadyLogged = m.id in logged;
            return (
              <li key={m.id} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-body text-sm text-ink">{m.full_name}</p>
                  <p className="font-mono text-xs text-ink-muted">{m.cooperative_id}</p>
                </div>

                {alreadyLogged ? (
                  <span className="tabular font-mono text-sm text-ink-muted">
                    {formatNaira(logged[m.id])} — logged
                  </span>
                ) : (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="₦0.00"
                    value={amounts[m.id] ?? ''}
                    onChange={(e) => setAmounts((a) => ({ ...a, [m.id]: e.target.value }))}
                    className="tabular w-32 rounded-sm border border-rule bg-parchment px-3 py-1.5 text-right font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Button
        variant="primary"
        loading={saving}
        disabled={pendingRows.length === 0}
        onClick={handleSave}
        className="mt-6"
      >
        <Save className="h-4 w-4" strokeWidth={2.25} />
        Save {pendingRows.length > 0 ? `${pendingRows.length} ` : ''}contribution
        {pendingRows.length === 1 ? '' : 's'}
      </Button>
    </div>
  );
}