import { cn } from '@/lib/utils';

const VARIANTS = {
  available: 'bg-cooperative/10 text-cooperative-dark',
  used: 'bg-ink/10 text-ink-muted',
  pending: 'bg-brass/15 text-brass',
  suspended: 'bg-brick/10 text-brick',
};

export default function Badge({ children, variant = 'used', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
