import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  primary:
    'bg-cooperative text-parchment-soft hover:bg-cooperative-dark disabled:bg-cooperative/50',
  secondary:
    'bg-transparent text-cooperative border border-cooperative hover:bg-cooperative/5 disabled:opacity-50',
  brass: 'bg-brass-light text-ink hover:bg-brass disabled:bg-brass-light/50',
  ghost: 'bg-transparent text-ink hover:bg-ink/5 disabled:opacity-50',
};

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  className,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5',
        'font-body text-sm font-medium tracking-wide transition-colors duration-150',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}