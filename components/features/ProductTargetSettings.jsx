'use client';

import { useEffect, useState } from 'react';
import { Save, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function ProductTargetSettings() {
  const [products, setProducts] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('product_types')
      .select('*')
      .order('sort_order');
    if (fetchError) setError(fetchError.message);
    setProducts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(product) {
    const value = Number(edits[product.id] ?? product.default_target);
    setBusyId(product.id);
    setError('');
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('product_types')
      .update({ default_target: value })
      .eq('id', product.id);
    setBusyId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await load();
  }

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
        <h2 className="font-display text-lg font-semibold text-ink">Default targets</h2>
      </div>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Suggested target shown to members when they start saving toward a product. They can
        still set their own amount.
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-4 font-body text-sm text-ink-muted">Loading…</p>
      ) : (
        <ul className="mt-4 divide-y divide-rule">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="font-body text-sm text-ink">{p.name}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={edits[p.id] ?? p.default_target}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="w-32 rounded-sm border border-rule bg-parchment px-3 py-1.5 text-right font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
                />
                <Button
                  variant="secondary"
                  className="px-2.5 py-1.5 text-xs"
                  loading={busyId === p.id}
                  onClick={() => save(p)}
                >
                  <Save className="h-3.5 w-3.5" strokeWidth={2.25} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
