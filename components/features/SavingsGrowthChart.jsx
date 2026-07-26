'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { formatNaira } from '@/lib/utils';

const MONTHS_BACK = 12;

function lastNMonths(n, offsetYears = 0) {
  const out = [];
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offsetYears * 12);
  for (let i = n - 1; i >= 0; i -= 1) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`,
      label: m.toLocaleDateString('en-NG', { month: 'short', year: '2-digit' }),
    });
  }
  return out;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-rule bg-parchment-soft px-3 py-2 shadow-lg">
      <p className="font-body text-xs text-ink-muted">{label}</p>
      <p className="tabular font-mono text-sm font-semibold text-cooperative">
        {formatNaira(payload[0].value)}
      </p>
    </div>
  );
}

export default function SavingsGrowthChart({ userId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offsetYears, setOffsetYears] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount, month_logged')
        .eq('user_id', userId);

      const months = lastNMonths(MONTHS_BACK, offsetYears);
      const byMonth = {};
      (contributions ?? []).forEach((c) => {
        byMonth[c.month_logged] = (byMonth[c.month_logged] ?? 0) + Number(c.amount);
      });

      const priorTotal = (contributions ?? [])
        .filter((c) => c.month_logged < months[0].key)
        .reduce((sum, c) => sum + Number(c.amount), 0);

      let running = priorTotal;
      const series = months.map((m) => {
        running += byMonth[m.key] ?? 0;
        return { label: m.label, total: running };
      });

      setData(series);
      setLoading(false);
    }
    load();
  }, [userId, offsetYears]);

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <button
          onClick={() => setOffsetYears(0)}
          className={`rounded-full border px-3 py-1 font-body text-xs font-medium transition-colors ${
            offsetYears === 0
              ? 'border-cooperative bg-cooperative text-parchment-soft'
              : 'border-rule bg-parchment text-ink-muted hover:border-cooperative hover:text-cooperative'
          }`}
        >
          This year
        </button>
        <button
          onClick={() => setOffsetYears(1)}
          className={`rounded-full border px-3 py-1 font-body text-xs font-medium transition-colors ${
            offsetYears === 1
              ? 'border-cooperative bg-cooperative text-parchment-soft'
              : 'border-rule bg-parchment text-ink-muted hover:border-cooperative hover:text-cooperative'
          }`}
        >
          Past year
        </button>
      </div>

      {loading ? (
        <p className="font-body text-sm text-ink-muted">Loading chart…</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e3e6dd" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#55625b' }}
              axisLine={{ stroke: '#e3e6dd' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#55625b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₦${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#0f5c3e"
              strokeWidth={2}
              dot={{ r: 3, fill: '#0f5c3e' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}