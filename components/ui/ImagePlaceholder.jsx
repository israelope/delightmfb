import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function ImagePlaceholder({ src, alt = "Image", label = 'Add image here', className }) {
  // 1. If an image source is provided, render the real image
  if (src) {
    return (
      <div className={cn("relative overflow-hidden rounded-sm", className)}>
        <Image 
          src={src} 
          alt={alt} 
          fill 
          className="object-cover" 
        />
      </div>
    );
  }

  // 2. If no source is provided, render your dashed placeholder
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