'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira, formatDate } from '@/lib/utils';

const PAGE_SIZE = 10;

export default function ProductGoalsHistory({ userId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const [{ data: goals }, { data: types }] = await Promise.all([
        supabase.from('member_product_goals').select('id, product_type_id, custom_name').eq('user_id', userId),
        supabase.from('product_types').select('id, name'),
      ]);

      const nameById = {};
      (types ?? []).forEach((t) => (nameById[t.id] = t.name));
      const goalIds = (goals ?? []).map((g) => g.id);
      const nameByGoal = {};
      (goals ?? []).forEach((g) => {
        nameByGoal[g.id] = g.custom_name ?? nameById[g.product_type_id] ?? 'Goal';
      });

      if (goalIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const { data: contributions } = await supabase
        .from('product_goal_contributions')
        .select('id, goal_id, amount, type, date, created_at')
        .in('goal_id', goalIds)
        .order('date', { ascending: false });

      setRows((contributions ?? []).map((c) => ({ ...c, productName: nameByGoal[c.goal_id] })));
      setLoading(false);
    }
    load();
  }, [userId]);

  const visible = rows.slice(0, visibleCount);

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Transaction History</h2>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Every payment applied to your product goals, most recent first.
      </p>

      {loading ? (
        <p className="mt-4 font-body text-sm text-ink-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 font-body text-sm text-ink-muted">No product payments logged yet.</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-rule">
            {visible.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-body text-sm text-ink">{r.productName}</p>
                  <p className="font-mono text-xs text-ink-muted">{formatDate(r.date)}</p>
                </div>
                <p className={`tabular font-mono text-sm ${r.type === 'refund' ? 'text-brick' : 'text-ink'}`}>
                  {r.type === 'refund' ? '− ' : '+ '}
                  {formatNaira(r.amount)}
                </p>
              </li>
            ))}
          </ul>
          {rows.length > visibleCount && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-3 font-body text-xs font-medium text-cooperative hover:underline"
            >
              Show 10 more ({rows.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}