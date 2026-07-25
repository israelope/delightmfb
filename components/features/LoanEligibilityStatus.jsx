'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ProgressBar from '@/components/ui/ProgressBar';

export default function LoanEligibilityStatus({ userId, onChange }) {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.rpc('get_loan_eligibility', { p_user_id: userId });
      const row = Array.isArray(data) ? data[0] : data;
      setEligibility(row ?? null);
      onChange?.(row ?? null);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return <p className="font-body text-sm text-ink-muted">Checking eligibility…</p>;
  }
  if (!eligibility) return null;

  const { required_months, months_met, is_eligible } = eligibility;
  const pct = Math.min(100, Math.round((months_met / required_months) * 100));

  return (
    <div className="rounded-sm border border-rule bg-parchment px-4 py-3">
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-4 w-4 text-cooperative" strokeWidth={1.75} />
        <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
          Contribution streak
        </p>
      </div>
      <p className="mt-2 font-display text-lg font-semibold text-ink">
        {months_met} / {required_months} consecutive months
      </p>
      <ProgressBar value={pct} className="mt-2" />
      <p className="mt-2 font-body text-xs text-ink-muted">
        {is_eligible
          ? 'You meet the contribution requirement for a loan.'
          : `Keep contributing every month — you need ${required_months} in a row, without a gap, ending last month.`}
      </p>
    </div>
  );
}
