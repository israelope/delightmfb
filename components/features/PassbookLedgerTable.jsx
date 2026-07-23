'use client';

import { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

export default function PassbookLedgerTable({ rows }) {
  const [selectedMonth, setSelectedMonth] = useState('');

  const filteredRows = useMemo(() => {
    if (!selectedMonth) return rows;
    
    // The native month input always returns the value as "YYYY-MM" (e.g., "2022-01").
    // We can just directly match it against your database's month_logged string!
    return rows.filter((c) => c.month_logged === selectedMonth);
  }, [rows, selectedMonth]);

  return (
    <div>
      <div className="relative">
        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full rounded-sm border border-rule bg-parchment py-2.5 pl-9 pr-3 font-body text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
        />
      </div>

      {filteredRows.length === 0 ? (
        <p className="mt-6 font-body text-sm text-ink-muted">
          {rows.length === 0 
            ? 'Nothing logged yet — check back after your next contribution.' 
            : 'No contributions found for that specific month.'}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule text-xs uppercase tracking-wider text-ink-muted">
                <th className="pb-2 font-body font-medium">Date</th>
                <th className="pb-2 font-body font-medium">Month</th>
                <th className="pb-2 text-right font-body font-medium">Amount</th>
                <th className="pb-2 text-right font-body font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredRows.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 font-body text-sm text-ink">
                    {new Date(c.date).toLocaleDateString('en-NG', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-2.5 font-mono text-sm text-ink-muted">{c.month_logged}</td>
                  <td className="tabular py-2.5 text-right font-mono text-sm text-ink">
                    {formatNaira(c.amount)}
                  </td>
                  <td className="py-2.5 text-right">
                    <Badge variant="available">Confirmed</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}