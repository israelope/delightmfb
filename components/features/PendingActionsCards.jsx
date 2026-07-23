import Link from 'next/link';
import { HandCoins, UserCheck, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function PendingActionsCards() {
  const supabase = await createClient();

  const [{ count: pendingLoans }, { count: pendingMembers }, { data: disbursedLoans }] =
    await Promise.all([
      supabase.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'member')
        .eq('status', 'pending'),
      supabase.from('loans').select('due_date').eq('status', 'disbursed'),
    ]);

  const overdueCount = (disbursedLoans ?? []).filter(
    (l) => l.due_date && new Date(l.due_date) < new Date()
  ).length;

  const cards = [
    {
      count: pendingLoans ?? 0,
      label: 'Loan Applications Pending',
      icon: HandCoins,
      href: '/admin/loans',
      classes: 'border-brass/30 bg-brass/10 text-brass',
    },
    {
      count: pendingMembers ?? 0,
      label: 'New Member Verifications',
      icon: UserCheck,
      href: '/admin/members',
      classes: 'border-cooperative/30 bg-cooperative/10 text-cooperative',
    },
    {
      count: overdueCount,
      label: 'Overdue Loans',
      icon: AlertTriangle,
      href: '/admin/loans',
      classes: 'border-brick/30 bg-brick/10 text-brick',
    },
  ];

  return (
    <div>
      <p className="mb-3 font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
        Pending Actions
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ count, label, icon: Icon, href, classes }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 rounded-sm border p-4 transition-opacity hover:opacity-80 ${classes}`}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            <div>
              <p className="font-display text-xl font-semibold">{count}</p>
              <p className="font-body text-sm">{label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
