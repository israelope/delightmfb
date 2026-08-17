'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, UserRound, PiggyBank, ShoppingBasket, Users, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira, formatDate } from '@/lib/utils';

const PAGE_SIZE = 10;

export default function MemberSavingsLookup() {
  const [allMembers, setAllMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [regular, setRegular] = useState([]);
  const [productRows, setProductRows] = useState([]);
  const [communityRows, setCommunityRows] = useState([]);

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
    setVisibleCount(PAGE_SIZE);
    setLoading(true);
    setRegular([]);
    setProductRows([]);
    setCommunityRows([]);

    const supabase = createClient();

    const [
      { data: contribs, error: e1 },
      { data: goals, error: e2 },
      { data: types, error: e3 },
      { data: community, error: e4 },
    ] = await Promise.all([
      supabase
        .from('contributions')
        .select('id, amount, date, month_logged')
        .eq('user_id', member.id)
        .order('date', { ascending: false }),
      supabase
        .from('member_product_goals')
        .select('id, product_type_id, custom_name')
        .eq('user_id', member.id),
      supabase.from('product_types').select('id, name'),
      supabase
        .from('community_goal_contributions')
        .select('id, community_goal_id, amount')
        .eq('user_id', member.id),
    ]);

    if (e1 || e2 || e3 || e4) {
      setError(e1?.message || e2?.message || e3?.message || e4?.message);
      setLoading(false);
      return;
    }

    const typeNameById = {};
    (types ?? []).forEach((t) => (typeNameById[t.id] = t.name));
    const goalNameById = {};
    (goals ?? []).forEach((g) => {
      goalNameById[g.id] = g.custom_name ?? typeNameById[g.product_type_id] ?? 'Goal';
    });

    setRegular(contribs ?? []);

    if (goals?.length > 0) {
      const goalIds = goals.map((g) => g.id);
      const { data: pContribs } = await supabase
        .from('product_goal_contributions')
        .select('id, goal_id, amount, type, date')
        .in('goal_id', goalIds)
        .order('date', { ascending: false });
      setProductRows(
        (pContribs ?? []).map((c) => ({ ...c, goalName: goalNameById[c.goal_id] ?? 'Goal' }))
      );
    }

    setCommunityRows(community ?? []);
    setLoading(false);
  }

  const totalRegular = regular.reduce((s, c) => s + Number(c.amount), 0);
  const totalProduct = productRows.reduce(
    (s, c) => s + (c.type === 'refund' ? -Number(c.amount) : Number(c.amount)),
    0
  );
  const totalCommunity = communityRows.reduce((s, c) => s + Number(c.amount), 0);
  const grandTotal = totalRegular + totalProduct + totalCommunity;

  const ledger = useMemo(() => {
    const rows = [
      ...regular.map((c) => ({
        id: c.id,
        date: c.date,
        type: 'Regular Savings',
        description: c.month_logged,
        amount: Number(c.amount),
      })),
      ...productRows.map((c) => ({
        id: c.id,
        date: c.date,
        type: 'Product Goal',
        description: c.goalName,
        amount: c.type === 'refund' ? -Number(c.amount) : Number(c.amount),
      })),
      ...communityRows.map((c) => ({
        id: c.id,
        date: null,
        type: 'Community Goal',
        description: c.community_goal_id,
        amount: Number(c.amount),
      })),
    ];
    return rows.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });
  }, [regular, productRows, communityRows]);

  const visibleLedger = ledger.slice(0, visibleCount);

  const stats = [
    { label: 'Regular Savings', value: totalRegular, icon: PiggyBank, tone: 'text-cooperative' },
    { label: 'Product Goals', value: totalProduct, icon: ShoppingBasket, tone: 'text-brass' },
    { label: 'Community Goals', value: totalCommunity, icon: Users, tone: 'text-cooperative-dark' },
    { label: 'Grand Total', value: grandTotal, icon: Wallet, tone: 'text-ink' },
  ];

  return (
    <div className="mt-8 rounded-sm border border-rule bg-parchment-soft p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Member Savings Lookup</h2>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Search for a member to view their total savings across all categories.
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
          Search above and pick a member to view their savings.
        </p>
      ) : loading ? (
        <p className="mt-6 font-body text-sm text-ink-muted">Loading savings data…</p>
      ) : error ? (
        <p role="alert" className="mt-6 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      ) : (
        <div className="mt-6">
          <div className="flex items-center justify-between rounded-sm border border-rule bg-parchment px-4 py-3">
            <div>
              <p className="font-body text-sm font-medium text-ink">{selected.full_name}</p>
              <p className="font-mono text-xs text-ink-muted">{selected.cooperative_id}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="font-body text-xs font-medium text-cooperative hover:underline"
            >
              Change member
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-sm border border-rule bg-parchment-soft p-5">
                <div className="flex items-center justify-between">
                  <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                    {label}
                  </p>
                  <Icon className={`h-4 w-4 ${tone}`} strokeWidth={1.75} />
                </div>
                <p className="tabular mt-3 font-display text-2xl font-semibold text-ink">
                  {formatNaira(value)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
              Full transaction ledger
            </p>
            {ledger.length === 0 ? (
              <p className="mt-3 font-body text-sm text-ink-muted">
                No contributions logged yet.
              </p>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-rule text-xs uppercase tracking-wider text-ink-muted">
                        <th className="pb-2 font-body font-medium">Date</th>
                        <th className="pb-2 font-body font-medium">Type</th>
                        <th className="pb-2 font-body font-medium">Description</th>
                        <th className="pb-2 text-right font-body font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                      {visibleLedger.map((row) => (
                        <tr key={`${row.type}-${row.id}`}>
                          <td className="py-2.5 font-body text-sm text-ink">
                            {row.date
                              ? new Date(row.date).toLocaleDateString('en-NG', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="py-2.5 font-body text-sm text-ink-muted">{row.type}</td>
                          <td className="py-2.5 font-mono text-sm text-ink-muted">
                            {row.description}
                          </td>
                          <td
                            className={`tabular py-2.5 text-right font-mono text-sm ${
                              row.amount < 0 ? 'text-brick' : 'text-ink'
                            }`}
                          >
                            {row.amount < 0 ? '− ' : ''}
                            {formatNaira(Math.abs(row.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {ledger.length > visibleCount && (
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="mt-3 font-body text-xs font-medium text-cooperative hover:underline"
                  >
                    Show 10 more ({ledger.length - visibleCount} remaining)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
