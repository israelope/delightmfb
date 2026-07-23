'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, X, Save, Trash2, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira } from '@/lib/utils';
import Button from '@/components/ui/Button';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function emptyRow() {
  return { key: crypto.randomUUID(), month: currentMonth(), amount: '' };
}

export default function MemberContributionEditor() {
  const [allMembers, setAllMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [edits, setEdits] = useState({});
  const [newRows, setNewRows] = useState([emptyRow()]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function loadMembers() {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, cooperative_id')
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
          m.full_name?.toLowerCase().includes(term) ||
          m.email?.toLowerCase().includes(term) ||
          m.cooperative_id?.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [allMembers, search]);

  async function selectMember(member) {
    setSelected(member);
    setSearch('');
    setError('');
    setNotice('');
    setNewRows([emptyRow()]);
    await loadHistory(member.id);
  }

  async function loadHistory(userId) {
    setLoadingHistory(true);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('contributions')
      .select('id, amount, date, month_logged')
      .eq('user_id', userId)
      .order('month_logged', { ascending: false });

    if (!fetchError) {
      setHistory(data ?? []);
      setEdits({});
    } else {
      setError(fetchError.message);
    }
    setLoadingHistory(false);
  }

  function updateEditValue(id, value) {
    setEdits((e) => ({ ...e, [id]: value }));
  }

  async function saveEdit(row) {
    const newAmount = Number(edits[row.id]);
    if (!newAmount || newAmount <= 0) {
      setError('Enter a valid amount before saving.');
      return;
    }
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('contributions')
      .update({ amount: newAmount })
      .eq('id', row.id);
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setNotice(`Updated ${row.month_logged} contribution.`);
    await loadHistory(selected.id);
  }

  async function deleteContribution(row) {
    const confirmed = window.confirm(
      `Delete the ${formatNaira(row.amount)} contribution logged for ${row.month_logged}? This can't be undone.`
    );
    if (!confirmed) return;
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('contributions').delete().eq('id', row.id);
    setBusy(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setNotice(`Deleted the ${row.month_logged} contribution.`);
    await loadHistory(selected.id);
  }

  function updateRow(key, field, value) {
    setNewRows((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setNewRows((rows) => [...rows, emptyRow()]);
  }

  function removeRow(key) {
    setNewRows((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows));
  }

  const loggedMonths = useMemo(() => new Set(history.map((h) => h.month_logged)), [history]);

  async function saveNewRows() {
    const validRows = newRows.filter((r) => r.month && Number(r.amount) > 0);
    if (validRows.length === 0) return;

    setBusy(true);
    setError('');
    setNotice('');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const today = new Date().toISOString().slice(0, 10);
    const rows = validRows.map((r) => ({
      user_id: selected.id,
      amount: Number(r.amount),
      date: today,
      month_logged: r.month,
      logged_by: user?.id,
    }));

    const { error: insertError } = await supabase.from('contributions').insert(rows);
    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setNotice(
      `Logged ${rows.length} contribution${rows.length === 1 ? '' : 's'} for ${selected.full_name}.`
    );
    setNewRows([emptyRow()]);
    await loadHistory(selected.id);
  }

  return (
    <div className="mt-8 rounded-sm border border-rule bg-parchment-soft p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Edit a member's contributions</h2>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Search for a member to log new months at once, or fix a mistaken entry.
      </p>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder="Search by name, email, or cooperative ID…"
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

          <div className="mt-6">
            <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
              Contribution history
            </p>
            {loadingHistory ? (
              <p className="mt-3 font-body text-sm text-ink-muted">Loading…</p>
            ) : history.length === 0 ? (
              <p className="mt-3 font-body text-sm text-ink-muted">Nothing logged yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-rule">
                {history.map((row) => {
                  const editValue = edits[row.id] ?? String(row.amount);
                  const dirty = Number(editValue) !== Number(row.amount);
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                    >
                      <span className="font-mono text-sm text-ink-muted">{row.month_logged}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => updateEditValue(row.id, e.target.value)}
                          className="tabular w-32 rounded-sm border border-rule bg-parchment px-3 py-1.5 text-right font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                        />
                        <Button
                          variant="secondary"
                          className="px-2.5 py-1.5 text-xs"
                          disabled={!dirty}
                          loading={busy}
                          onClick={() => saveEdit(row)}
                        >
                          <Save className="h-3.5 w-3.5" strokeWidth={2.25} />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-2.5 py-1.5 text-xs text-brick hover:bg-brick/5"
                          loading={busy}
                          onClick={() => deleteContribution(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-6 border-t border-rule pt-5">
            <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
              Log new months
            </p>
            <div className="mt-3 space-y-2">
              {newRows.map((row) => {
                const alreadyLogged = loggedMonths.has(row.month);
                return (
                  <div key={row.key} className="flex flex-wrap items-center gap-2">
                    <input
                      type="month"
                      value={row.month}
                      onChange={(e) => updateRow(row.key, 'month', e.target.value)}
                      className="rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="₦0.00"
                      value={row.amount}
                      onChange={(e) => updateRow(row.key, 'amount', e.target.value)}
                      className="tabular w-32 rounded-sm border border-rule bg-parchment px-3 py-2 text-right font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                    />
                    {alreadyLogged && (
                      <span className="font-body text-xs text-brass">
                        Already logged — edit above instead
                      </span>
                    )}
                    {newRows.length > 1 && (
                      <button
                        onClick={() => removeRow(row.key)}
                        aria-label="Remove month"
                        className="text-ink-muted hover:text-brick"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={addRow}>
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Add another month
              </Button>
              <Button
                variant="primary"
                className="px-3 py-1.5 text-xs"
                loading={busy}
                onClick={saveNewRows}
              >
                Save contributions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}