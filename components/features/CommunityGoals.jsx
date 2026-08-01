import Link from 'next/link';
import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatNaira } from '@/lib/utils';
import ProgressBar from '@/components/ui/ProgressBar';

export default async function CommunityGoals() {
  const supabase = await createClient();
  const { data: goals } = await supabase
    .from('community_goals')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (!goals || goals.length === 0) return null;

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
        <h2 className="font-display text-lg font-semibold text-ink">Community Goals</h2>
      </div>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Joint targets the whole cooperative is working toward together.
      </p>

      <ul className="mt-4 space-y-4">
        {goals.map((g) => {
          const pct = g.target_amount > 0 ? Math.min(100, Math.round((g.amount_raised / g.target_amount) * 100)) : 0;
          return (
            <li key={g.id} className="rounded-sm border border-rule bg-parchment px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-body text-sm font-medium text-ink">{g.name}</p>
                <span className="tabular font-mono text-xs text-ink-muted">
                  {formatNaira(g.amount_raised)} / {formatNaira(g.target_amount)}
                </span>
              </div>
              {g.description && <p className="mt-1 font-body text-xs text-ink-muted">{g.description}</p>}
              <ProgressBar value={pct} className="mt-2" />
              <Link
                href={`/member/payments?community=${g.id}`}
                className="mt-2 inline-block font-body text-xs font-medium text-cooperative hover:underline"
              >
                Want to contribute? Add your donation →
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}