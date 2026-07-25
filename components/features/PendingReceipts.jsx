'use client';

import { useEffect, useState } from 'react';
import { Receipt, Eye, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function PendingReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function loadReceipts() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: receiptData, error: fetchError }, { data: profiles }] = await Promise.all([
      supabase
        .from('contribution_receipts')
        .select('id, user_id, month_logged, file_path, status, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, cooperative_id'),
    ]);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const map = {};
    (profiles ?? []).forEach((p) => {
      map[p.id] = p;
    });
    setProfilesById(map);
    setReceipts(receiptData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadReceipts();
  }, []);

  async function viewReceipt(filePath) {
    const supabase = createClient();
    const { data: signed, error: signError } = await supabase.storage
      .from('payment-receipts')
      .createSignedUrl(filePath, 60);

    if (signError || !signed) {
      setError('Could not open the receipt.');
      return;
    }
    window.open(signed.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function updateStatus(id, status) {
    setError('');
    setBusyId(id);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from('contribution_receipts')
      .update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    setBusyId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadReceipts();
  }

  const pending = receipts.filter((r) => r.status === 'pending');

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center gap-2">
        <Receipt className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
        <h2 className="font-display text-lg font-semibold text-ink">
          Payment receipts{pending.length > 0 && <span className="text-brass"> — {pending.length} pending</span>}
        </h2>
      </div>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Members upload these when they've paid and want you to log it. View the receipt, then
        log the contribution as usual and mark it processed.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 font-body text-sm text-ink-muted">Loading…</p>
      ) : receipts.length === 0 ? (
        <p className="mt-6 font-body text-sm text-ink-muted">No receipts uploaded yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-rule">
          {receipts.map((r) => {
            const profile = profilesById[r.user_id];
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-body text-sm font-medium text-ink">{profile?.full_name}</p>
                  <p className="font-mono text-xs text-ink-muted">
                    {r.month_logged} · uploaded {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      r.status === 'pending' ? 'pending' : r.status === 'processed' ? 'available' : 'suspended'
                    }
                  >
                    {r.status}
                  </Badge>
                  <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => viewReceipt(r.file_path)}>
                    <Eye className="h-3.5 w-3.5" strokeWidth={2.25} />
                    View
                  </Button>
                  {r.status === 'pending' && (
                    <>
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        loading={busyId === r.id}
                        onClick={() => updateStatus(r.id, 'processed')}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Mark processed
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-3 py-1.5 text-xs text-brick hover:bg-brick/5"
                        loading={busyId === r.id}
                        onClick={() => updateStatus(r.id, 'rejected')}
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
