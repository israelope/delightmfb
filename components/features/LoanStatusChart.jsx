'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { createClient } from '@/lib/supabase/client';

const STATUS_ORDER = ['requested', 'approved', 'disbursed', 'cleared', 'rejected'];
const STATUS_COLOR = {
  requested: '#b8862e',
  approved: '#f2b705',
  disbursed: '#0f5c3e',
  cleared: '#55625b',
  rejected: '#9b3b33',
};
const STATUS_LABEL = {
  requested: 'Requested',
  approved: 'Approved',
  disbursed: 'Disbursed',
  cleared: 'Cleared',
  rejected: 'Rejected',
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { label, value } = payload[0].payload;
  return (
    <div className="rounded-sm border border-rule bg-parchment-soft px-3 py-2 shadow-lg">
      <p className="font-body text-xs text-ink-muted">{label}</p>
      <p className="tabular font-mono text-sm font-semibold text-ink">{value} loan{value === 1 ? '' : 's'}</p>
    </div>
  );
}

export default function LoanStatusChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data: loans } = await supabase.from('loans').select('status');

      const counts = {};
      (loans ?? []).forEach((l) => {
        counts[l.status] = (counts[l.status] ?? 0) + 1;
      });

      setData(
        STATUS_ORDER.map((status) => ({
          label: STATUS_LABEL[status],
          value: counts[status] ?? 0,
          fill: STATUS_COLOR[status],
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="font-body text-sm text-ink-muted">Loading chart…</p>;

  if (data.every((d) => d.value === 0)) {
    return (
      <p className="flex h-[180px] items-center justify-center font-body text-sm text-ink-muted">
        No loans yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e3e6dd" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: '#55625b' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 12, fill: '#55625b' }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(15,92,62,0.05)' }} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
