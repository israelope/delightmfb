import { BookMarked } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatNaira } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

export default async function Passbook({ userId }) {
  const supabase = await createClient();

  const { data: contributions, error } = await supabase
    .from('contributions')
    .select('id, amount, date, month_logged')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    return (
      <p role="alert" className="mt-8 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
        Could not load your passbook: {error.message}
      </p>
    );
  }

  const rows = contributions ?? [];
  const totalSaved = rows.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="mt-8 space-y-6">
      {/* Wallet card */}
      <div className="rounded-sm border border-rule bg-cooperative p-6 text-parchment-soft">
        <div className="flex items-center justify-between">
          <p className="font-body text-xs font-medium uppercase tracking-wider text-parchment-soft/70">
            Total contributions to date
          </p>
          <BookMarked className="h-5 w-5 text-brass" strokeWidth={1.75} />
        </div>
        <p className="tabular mt-3 font-display text-3xl font-semibold">{formatNaira(totalSaved)}</p>
        <p className="mt-1 font-body text-xs text-parchment-soft/70">
          Across {rows.length} logged contribution{rows.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Ledger */}
      <div className="rounded-sm border border-rule bg-parchment-soft p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Your passbook</h2>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Every contribution your admin has logged on your behalf.
        </p>

        {rows.length === 0 ? (
          <p className="mt-6 font-body text-sm text-ink-muted">
            Nothing logged yet — check back after your next contribution.
          </p>
        ) : (
          <div className=" overflow-x-auto">
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
                {rows.map((c) => (
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
    </div>
  );
}