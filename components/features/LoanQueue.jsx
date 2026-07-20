'use client';

import { useEffect, useState } from 'react';
import { Check, X, HandCoins, CircleCheckBig } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const STATUS_ORDER = { requested: 0, approved: 1, disbursed: 2, cleared: 3, rejected: 4 };
const BADGE_VARIANT = {
  requested: 'pending',
  approved: 'pending',
  disbursed: 'available',
  cleared: 'used',
  rejected: 'suspended',
};

function defaultDueDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

export default function LoanQueue() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [dueDates, setDueDates] = useState({});

  async function loadLoans() {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('loans')
      .select('id, principal, status, due_date, created_at, profiles(full_name, cooperative_id)')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const sorted = [...(data ?? [])].sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      );
      setLoans(sorted);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadLoans();
  }, []);

  async function updateLoan(id, fields) {
    setError('');
    setBusyId(id);
    const supabase = createClient();
    const { error: updateError } = await supabase.from('loans').update(fields).eq('id', id);
    setBusyId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadLoans();
  }

  const openCount = loans.filter((l) => ['requested', 'approved'].includes(l.status)).length;

  return (
    <div className=" rounded-sm border border-rule bg-parchment-soft p-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">
          Loans{openCount > 0 && <span className="text-brass"> — {openCount} need action</span>}
        </h2>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Approve requests, disburse funds, and mark loans cleared once repaid.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 font-body text-sm text-ink-muted">Loading…</p>
      ) : loans.length === 0 ? (
        <p className="mt-6 font-body text-sm text-ink-muted">No loan requests yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-rule">
          {loans.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-medium text-ink">
                  {l.profiles?.full_name}
                </p>
                <p className="font-mono text-xs text-ink-muted">{l.profiles?.cooperative_id}</p>
              </div>

              <div className="tabular font-mono text-sm text-ink">{formatNaira(l.principal)}</div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={BADGE_VARIANT[l.status]}>{l.status}</Badge>

                {l.status === 'requested' && (
                  <>
                    <Button
                      variant="primary"
                      className="px-3 py-1.5 text-xs"
                      loading={busyId === l.id}
                      onClick={() => updateLoan(l.id, { status: 'approved' })}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-3 py-1.5 text-xs text-brick hover:bg-brick/5"
                      loading={busyId === l.id}
                      onClick={() => updateLoan(l.id, { status: 'rejected' })}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Reject
                    </Button>
                  </>
                )}

                {l.status === 'approved' && (
                  <>
                    <input
                      type="date"
                      value={dueDates[l.id] ?? defaultDueDate()}
                      onChange={(e) =>
                        setDueDates((d) => ({ ...d, [l.id]: e.target.value }))
                      }
                      className="rounded-sm border border-rule bg-parchment px-2 py-1.5 font-mono text-xs text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                    />
                    <Button
                      variant="primary"
                      className="px-3 py-1.5 text-xs"
                      loading={busyId === l.id}
                      onClick={() =>
                        updateLoan(l.id, {
                          status: 'disbursed',
                          due_date: dueDates[l.id] ?? defaultDueDate(),
                        })
                      }
                    >
                      <HandCoins className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Disburse
                    </Button>
                  </>
                )}

                {l.status === 'disbursed' && (
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    loading={busyId === l.id}
                    onClick={() => updateLoan(l.id, { status: 'cleared' })}
                  >
                    <CircleCheckBig className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Mark cleared
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}