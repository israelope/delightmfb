'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
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
      {payload.map((p) => (
        <p key={p.dataKey} className="tabular font-mono text-sm" style={{ color: p.fill }}>
          {formatNaira(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function CollectionsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offsetYears, setOffsetYears] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const months = lastNMonths(MONTHS_BACK, offsetYears);
      const earliestDate = `${months[0].key}-01`;
      const lastMonth = months[months.length - 1];
      const latestDate = new Date(
        Number(lastMonth.key.slice(0, 4)),
        Number(lastMonth.key.slice(5, 7)),
        0
      )
        .toISOString()
        .slice(0, 10);

      const [{ data: contributions }, { data: repayments }, { data: disbursedLoans }] = await Promise.all([
        supabase.from('contributions').select('amount, date').gte('date', earliestDate).lte('date', latestDate),
        supabase.from('loan_repayments').select('amount, date').gte('date', earliestDate).lte('date', latestDate),
        supabase
          .from('loans')
          .select('principal, disbursed_at')
          .not('disbursed_at', 'is', null)
          .gte('disbursed_at', earliestDate)
          .lte('disbursed_at', latestDate),
      ]);

      function monthKey(dateStr) {
        return dateStr.slice(0, 7);
      }

      const contribByMonth = {};
      (contributions ?? []).forEach((c) => {
        const k = monthKey(c.date);
        contribByMonth[k] = (contribByMonth[k] ?? 0) + Number(c.amount);
      });

      const repayByMonth = {};
      (repayments ?? []).forEach((r) => {
        const k = monthKey(r.date);
        repayByMonth[k] = (repayByMonth[k] ?? 0) + Number(r.amount);
      });

      const disbursedByMonth = {};
      (disbursedLoans ?? []).forEach((l) => {
        const k = monthKey(l.disbursed_at);
        disbursedByMonth[k] = (disbursedByMonth[k] ?? 0) + Number(l.principal);
      });

      setData(
        months.map((m) => ({
          label: m.label,
          Savings: contribByMonth[m.key] ?? 0,
          Repayments: repayByMonth[m.key] ?? 0,
          'Loans Disbursed': disbursedByMonth[m.key] ?? 0,
        }))
      );
      setLoading(false);
    }
    load();
  }, [offsetYears]);

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
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e3e6dd" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#55625b' }} axisLine={{ stroke: '#e3e6dd' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#55625b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₦${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-body)' }} />
            <Bar dataKey="Savings" fill="#0f5c3e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Repayments" fill="#2e6b58" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Loans Disbursed" fill="#b8862e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}