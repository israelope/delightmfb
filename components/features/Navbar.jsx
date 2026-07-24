'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookMarked, Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Image from 'next/image';

const LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#products', label: 'Products' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-parchment-soft/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="#home" className="flex items-center gap-2">
          <Image 
          src="/logo/delightlogo.png" // or "/logo.svg"
          alt="Delight MFB Logo" 
          width={150} // Adjust based on your logo's actual proportions
          height={40} 
          className="h-10 w-auto object-contain" 
          priority // Tells Next.js to load this immediately since it's above the fold
        />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Delight of God <span className="text-cooperative">CICS</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="font-body text-sm font-medium text-ink-muted hover:text-cooperative">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="secondary" className="px-4 py-2 text-sm">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="brass" className="px-4 py-2 text-sm">
              Sign Up
            </Button>
          </Link>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          className="text-ink md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-rule bg-parchment-soft px-6 pb-6 md:hidden">
          <ul className="space-y-1 pt-4">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)} className="block rounded-sm px-2 py-2.5 font-body text-sm font-medium text-ink hover:bg-ink/5">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-rule pt-4">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="secondary" className="w-full py-2.5">
                Login
              </Button>
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}>
              <Button variant="brass" className="w-full py-2.5">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}