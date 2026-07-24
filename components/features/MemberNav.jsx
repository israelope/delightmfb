'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookMarked,
  LayoutDashboard,
  Wallet,
  HandCoins,
  Landmark,
  ShoppingBasket,
  Menu,
  X,
} from 'lucide-react';
import SignOutButton from './SignOutButton';
import NotificationsBell from './NotificationsBell';
import Image from 'next/image';

const NAV_ITEMS = [
  { href: '/member/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/member/passbook', label: 'Savings', icon: Wallet },
  { href: '/member/loans', label: 'Loans', icon: HandCoins },
];

// Not built yet — shown disabled so the layout matches the target design,
// without linking anywhere real. Wire these up once those pages exist.
const COMING_SOON_ITEMS = [
  { label: 'Land Investment', icon: Landmark },
  { label: 'Products', icon: ShoppingBasket },
];

function initials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function NavLink({ href, label, icon: Icon, active, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-sm px-3 py-2.5 font-body text-sm transition-colors ${
        active
          ? 'bg-parchment-soft text-cooperative-dark'
          : 'text-parchment-soft/85 hover:bg-parchment-soft/10'
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}

function ComingSoonItem({ label, icon: Icon }) {
  return (
    <div className="flex cursor-not-allowed items-center justify-between rounded-sm px-3 py-2.5 text-parchment-soft/40">
      <span className="flex items-center gap-2.5 font-body text-sm">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
        {label}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wide">Soon</span>
    </div>
  );
}

function ProfileCard({ fullName, cooperativeId }) {
  return (
    <div className="flex items-center gap-3 rounded-sm bg-parchment-soft/10 px-3 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass-light font-mono text-sm font-semibold text-ink">
        {initials(fullName)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-body text-sm font-medium text-parchment-soft">{fullName}</p>
        <p className="font-mono text-xs text-parchment-soft/70">{cooperativeId}</p>
      </div>
    </div>
  );
}

export default function MemberNav({ userId, fullName, cooperativeId }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-rule bg-cooperative-dark px-4 py-3 md:hidden">
        <Link href="/member/dashboard" className="flex items-center gap-2">
          <Image 
          src="/logo/delightlogo.png" // or "/logo.svg"
          alt="Delight MFB Logo" 
          width={150} // Adjust based on your logo's actual proportions
          height={40} 
          className="h-10 w-auto object-contain" 
          priority // Tells Next.js to load this immediately since it's above the fold
        />
          <span className="font-display text-base font-semibold text-parchment-soft">
            Delight of God <span className="text-brass-light">CICS</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <NotificationsBell userId={userId} tone="dark" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brass-light font-mono text-xs font-semibold text-ink">
            {initials(fullName)}
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="text-parchment-soft"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-b border-rule bg-cooperative-dark px-4 pb-4 md:hidden">
          <div className="pt-3">
            <ProfileCard fullName={fullName} cooperativeId={cooperativeId} />
          </div>
          <ul className="mt-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink {...item} active={pathname === item.href} onClick={() => setOpen(false)} />
              </li>
            ))}
          </ul>
          <div className="mt-1 space-y-1 border-t border-parchment-soft/10 pt-2">
            {COMING_SOON_ITEMS.map((item) => (
              <ComingSoonItem key={item.label} {...item} />
            ))}
          </div>
          <div className="mt-3 border-t border-parchment-soft/10 pt-3">
            <SignOutButton tone="dark" />
          </div>
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex  md:min-h-screen md:w-64 md:shrink-0 md:flex-col md:justify-between md:bg-cooperative-dark">
        <div>
          <Link href="/member/dashboard" className="flex items-center gap-2 px-6 py-6">
            <Image 
          src="/logo/delightlogo.png" // or "/logo.svg"
          alt="Delight MFB Logo" 
          width={150} // Adjust based on your logo's actual proportions
          height={40} 
          className="h-10 w-auto object-contain" 
          priority // Tells Next.js to load this immediately since it's above the fold
        />
            <span className="font-display text-lg font-semibold text-parchment-soft">
              Delight of God <span className="text-brass-light">CICS</span>
            </span>
          </Link>

          <div className="px-3">
            <ProfileCard fullName={fullName} cooperativeId={cooperativeId} />
          </div>

          <nav className="mt-4 px-3">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <NavLink {...item} active={pathname === item.href} />
                </li>
              ))}
            </ul>
            <div className="mt-1 space-y-1 border-t border-parchment-soft/10 pt-2">
              {COMING_SOON_ITEMS.map((item) => (
                <ComingSoonItem key={item.label} {...item} />
              ))}
            </div>
          </nav>
        </div>

        <div className="border-t border-parchment-soft/10 px-6 py-5">
          <SignOutButton tone="dark" />
        </div>
      </aside>
    </>
  );
}