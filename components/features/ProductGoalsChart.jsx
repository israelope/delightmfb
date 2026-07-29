'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { formatNaira } from '@/lib/utils';

const COLORS = ['#0f5c3e', '#2e6b58', '#b8862e', '#f2b705', '#9b3b33', '#55625b'];

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-sm border border-rule bg-parchment-soft px-3 py-2 shadow-lg">
      <p className="font-body text-xs text-ink-muted">{name}</p>
      <p className="tabular font-mono text-sm font-semibold text-ink">{formatNaira(value)}</p>
    </div>
  );
}

export default function ProductGoalsChart({ userId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const [{ data: goals }, { data: types }] = await Promise.all([
        supabase
          .from('member_product_goals')
          .select('product_type_id, amount_saved')
          .eq('user_id', userId)
          .eq('status', 'active'),
        supabase.from('product_types').select('id, name'),
      ]);

      const nameById = {};
      (types ?? []).forEach((t) => {
        nameById[t.id] = t.name;
      });

      const rows = (goals ?? [])
        .filter((g) => Number(g.amount_saved) > 0)
        .map((g) => ({ name: nameById[g.product_type_id] ?? g.product_type_id, value: Number(g.amount_saved) }));

      setData(rows);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) return <p className="font-body text-sm text-ink-muted">Loading chart…</p>;

  if (data.length === 0) {
    return (
      <p className="flex h-[180px] items-center justify-center font-body text-sm text-ink-muted">
        Start saving toward a product to see it here.
      </p>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 space-y-1.5">
        {data.map((entry, i) => (
          <li key={entry.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-body text-sm text-ink">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              {entry.name}
            </span>
            <span className="tabular font-mono text-sm text-ink-muted">{formatNaira(entry.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
