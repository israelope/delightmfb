import Link from 'next/link';
import { ShieldCheck, Users, KeyRound, ClipboardCheck, Landmark } from 'lucide-react';
import Navbar from '@/components/features/Navbar';
import Button from '@/components/ui/Button';
import PassbookStamp from '@/components/ui/PassbookStamp';

const STEPS = [
  {
    n: '01',
    title: 'An officer issues your invite code',
    body: 'Membership stays by referral. A Delight MFB officer generates a single-use code for you offline.',
    icon: KeyRound,
  },
  {
    n: '02',
    title: 'You register with the code',
    body: 'Enter your full name and a password. No email, no SMS, no waiting on a verification text.',
    icon: Users,
  },
  {
    n: '03',
    title: 'An admin checks the record',
    body: 'Your entry is compared against the physical ledger before your account is stamped active.',
    icon: ClipboardCheck,
  },
  {
    n: '04',
    title: 'Your passbook unlocks',
    body: 'Contributions, loan eligibility, and your full history become visible the moment you are approved.',
    icon: ShieldCheck,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-cooperative">
              Thrift &amp; Credit Cooperative Society
            </p>
            <h1 className="max-w-lg font-display text-5xl font-semibold leading-[1.08] text-ink md:text-6xl">
              The passbook,{' '}
              <span className="italic text-cooperative">now impossible to lose.</span>
            </h1>
            <p className="mt-6 max-w-md font-body text-base leading-relaxed text-ink-muted">
              Delight MFB replaces the paper ledger your cooperative has trusted for years
              with a transparent, always-current record — every contribution, every loan,
              verified by an admin before it ever reaches your dashboard.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register">
                <Button variant="primary" className="px-6 py-3 text-base">
                  Join with an invite code
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="px-6 py-3 text-base">
                  Sign in to your passbook
                </Button>
              </Link>
            </div>
          </div>

          {/* Signature element: digital passbook mockup with stamp overlay */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative rounded-sm border border-rule bg-parchment-soft p-8 shadow-[6px_6px_0_0_#D8CEB0]">
              <div className="mb-6 flex items-center justify-between border-b border-rule pb-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                    Member No.
                  </p>
                  <p className="font-mono text-sm text-ink">COOP-84210</p>
                </div>
                <Landmark className="h-6 w-6 text-cooperative" strokeWidth={1.75} />
              </div>
              <div className="space-y-3 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_35px,#D8CEB0_36px)] pt-1">
                {[
                  ['Jun 2026', '₦25,000.00'],
                  ['Jul 2026', '₦25,000.00'],
                  ['Aug 2026', 'pending'],
                ].map(([month, amt]) => (
                  <div key={month} className="flex items-center justify-between px-0.5 text-sm">
                    <span className="font-body text-ink-muted">{month}</span>
                    <span className="tabular font-mono text-ink">{amt}</span>
                  </div>
                ))}
              </div>
            </div>
            <PassbookStamp
              label="VERIFIED"
              state="live"
              className="absolute -right-8 -top-8 h-32 w-32 md:-right-10 md:-top-10 md:h-36 md:w-36"
            />
          </div>
        </div>
      </section>

      {/* How it works — a real sequence, so numbering earns its place */}
      <section className="border-t border-rule bg-parchment-soft">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl font-semibold text-ink">How membership works</h2>
          <p className="mt-2 max-w-xl font-body text-ink-muted">
            Four steps, the same order every officer has used offline for years — now just
            faster to verify.
          </p>
          <ol className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-4">
            {STEPS.map(({ n, title, body, icon: Icon }) => (
              <li key={n} className="border-t-2 border-cooperative pt-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-brass">{n}</span>
                  <Icon className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
                </div>
                <h3 className="mt-3 font-display text-lg font-medium text-ink">{title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-ink-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* About / trust */}
      <section className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="md:col-span-2">
              <h2 className="font-display text-3xl font-semibold text-ink">
                Built for cooperatives that run on trust, not paperwork
              </h2>
              <p className="mt-4 max-w-xl font-body leading-relaxed text-ink-muted">
                Delight MFB is a record-keeping tool, not a bank. No money moves through this
                platform — your admin logs contributions and loan activity exactly as it happens
                offline, so the ledger you see here always matches the one in the office.
              </p>
            </div>
            <div className="space-y-6 border-l border-rule pl-8">
              <div>
                <p className="font-display text-2xl text-cooperative">Zero</p>
                <p className="font-body text-sm text-ink-muted">payment processors involved</p>
              </div>
              <div>
                <p className="font-display text-2xl text-cooperative">100%</p>
                <p className="font-body text-sm text-ink-muted">
                  of members reviewed by a human admin
                </p>
              </div>
              <div>
                <p className="font-display text-2xl text-cooperative">1</p>
                <p className="font-body text-sm text-ink-muted">
                  invite code per member, never reused
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center font-body text-xs text-ink-muted">
          Delight Thrift &amp; Credit Cooperative Society — internal ledger tool.
        </div>
      </footer>
    </div>
  );
}
