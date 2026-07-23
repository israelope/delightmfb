'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { formatNaira } from '@/lib/utils';

const COLORS = { Savings: '#0f5c3e', 'Loans Out': '#2e6b58' };

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

export default function AdminFundAllocationChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const [{ data: contributions }, { data: outstanding }] = await Promise.all([
        supabase.from('contributions').select('amount'),
        supabase.from('loan_balances').select('amount_outstanding').eq('status', 'disbursed'),
      ]);

      const savings = (contributions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
      const loansOut = (outstanding ?? []).reduce(
        (sum, l) => sum + Number(l.amount_outstanding),
        0
      );

      const rows = [{ name: 'Savings', value: savings }];
      if (loansOut > 0) rows.push({ name: 'Loans Out', value: loansOut });
      setData(rows);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="font-body text-sm text-ink-muted">Loading chart…</p>;

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <p className="flex h-[220px] items-center justify-center font-body text-sm text-ink-muted">
        Nothing to show yet.
      </p>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 space-y-1.5">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-body text-sm text-ink">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[entry.name] }}
              />
              {entry.name}
            </span>
            <span className="tabular font-mono text-sm text-ink-muted">
              {formatNaira(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
