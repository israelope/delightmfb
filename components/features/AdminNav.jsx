'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Wallet, HandCoins, Menu, X, BookMarked } from 'lucide-react';
import SignOutButton from './SignOutButton';
import Image from 'next/image';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/invite-codes', label: 'Invite Codes', icon: BookMarked },
  { href: '/admin/contributions', label: 'Contributions', icon: Wallet },
  { href: '/admin/loans', label: 'Loans', icon: HandCoins },
];

function NavLink({ href, label, icon: Icon, active, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-sm px-3 py-2.5 font-body text-sm transition-colors ${
        active ? 'bg-cooperative text-parchment-soft' : 'text-ink hover:bg-ink/5'
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}

export default function AdminNav({ fullName }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-rule bg-parchment-soft px-4 py-3 md:hidden">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Image 
                    src="/logo/delightlogo.png" // or "/logo.svg"
                    alt="Delight MFB Logo" 
                    width={150} // Adjust based on your logo's actual proportions
                    height={40} 
                    className="h-10 w-auto object-contain" 
                    priority // Tells Next.js to load this immediately since it's above the fold
                  />
          <span className="font-display text-base font-semibold text-ink">
            Delight of God <span className="text-cooperative">CICS</span>
          </span>
        </Link>
        <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" className="text-ink">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-b border-rule bg-parchment-soft px-4 pb-4 md:hidden">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink {...item} active={pathname === item.href} onClick={() => setOpen(false)} />
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-rule pt-3">
            <SignOutButton />
          </div>
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:min-h-screen md:w-60 md:shrink-0 md:flex-col md:justify-between md:border-r md:border-rule md:bg-parchment-soft">
        <div>
          <Link href="/admin/dashboard" className="flex items-center gap-2 px-6 py-6">
            <Image 
                      src="/logo/delightlogo.png" // or "/logo.svg"
                      alt="Delight MFB Logo" 
                      width={150} // Adjust based on your logo's actual proportions
                      height={40} 
                      className="h-10 w-auto object-contain" 
                      priority // Tells Next.js to load this immediately since it's above the fold
                    />
            <span className="font-display text-lg font-semibold text-ink">
              Delight of God <span className="text-cooperative">CICS</span>
            </span>
          </Link>
          <nav className="px-3">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <NavLink {...item} active={pathname === item.href} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="border-t border-rule px-6 py-5">
          <p className="truncate font-body text-sm text-ink-muted">{fullName}</p>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>
    </>
  );
}