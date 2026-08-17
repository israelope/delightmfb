'use client';

import { useEffect, useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNaira } from '@/lib/utils';
import Button from '@/components/ui/Button';
import FormattedNumberInput from '@/components/ui/FormattedNumberInput';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

export default function AdminCommunityGoals() {
  const [goals, setGoals] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase.from('community_goals').select('*').order('created_at', { ascending: false });
    if (fetchError) setError(fetchError.message);
    setGoals(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createGoal() {
    if (!name.trim() || !target || Number(target) <= 0) {
      setError('Enter a name and a target amount.');
      return;
    }
    setCreating(true);
    setError('');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from('community_goals').insert({
      name: name.trim(),
      description: description.trim() || null,
      target_amount: Number(target),
      created_by: user?.id,
    });
    setCreating(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setName('');
    setDescription('');
    setTarget('');
    await load();
  }

  async function closeGoal(id) {
    setClosingId(id);
    const supabase = createClient();
    await supabase.from('community_goals').update({ status: 'closed' }).eq('id', id);
    setClosingId(null);
    await load();
  }

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
        <h2 className="font-display text-lg font-semibold text-ink">Community Goals</h2>
      </div>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Joint targets visible to every member, with a progress bar everyone can see grow.
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3 border-b border-rule pb-5">
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs text-ink-muted">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-44 rounded-sm border border-rule bg-parchment px-3 py-1.5 font-body text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs text-ink-muted">Description (optional)</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-56 rounded-sm border border-rule bg-parchment px-3 py-1.5 font-body text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs text-ink-muted">Target</span>
          <FormattedNumberInput
            min="1"
            step="0.01"
            value={target}
            onChange={setTarget}
            className="w-32 rounded-sm border border-rule bg-parchment px-3 py-1.5 font-mono text-sm text-ink focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
          />
        </label>
        <Button variant="primary" className="px-3 py-1.5 text-xs" loading={creating} onClick={createGoal}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Create
        </Button>
      </div>

      {loading ? (
        <p className="mt-4 font-body text-sm text-ink-muted">Loading…</p>
      ) : goals.length === 0 ? (
        <p className="mt-4 font-body text-sm text-ink-muted">No community goals yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {goals.map((g) => {
            const pct = g.target_amount > 0 ? Math.min(100, Math.round((g.amount_raised / g.target_amount) * 100)) : 0;
            return (
              <li key={g.id} className="rounded-sm border border-rule bg-parchment px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-body text-sm font-medium text-ink">{g.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={g.status === 'active' ? 'pending' : g.status === 'completed' ? 'available' : 'used'}>
                      {g.status}
                    </Badge>
                    {g.status === 'active' && (
                      <Button variant="ghost" className="px-2.5 py-1 text-xs" loading={closingId === g.id} onClick={() => closeGoal(g.id)}>
                        Close
                      </Button>
                    )}
                  </div>
                </div>
                <p className="tabular mt-1 font-mono text-xs text-ink-muted">
                  {formatNaira(g.amount_raised)} of {formatNaira(g.target_amount)}
                </p>
                <ProgressBar value={pct} className="mt-2" />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}