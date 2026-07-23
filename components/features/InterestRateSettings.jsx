'use client';

import { useEffect, useState } from 'react';
import { Percent, Save, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function InterestRateSettings() {
  const [rate, setRate] = useState('');
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('cooperative_settings')
        .select('default_interest_rate')
        .eq('id', 1)
        .single();
      setRate(String(data?.default_interest_rate ?? 0));
      setSaved(data?.default_interest_rate ?? 0);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    setNotice('');
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('cooperative_settings')
      .update({ default_interest_rate: Number(rate) })
      .eq('id', 1);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(Number(rate));
    setNotice('Saved. This rate applies to new loan requests from now on.');
  }

  const dirty = Number(rate) !== saved;

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Default interest rate</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Applied automatically when a member requests a loan. You can still adjust the rate
            per loan before disbursement.
          </p>
        </div>
        <Percent className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
      </div>

      {loading ? (
        <p className="mt-4 font-body text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
              Rate (%)
            </span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-28 rounded-sm border border-rule bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
            />
          </label>
          <Button
            variant="primary"
            className="px-3 py-2 text-xs"
            loading={saving}
            disabled={!dirty}
            onClick={handleSave}
          >
            <Save className="h-3.5 w-3.5" strokeWidth={2.25} />
            Save
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 flex items-center gap-1.5 rounded-sm bg-cooperative/10 px-3 py-2 font-body text-sm text-cooperative-dark">
          <Check className="h-4 w-4" />
          {notice}
        </p>
      )}
    </div>
  );
}
