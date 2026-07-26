import PendingReceipts from '@/components/features/PendingReceipts';

export default function AdminReceiptsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Payment Receipts</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Review receipts members have uploaded and apply them to savings or a loan.
      </p>
      <div className="mt-6">
        <PendingReceipts />
      </div>
    </div>
  );
}