'use client';

import { useEffect, useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

export default function ProductGoalsList({ userId, onChange }) {
  const [productTypes, setProductTypes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [targets, setTargets] = useState({}); // product_type_id -> string amount being typed
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: types }, { data: goalRows }] = await Promise.all([
      supabase.from('product_types').select('*').order('sort_order'),
      supabase.from('member_product_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    setProductTypes(types ?? []);
    setGoals(goalRows ?? []);
    onChange?.(goalRows ?? []);

    // Pre-fill target inputs with each product's default.
    const initialTargets = {};
    (types ?? []).forEach((t) => {
      initialTargets[t.id] = String(t.default_target);
    });
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
    const { error: insertError } = await supabase.from('member_product_goals').insert({
      user_id: userId,
      product_type_id: productTypeId,
      target_amount: amount,
    });
    setBusyId(null);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await loadData();
  }

  const goalsByProduct = {};
  goals.forEach((g) => {
    if (!goalsByProduct[g.product_type_id]) goalsByProduct[g.product_type_id] = [];
    goalsByProduct[g.product_type_id].push(g);
  });

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

      {productTypes.map((product) => {
        const productGoals = goalsByProduct[product.id] ?? [];
        const activeGoal = productGoals.find((g) => g.status === 'active');

        return (
          <div key={product.id} className="rounded-sm border border-rule bg-parchment-soft p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">{product.name}</h3>
                <p className="font-body text-xs text-ink-muted">
                  Default target: {formatNaira(product.default_target)}
                </p>
              </div>

              {!activeGoal && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={targets[product.id] ?? ''}
                    onChange={(e) => setTargets((prev) => ({ ...prev, [product.id]: e.target.value }))}
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
                {productGoals.map((g) => {
                  const pct = g.target_amount > 0 ? Math.min(100, Math.round((g.amount_saved / g.target_amount) * 100)) : 0;
                  return (
                    <li key={g.id}>
                      <div className="flex items-center justify-between">
                        <span className="tabular font-mono text-xs text-ink-muted">
                          {formatNaira(g.amount_saved)} of {formatNaira(g.target_amount)}
                        </span>
                        {g.status === 'completed' ? (
                          <Badge variant="available">
                            <CheckCircle2 className="mr-1 inline h-3 w-3" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="pending">{pct}%</Badge>
                        )}
                      </div>
                      <ProgressBar value={pct} className="mt-1.5" />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
