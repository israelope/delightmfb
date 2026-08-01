import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import ReceiptUpload from '@/components/features/ReceiptUpload';

export default async function MemberPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Payments</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Upload a receipt and tell us where it goes — savings, your loan, or any of your goals,
        all in one place.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="font-body text-sm text-ink-muted">Loading…</p>}>
          <ReceiptUpload userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}