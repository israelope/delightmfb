'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

export default function PassbookLedgerTable({ rows }) {
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((c) => {
      const monthName = new Date(c.date).toLocaleDateString('en-NG', {
        month: 'long',
        year: 'numeric',
      });
      return (
        c.month_logged?.toLowerCase().includes(term) ||
        monthName.toLowerCase().includes(term)
      );
    });
  }, [rows, search]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder="Search by month, e.g. July or 2026-07…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-sm border border-rule bg-parchment py-2.5 pl-9 pr-3 font-body text-sm text-ink placeholder:text-ink-muted/60 focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
        />
      </div>

      {filteredRows.length === 0 ? (
        <p className="mt-6 font-body text-sm text-ink-muted">
          {rows.length === 0 ? 'Nothing logged yet — check back after your next contribution.' : 'No contributions match that search.'}
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