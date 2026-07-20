'use client';

import { useEffect, useState } from 'react';
import { Check, Ban, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const STATUS_ORDER = { pending: 0, active: 1, suspended: 2 };
const BADGE_VARIANT = { pending: 'pending', active: 'available', suspended: 'suspended' };

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function loadMembers() {
    setLoading(true);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, email, cooperative_id, role, status, created_at')
      .order('created_at', { ascending: false });

    if (!fetchError) {
      const sorted = [...(data ?? [])].sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      );
      setMembers(sorted);
    } else {
      setError(fetchError.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function updateStatus(id, status) {
    setError('');
    setBusyId(id);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id);

    setBusyId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadMembers();
  }

  const pendingCount = members.filter((m) => m.status === 'pending').length;

  return (
    <div className="mt-8 rounded-sm border border-rule bg-parchment-soft p-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">
          Members{pendingCount > 0 && <span className="text-brass"> — {pendingCount} awaiting review</span>}
        </h2>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Approve against the physical records, or suspend an existing account.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 font-body text-sm text-ink-muted">Loading…</p>
      ) : members.length === 0 ? (
        <p className="mt-6 font-body text-sm text-ink-muted">No members yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-rule">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-medium text-ink">
                  {m.full_name}
                  {m.role === 'admin' && (
                    <span className="ml-2 font-mono text-[11px] uppercase tracking-wide text-brass">
                      admin
                    </span>
                  )}
                </p>
                <p className="font-mono text-xs text-ink-muted">{m.cooperative_id}</p>
                <p className="truncate font-body text-xs text-ink-muted">{m.email}</p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={BADGE_VARIANT[m.status]}>{m.status}</Badge>

                {m.status === 'pending' && (
                  <Button
                    variant="primary"
                    className="px-3 py-1.5 text-xs"
                    loading={busyId === m.id}
                    onClick={() => updateStatus(m.id, 'active')}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Approve
                  </Button>
                )}

                {m.status === 'active' && m.role !== 'admin' && (
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-xs text-brick hover:bg-brick/5"
                    loading={busyId === m.id}
                    onClick={() => updateStatus(m.id, 'suspended')}
                  >
                    <Ban className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Suspend
                  </Button>
                )}

                {m.status === 'suspended' && (
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    loading={busyId === m.id}
                    onClick={() => updateStatus(m.id, 'active')}
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Reactivate
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