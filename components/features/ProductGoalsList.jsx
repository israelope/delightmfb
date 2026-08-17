'use client';

import { useEffect, useState } from 'react';
import { Plus, CheckCircle2, XCircle, Clock3, PlusCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import FormattedNumberInput from '@/components/ui/FormattedNumberInput';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

const HISTORY_BADGE = { completed: 'available', cancelled: 'suspended', expired: 'used' };
const HISTORY_ICON = { completed: CheckCircle2, cancelled: XCircle, expired: Clock3 };

export default function ProductGoalsList({ userId, onChange }) {
  const [productTypes, setProductTypes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [targets, setTargets] = useState({});
  const [customName, setCustomName] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [customDeadline, setCustomDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    await supabase.rpc('finalize_expired_goals', { p_user_id: userId });

    const [{ data: types }, { data: goalRows }] = await Promise.all([
      supabase.from('product_types').select('*').order('sort_order'),
      supabase.from('member_product_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    setProductTypes(types ?? []);
    setGoals(goalRows ?? []);
    onChange?.(goalRows ?? []);

    const initialTargets = {};
    (types ?? []).forEach((t) => (initialTargets[t.id] = String(t.default_target)));
    setTargets((prev) => ({ ...initialTargets, ...prev }));

    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function startGoal(productTypeId) {
    const amount = Number(targets[productTypeId]);
    if (!amount || amount <= 0) {
      setError('Enter a target amount before starting.');
      return;
    }
    setError('');
    setBusyId(productTypeId);
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from('member_product_goals')
      .insert({ user_id: userId, product_type_id: productTypeId, target_amount: amount });
    setBusyId(null);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await loadData();
  }

  async function startCustomGoal() {
    if (!customName.trim()) {
      setError('Give your custom goal a name.');
      return;
    }
    if (!customTarget || Number(customTarget) <= 0) {
      setError('Enter a target amount for your custom goal.');
      return;
    }
    setError('');
    setBusyId('custom');
    const supabase = createClient();
    const { error: insertError } = await supabase.from('member_product_goals').insert({
      user_id: userId,
      custom_name: customName.trim(),
      target_amount: Number(customTarget),
      target_date: customDeadline || null,
    });
    setBusyId(null);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setCustomName('');
    setCustomTarget('');
    setCustomDeadline('');
    await loadData();
  }

  async function cancelGoal(goal) {
    const confirmed = window.confirm(
      goal.amount_saved > 0
        ? `Cancel this goal? The ${formatNaira(goal.amount_saved)} you've saved so far will move into your regular savings.`
        : 'Cancel this goal? No amount has been saved toward it yet.'
    );
    if (!confirmed) return;

    setBusyId(goal.id);
    setError('');
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('cancel_product_goal', { p_goal_id: goal.id });
    setBusyId(null);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    await loadData();
  }

  const activeGoals = goals.filter((g) => g.status === 'active');
  const historyGoals = goals.filter((g) => g.status !== 'active');

  const goalsByProduct = {};
  activeGoals.forEach((g) => {
    if (g.product_type_id) {
      if (!goalsByProduct[g.product_type_id]) goalsByProduct[g.product_type_id] = [];
      goalsByProduct[g.product_type_id].push(g);
    }
  });
  const customActiveGoals = activeGoals.filter((g) => !g.product_type_id);

  if (loading) {
    return <p className="font-body text-sm text-ink-muted">Loading products…</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}

            {customActiveGoals.length > 0 && (
        <div className="rounded-sm border border-rule bg-parchment-soft p-5">
          <h3 className="font-display text-base font-semibold text-ink">Your custom goals</h3>
          <ul className="mt-4 space-y-3">
            {customActiveGoals.map((g) => (
              <GoalRow key={g.id} goal={g} busy={busyId === g.id} onCancel={() => cancelGoal(g)} />
            ))}
          </ul>
        </div>
      )}

      {productTypes.map((product) => {
        const productGoals = goalsByProduct[product.id] ?? [];
        const hasActive = productGoals.length > 0;

        return (
          <div key={product.id} className="rounded-sm border border-rule bg-parchment-soft p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">{product.name}</h3>
                <p className="font-body text-xs text-ink-muted">
                  Default target: {formatNaira(product.default_target)}
                </p>
              </div>

              {!hasActive && (
                <div className="flex items-center gap-2">
                  <FormattedNumberInput
                    min="1"
                    step="0.01"
                    value={targets[product.id] ?? ''}
                    onChange={(val) => setTargets((prev) => ({ ...prev, [product.id]: val }))}
                    className="w-32 rounded-sm border border-rule bg-parchment px-3 py-1.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                  />
                  <Button
                    variant="primary"
                    className="px-3 py-1.5 text-xs"
                    loading={busyId === product.id}
                    onClick={() => startGoal(product.id)}
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Start saving
                  </Button>
                </div>
              )}
            </div>

            {productGoals.length > 0 && (
              <ul className="mt-4 space-y-3">
                {productGoals.map((g) => (
                  <GoalRow key={g.id} goal={g} busy={busyId === g.id} onCancel={() => cancelGoal(g)} />
                ))}
              </ul>
            )}
          </div>
        );
      })}



      {/* Start a custom goal */}
      <div className="rounded-sm border border-dashed border-rule bg-parchment p-5">
        <div className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4 text-cooperative" strokeWidth={1.75} />
          <h3 className="font-display text-base font-semibold text-ink">
            Saving toward something else?
          </h3>
        </div>
        <p className="mt-1 font-body text-xs text-ink-muted">
          Not one of the products above? Create your own goal with a name, target, and optional
          deadline.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-xs text-ink-muted">Goal name</span>
            <input
              type="text"
              placeholder="e.g. Generator"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-40 rounded-sm border border-rule bg-parchment-soft px-3 py-1.5 font-body text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-xs text-ink-muted">Target</span>
            <FormattedNumberInput
              min="1"
              step="0.01"
              value={customTarget}
              onChange={setCustomTarget}
              className="w-32 rounded-sm border border-rule bg-parchment-soft px-3 py-1.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-xs text-ink-muted">Deadline (optional)</span>
            <input
              type="date"
              value={customDeadline}
              onChange={(e) => setCustomDeadline(e.target.value)}
              className="rounded-sm border border-rule bg-parchment-soft px-3 py-1.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
            />
          </label>
          <Button variant="secondary" className="px-3 py-1.5 text-xs" loading={busyId === 'custom'} onClick={startCustomGoal}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Create goal
          </Button>
        </div>
      </div>

      {historyGoals.length > 0 && (
        <div className="rounded-sm border border-rule bg-parchment-soft p-5">
          <h3 className="font-display text-base font-semibold text-ink">History</h3>
          <ul className="mt-3 space-y-2">
            {historyGoals.map((g) => {
              const Icon = HISTORY_ICON[g.status];
              return (
                <li key={g.id} className="flex items-center justify-between rounded-sm border border-rule bg-parchment px-3.5 py-2.5">
                  <div>
                    <p className="font-body text-sm text-ink">{g.custom_name ?? g.product_type_id}</p>
                    <p className="tabular font-mono text-xs text-ink-muted">
                      {formatNaira(g.amount_saved)} of {formatNaira(g.target_amount)}
                    </p>
                  </div>
                  <Badge variant={HISTORY_BADGE[g.status]}>
                    <Icon className="mr-1 inline h-3 w-3" />
                    {g.status}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function GoalRow({ goal, busy, onCancel }) {
  const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.amount_saved / goal.target_amount) * 100)) : 0;
  const isOverdue = goal.target_date && new Date(goal.target_date) < new Date();

  return (
    <li>
      {/* ADDED: Display the custom name if this is a custom goal */}
      {goal.custom_name && (
        <p className="mb-0.5 font-body text-sm font-medium text-ink">
          {goal.custom_name}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <span className="tabular font-mono text-xs text-ink-muted">
          {formatNaira(goal.amount_saved)} of {formatNaira(goal.target_amount)}
          {goal.target_date && (
            <span className={isOverdue ? 'ml-2 text-brick' : 'ml-2'}>
              · {isOverdue ? 'Overdue' : `Due ${formatDate(goal.target_date)}`}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="pending">{pct}%</Badge>
          <Button variant="ghost" className="px-2 py-1 text-xs text-brick hover:bg-brick/5" loading={busy} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
      <ProgressBar value={pct} className="mt-1.5" />
    </li>
  );
}