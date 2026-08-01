import ProductTargetSettings from '@/components/features/ProductTargetSettings';
import AdminProductGoalsEditor from '@/components/features/AdminProductGoalsEditor';
import AdminCommunityGoals from '@/components/features/AdminCommunityGoals';

export default function AdminProductGoalsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Product Savings</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Manage default targets, log offline payments, and run community goals.
      </p>
      <div className="mt-6 space-y-6">
        <ProductTargetSettings />
        <AdminProductGoalsEditor />
        <AdminCommunityGoals />
      </div>
    </div>
  );
}