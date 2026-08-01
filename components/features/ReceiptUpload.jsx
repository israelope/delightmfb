'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Upload, Clock, Check, X, Receipt } from 'lucide-react';
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
  const searchParams = useSearchParams();
  const preselectCommunity = searchParams?.get('community');

  const [hasLoan, setHasLoan] = useState(false);
  const [goals, setGoals] = useState([]);
  const [communityGoals, setCommunityGoals] = useState([]);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsMonth, setSavingsMonth] = useState(currentMonth());
  const [loanAmount, setLoanAmount] = useState('');
  const [goalAmounts, setGoalAmounts] = useState({});
  const [communityAmounts, setCommunityAmounts] = useState({});
  const [pendingFile, setPendingFile] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: loanRows }, { data: goalRows }, { data: types }, { data: community }, { data: receiptData }] =
      await Promise.all([
        supabase.from('loan_balances').select('loan_id').eq('user_id', userId).eq('status', 'disbursed'),
        supabase.from('member_product_goals').select('*').eq('user_id', userId).eq('status', 'active'),
        supabase.from('product_types').select('id, name'),
        supabase.from('community_goals').select('*').eq('status', 'active'),
        supabase
          .from('contribution_receipts')
          .select('id, month_logged, amount, status, created_at, goal_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

    setHasLoan((loanRows ?? []).length > 0);

    const nameById = {};
    (types ?? []).forEach((t) => {
      nameById[t.id] = t.name;
    });
    setGoals((goalRows ?? []).map((g) => ({ ...g, displayName: g.custom_name ?? nameById[g.product_type_id] ?? 'Goal' })));
    setCommunityGoals(community ?? []);
    setReceipts(receiptData ?? []);

    if (preselectCommunity) {
      setCommunityAmounts((prev) => ({ ...prev, [preselectCommunity]: prev[preselectCommunity] ?? '' }));
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const total =
    (Number(savingsAmount) || 0) +
    (Number(loanAmount) || 0) +
    Object.values(goalAmounts).reduce((s, v) => s + (Number(v) || 0), 0) +
    Object.values(communityAmounts).reduce((s, v) => s + (Number(v) || 0), 0);

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
    if (total <= 0) {
      setError('Enter an amount in at least one box below.');
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

      const { data: receiptRow, error: insertError } = await supabase
        .from('contribution_receipts')
        .insert({ user_id: userId, amount: total, file_path: path })
        .select('id')
        .single();
      if (insertError) throw insertError;

      const allocations = [];
      if (Number(savingsAmount) > 0) {
        allocations.push({
          receipt_id: receiptRow.id,
          target: 'savings',
          amount: Number(savingsAmount),
          month_logged: savingsMonth,
        });
      }
      if (Number(loanAmount) > 0) {
        allocations.push({ receipt_id: receiptRow.id, target: 'loan', amount: Number(loanAmount) });
      }
      Object.entries(goalAmounts).forEach(([goalId, amount]) => {
        if (Number(amount) > 0) {
          allocations.push({ receipt_id: receiptRow.id, target: 'goal', goal_id: goalId, amount: Number(amount) });
        }
      });
      Object.entries(communityAmounts).forEach(([communityGoalId, amount]) => {
        if (Number(amount) > 0) {
          allocations.push({
            receipt_id: receiptRow.id,
            target: 'community',
            community_goal_id: communityGoalId,
            amount: Number(amount),
          });
        }
      });

      if (allocations.length > 0) {
        const { error: allocError } = await supabase.from('receipt_allocations').insert(allocations);
        if (allocError) throw allocError;
      }

      setPendingFile(null);
      setSavingsAmount('');
      setLoanAmount('');
      setGoalAmounts({});
      setCommunityAmounts({});
      setSuccess(true);
      await loadData();
    } catch (err) {
      setError(err.message ?? 'Could not upload that receipt. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <p className="font-body text-sm text-ink-muted">Loading…</p>;
  }

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center gap-2">
        <Receipt className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
        <h2 className="font-display text-lg font-semibold text-ink">Upload a payment receipt</h2>
      </div>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Enter how much of your payment goes toward each thing below — savings, your loan, and
        any goals. Your admin reviews this before it's applied.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
              To savings
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="₦0.00"
              value={savingsAmount}
              onChange={(e) => setSavingsAmount(e.target.value)}
              className="w-32 rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
            />
          </label>
          {Number(savingsAmount) > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                For month
              </span>
              <input
                type="month"
                value={savingsMonth}
                onChange={(e) => setSavingsMonth(e.target.value)}
                className="rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
              />
            </label>
          )}

          {hasLoan && (
            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                To loan repayment
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="₦0.00"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="w-32 rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
              />
            </label>
          )}
        </div>

        {goals.length > 0 && (
          <div>
            <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
              To a product goal
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {goals.map((g) => (
                <label key={g.id} className="flex flex-col gap-1.5">
                  <span className="font-body text-xs text-ink-muted">{g.displayName}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="₦0.00"
                    value={goalAmounts[g.id] ?? ''}
                    onChange={(e) => setGoalAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    className="w-32 rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {communityGoals.length > 0 && (
          <div>
            <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
              To a community goal
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {communityGoals.map((g) => (
                <label key={g.id} className="flex flex-col gap-1.5">
                  <span className="font-body text-xs text-ink-muted">{g.name}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="₦0.00"
                    value={communityAmounts[g.id] ?? ''}
                    onChange={(e) => setCommunityAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    className="w-32 rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-4">
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
            {pendingFile ? pendingFile.name : 'Choose receipt file'}
          </label>

          <p className="font-body text-sm text-ink-muted">
            Total: <span className="font-mono font-medium text-ink">{formatNaira(total)}</span>
          </p>

          <button
            type="submit"
            disabled={uploading || total <= 0}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-cooperative px-4 py-2 font-body text-sm font-medium text-parchment-soft transition-colors hover:bg-cooperative-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" strokeWidth={2.25} />
            {uploading ? 'Uploading…' : 'Submit receipt'}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-3 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-sm bg-cooperative/10 px-3 py-2 font-body text-sm text-cooperative-dark">
          Receipt submitted — an admin will review and apply it shortly.
        </p>
      )}

      {receipts.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-rule pt-4">
          {receipts.map((r) => {
            const Icon = STATUS_ICON[r.status];
            return (
              <li key={r.id} className="flex items-center justify-between">
                <span className="font-mono text-sm text-ink-muted">
                  {formatDate(r.created_at)}
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

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}