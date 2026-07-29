'use client';

import { useEffect, useState } from 'react';
import { Receipt, Upload, Clock, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { prepareUploadFile } from '@/lib/fileUpload';
import { formatNaira } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const STATUS_BADGE = { pending: 'pending', processed: 'available', rejected: 'suspended' };
const STATUS_ICON = { pending: Clock, processed: Check, rejected: X };

export default function ReceiptUpload({ userId }) {
  const [mode, setMode] = useState('general'); // 'general' | 'goal'
  const [month, setMonth] = useState(currentMonth());
  const [goals, setGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [amount, setAmount] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: receiptData }, { data: goalRows }, { data: types }] = await Promise.all([
      supabase
        .from('contribution_receipts')
        .select('id, month_logged, amount, status, created_at, goal_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('member_product_goals')
        .select('id, product_type_id')
        .eq('user_id', userId)
        .eq('status', 'active'),
      supabase.from('product_types').select('id, name'),
    ]);

    const nameById = {};
    (types ?? []).forEach((t) => {
      nameById[t.id] = t.name;
    });
    const goalsWithNames = (goalRows ?? []).map((g) => ({ ...g, name: nameById[g.product_type_id] ?? g.product_type_id }));

    setGoals(goalsWithNames);
    setReceipts(receiptData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setPendingFile(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pendingFile) {
      setError('Choose a receipt file first.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Enter how much you paid.');
      return;
    }
    if (mode === 'goal' && !selectedGoalId) {
      setError('Choose which product this payment is for.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const prepared = await prepareUploadFile(pendingFile);
      const supabase = createClient();
      const ext = pendingFile.type === 'application/pdf' ? 'pdf' : 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(path, prepared, { contentType: prepared.type || pendingFile.type });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('contribution_receipts').insert({
        user_id: userId,
        month_logged: mode === 'general' ? month : null,
        goal_id: mode === 'goal' ? selectedGoalId : null,
        amount: Number(amount),
        file_path: path,
      });

      if (insertError) throw insertError;

      setPendingFile(null);
      setAmount('');
      await loadData();
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
        Made a payment and want your admin notified? Upload the receipt and enter the amount you
        paid.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setMode('general')}
          className={`rounded-full border px-3 py-1.5 font-body text-xs font-medium transition-colors ${
            mode === 'general'
              ? 'border-cooperative bg-cooperative text-parchment-soft'
              : 'border-rule bg-parchment text-ink-muted hover:border-cooperative hover:text-cooperative'
          }`}
        >
          General savings
        </button>
        <button
          onClick={() => setMode('goal')}
          disabled={goals.length === 0}
          className={`rounded-full border px-3 py-1.5 font-body text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            mode === 'goal'
              ? 'border-cooperative bg-cooperative text-parchment-soft'
              : 'border-rule bg-parchment text-ink-muted hover:border-cooperative hover:text-cooperative'
          }`}
        >
          Product goal
        </button>
      </div>
      {mode === 'goal' && goals.length === 0 && (
        <p className="mt-2 font-body text-xs text-ink-muted">
          You don't have any active product goals yet — start one on the Products page first.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        {mode === 'general' ? (
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
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
              Product
            </span>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="rounded-sm border border-rule bg-parchment px-3 py-2 font-body text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
            >
              <option value="">Select…</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
            Amount paid
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="₦0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-36 rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
          />
        </label>

        <label
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-rule px-3 py-2 font-body text-sm font-medium text-ink transition-colors hover:border-cooperative hover:text-cooperative ${
            uploading ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          {pendingFile ? pendingFile.name : 'Choose file'}
        </label>

        <button
          type="submit"
          disabled={uploading}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-cooperative px-4 py-2 font-body text-sm font-medium text-parchment-soft transition-colors hover:bg-cooperative-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="h-4 w-4" strokeWidth={2.25} />
          {uploading ? 'Uploading…' : 'Submit receipt'}
        </button>
      </form>

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
                <span className="font-mono text-sm text-ink-muted">
                  {r.goal_id ? 'Product goal' : r.month_logged}
                  {r.amount != null && <span className="ml-2 text-ink">{formatNaira(r.amount)}</span>}
                </span>
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
