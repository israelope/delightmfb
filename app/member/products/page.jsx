import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProductGoalsChart from '@/components/features/ProductGoalsChart';
import ProductGoalsList from '@/components/features/ProductGoalsList';
import ReceiptUpload from '@/components/features/ReceiptUpload';

export default async function MemberProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Products</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Save toward a specific goal — education, land, festive celebrations, and more.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductGoalsList userId={user.id} />
        </div>
        <div className="rounded-sm border border-rule bg-parchment-soft p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Your Distribution</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">Saved so far, by product.</p>
          <div className="mt-4">
            <ProductGoalsChart userId={user.id} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ReceiptUpload userId={user.id} />
      </div>
    </div>
  );
}
