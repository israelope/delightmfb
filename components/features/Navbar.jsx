import Link from 'next/link';
import { BookMarked } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Navbar() {
  return (
    <header className="border-b border-rule">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-cooperative" strokeWidth={2} />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Delight <span className="text-cooperative">MFB</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="font-body text-sm font-medium text-ink hover:text-cooperative"
          >
            Sign in
          </Link>
          <Link href="/register">
            <Button variant="primary" className="px-4 py-2">
              Join the cooperative
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
