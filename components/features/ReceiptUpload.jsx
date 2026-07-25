'use client';

import { useEffect, useState } from 'react';
import { Receipt, Upload, Clock, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { prepareUploadFile } from '@/lib/fileUpload';
import Badge from '@/components/ui/Badge';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const STATUS_BADGE = { pending: 'pending', processed: 'available', rejected: 'suspended' };
const STATUS_ICON = { pending: Clock, processed: Check, rejected: X };

export default function ReceiptUpload({ userId }) {
  const [month, setMonth] = useState(currentMonth());
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function loadReceipts() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('contribution_receipts')
      .select('id, month_logged, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    setReceipts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const prepared = await prepareUploadFile(file);
      const supabase = createClient();
      const ext = file.type === 'application/pdf' ? 'pdf' : 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(path, prepared, { contentType: prepared.type || file.type });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('contribution_receipts').insert({
        user_id: userId,
        month_logged: month,
        file_path: path,
      });

      if (insertError) throw insertError;

      await loadReceipts();
    } catch (err) {
      setError(err.message ?? 'Could not upload that receipt. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center gap-2">
        <Receipt className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
        <h2 className="font-display text-lg font-semibold text-ink">Upload a payment receipt</h2>
      </div>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Made a contribution and want your admin notified? Upload the receipt here for the right
        month.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
            Month
          </span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
          />
        </label>

        <label
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-cooperative px-3 py-2 font-body text-sm font-medium text-cooperative transition-colors hover:bg-cooperative/5 ${
            uploading ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFile}
            className="hidden"
            disabled={uploading}
          />
          <Upload className="h-4 w-4" strokeWidth={2.25} />
          {uploading ? 'Uploading…' : 'Upload receipt'}
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}

      {!loading && receipts.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-rule pt-4">
          {receipts.map((r) => {
            const Icon = STATUS_ICON[r.status];
            return (
              <li key={r.id} className="flex items-center justify-between">
                <span className="font-mono text-sm text-ink-muted">{r.month_logged}</span>
                <Badge variant={STATUS_BADGE[r.status]}>
                  <Icon className="mr-1 inline h-3 w-3" />
                  {r.status}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
