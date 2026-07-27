import Link from 'next/link';
import { BookMarked } from 'lucide-react';
import Image from 'next/image';

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <Link href="/" className="flex w-fit items-center gap-2">
          <Image 
                          src="/logo/delightlogo.png" // or "/logo.svg"
                          alt="Delight MFB Logo" 
                          width={150} // Adjust based on your logo's actual proportions
                          height={40} 
                          className="h-10 w-auto object-contain" 
                          priority // Tells Next.js to load this immediately since it's above the fold
                        />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Delight of God <span className="text-cooperative">MCS</span>
          </span>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md rounded-sm border border-rule bg-parchment-soft p-8 shadow-[6px_6px_0_0_#D8CEB0]">
          {children}
        </div>
      </div>
    </div>
  );
}
