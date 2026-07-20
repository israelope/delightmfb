import { cn } from '@/lib/utils';

export default function Input({ label, id, error, hint, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full rounded-sm border border-rule bg-parchment-soft px-3.5 py-2.5',
          'font-body text-ink placeholder:text-ink-muted/60',
          'focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative',
          error && 'border-brick focus:border-brick focus:ring-brick',
          className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="font-body text-xs text-brick">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="font-body text-xs text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
