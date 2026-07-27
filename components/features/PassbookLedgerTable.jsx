'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

const PAGE_SIZE = 10;

// month_logged is stored as "YYYY-MM" — the month the contribution is
// FOR, which can differ from the date it was actually logged on (e.g. a
// May contribution entered in July). Always derive the human-readable
// month name from month_logged, never from `date`.
function monthLabel(monthLogged) {
  const [year, month] = monthLogged.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-NG', {
    month: 'long',
    year: 'numeric',
  });
}

export default function PassbookLedgerTable({ rows }) {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((c) => {
      const label = monthLabel(c.month_logged).toLowerCase();
      return c.month_logged?.toLowerCase().includes(term) || label.includes(term);
    });
  }, [rows, search]);

  const isSearching = search.trim().length > 0;
  const visibleRows = isSearching ? filteredRows : filteredRows.slice(0, visibleCount);

  function handleSearchChange(value) {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div>
      <div className="relative ">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
  type="month"
  value={search}
  onChange={(e) => handleSearchChange(e.target.value)}
  className="w-full rounded-sm border border-rule bg-parchment px-3 py-2.5 font-body text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
/>
      </div>

      {filteredRows.length === 0 ? (
        <p className="mt-6 font-body text-sm text-ink-muted">
          {rows.length === 0
            ? 'Nothing logged yet — check back after your next contribution.'
            : 'No contributions match that search.'}
        </p>
      ) : (
        <>
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
                {visibleRows.map((c) => (
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
          {!isSearching && filteredRows.length > visibleCount && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-3 font-body text-xs font-medium text-cooperative hover:underline"
            >
              Show 10 more ({filteredRows.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}