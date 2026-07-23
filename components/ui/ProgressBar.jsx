import { cn } from '@/lib/utils';

export default function ProgressBar({ value, className }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-rule', className)}>
      <div
        className="h-full rounded-full bg-cooperative transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
