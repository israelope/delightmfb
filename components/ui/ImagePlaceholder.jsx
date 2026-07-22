import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ImagePlaceholder({ label = 'Add image here', className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-rule bg-ink/5 text-ink-muted',
        className
      )}
    >
      <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
      <span className="font-body text-xs">{label}</span>
    </div>
  );
}