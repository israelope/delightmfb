import Link from 'next/link';
import { Wallet, HandCoins, Landmark, ShoppingBasket } from 'lucide-react';

const ACTIONS = [
  { label: 'View Passbook', href: '/member/passbook', icon: Wallet, enabled: true },
  { label: 'Request a Loan', href: '/member/loans', icon: HandCoins, enabled: true },
  { label: 'Land Investment', href: null, icon: Landmark, enabled: false },
  { label: 'Cooperative Products', href: null, icon: ShoppingBasket, enabled: false },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {ACTIONS.map(({ label, href, icon: Icon, enabled }) =>
        enabled ? (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-sm border border-rule bg-parchment-soft p-4 transition-colors hover:border-cooperative"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-cooperative/10">
              <Icon className="h-4.5 w-4.5 text-cooperative" strokeWidth={1.75} />
            </div>
            <span className="font-body text-sm font-medium text-ink">{label}</span>
          </Link>
        ) : (
          <div
            key={label}
            className="flex cursor-not-allowed items-center gap-3 rounded-sm border border-dashed border-rule p-4 opacity-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ink/5">
              <Icon className="h-4.5 w-4.5 text-ink-muted" strokeWidth={1.75} />
            </div>
            <span className="font-body text-sm font-medium text-ink-muted">{label}</span>
          </div>
        )
      )}
    </div>
  );
}
