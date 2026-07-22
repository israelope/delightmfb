import Link from 'next/link';
import { BookMarked } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <Link href="/" className="flex w-fit items-center gap-2">
          <BookMarked className="h-5 w-5 text-cooperative" strokeWidth={2} />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Delight <span className="text-cooperative">CICS</span>
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
