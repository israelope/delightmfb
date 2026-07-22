import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  KeyRound,
  ClipboardCheck,
  BookMarked,
  HandCoins,
  Landmark,
  Wallet,
  ShieldHalf,
} from 'lucide-react';
import Navbar from '@/components/features/Navbar';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';

// Edit these with real figures once you have them — placeholders for now.
const STATS = [
  { icon: Users, value: '—', label: 'Active Members' },
  { icon: Wallet, value: '₦0', label: 'Total Savings' },
  { icon: HandCoins, value: '₦0', label: 'Loans Disbursed' },
  { icon: ShieldHalf, value: '100%', label: 'Admin-Verified' },
];

const PRODUCTS = [
  {
    icon: BookMarked,
    title: 'Digital Passbook',
    body: "Every contribution logged by your admin, visible to you the moment it's recorded — no more lost or outdated paper passbooks.",
  },
  {
    icon: HandCoins,
    title: 'Loan Tracking',
    body: 'Borrow up to 2x your total savings. Request in a few taps, then track approval, disbursement, and repayment in one place.',
  },
  {
    icon: ShieldCheck,
    title: 'Admin-Verified Membership',
    body: "Every member is checked against the cooperative's physical records before their account goes live — no anonymous signups.",
  },
];

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
    body: 'Enter your name, email, and password, plus the invite code — done in under a minute.',
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

// Sample quotes — replace with real member testimonials once you have them.
const TESTIMONIALS = [
  {
    quote:
      "Being able to see my contributions update the same day they're logged has made me trust the cooperative even more.",
    name: 'A. Bello',
    since: 'Member since 2023',
  },
  {
    quote:
      'Requesting a loan used to mean a trip to the office. Now I can see my eligibility and apply from my phone.',
    name: 'C. Nwachukwu',
    since: 'Member since 2022',
  },
  {
    quote:
      "The admin approval step means I know every member on the platform has actually been verified — it's not just anyone.",
    name: 'F. Yusuf',
    since: 'Member since 2024',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section id="home" className="relative overflow-hidden bg-cooperative">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-14 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-parchment-soft/25 bg-parchment-soft/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.15em] text-parchment-soft/90">
              For Thrift &amp; Credit Cooperative Societies
            </p>
            <h1 className="max-w-lg font-display text-4xl font-semibold leading-[1.1] text-parchment-soft sm:text-5xl md:text-6xl md:leading-[1.08]">
              Welcome to{' '}
              <span className="italic text-brass-light">Delight MFB</span> Cooperative
              Society
            </h1>
            <p className="mt-6 max-w-md font-body text-base leading-relaxed text-parchment-soft/80">
              Replacing the paper ledger with a transparent, always-current record —
              every contribution and every loan, verified by an admin before it
              reaches your dashboard.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register">
                <Button variant="brass" className="px-6 py-3 text-base">
                  Become a Member
                </Button>
              </Link>
              <Link href="#about">
                <Button
                  variant="ghost"
                  className="border border-parchment-soft/40 px-6 py-3 text-base text-parchment-soft hover:bg-parchment-soft/10"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero image with floating stat cards */}
          <div className="relative mx-auto w-full max-w-md">
            <ImagePlaceholder 
  src="/images/1.png" 
  alt="Delight Cooperative Team"
  className="aspect-[4/3] w-full" 
/>

            <div className="absolute -right-4 -top-4 rounded-sm bg-parchment-soft px-4 py-3 shadow-lg sm:-right-6 sm:-top-6">
              <p className="font-body text-xs text-ink-muted">Members</p>
              <p className="tabular font-display text-lg font-semibold text-cooperative">—</p>
            </div>

            <div className="absolute -bottom-4 -left-4 rounded-sm bg-parchment-soft px-4 py-3 shadow-lg sm:-bottom-6 sm:-left-6">
              <p className="font-body text-xs text-ink-muted">Total Savings</p>
              <p className="tabular font-display text-lg font-semibold text-cooperative">₦0</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-rule bg-parchment-soft">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-cooperative/10">
                <Icon className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
              </div>
              <p className="tabular mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
              <p className="mt-1 font-body text-sm text-ink-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Our Products</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
            Everything Your Cooperative Needs
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-ink-muted">
            A focused set of tools that replace the paper ledger, nothing more, nothing less.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
            {PRODUCTS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-sm border border-rule bg-parchment-soft p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-cooperative/10">
                  <Icon className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-display text-lg font-medium text-ink">{title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <ImagePlaceholder 
  src="/images/2.png" 
  alt="Delight Cooperative Team"
  className="aspect-[4/3] w-full" 
/>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">About Delight MFB</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
                Built for cooperatives that run on trust, not paperwork
              </h2>
              <p className="mt-4 font-body leading-relaxed text-ink-muted">
                Delight MFB is a record-keeping tool, not a bank. No money moves through this
                platform — your admin logs contributions and loan activity exactly as it happens
                offline, so the ledger you see here always matches the one in the office.
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  'Every account manually verified by an admin',
                  'No payment processors — nothing moves except records',
                  'A single invite code per member, never reused',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 font-body text-sm text-ink">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cooperative" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-rule bg-parchment-soft">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
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

      {/* Testimonials */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Member Stories</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">What Our Members Say</h2>

          <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
            {TESTIMONIALS.map(({ quote, name, since }) => (
              <div key={name} className="rounded-sm border border-rule bg-parchment-soft p-6">
                <p className="font-body text-sm italic leading-relaxed text-ink">&ldquo;{quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cooperative/10 font-mono text-xs font-semibold text-cooperative">
                    {name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-ink">{name}</p>
                    <p className="font-body text-xs text-ink-muted">{since}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl rounded-lg bg-cooperative px-8 py-12 text-center">
          <h2 className="font-display text-2xl font-semibold text-parchment-soft sm:text-3xl">
            Ready to join Delight MFB?
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-parchment-soft/80">
            Reach out to your cooperative officer for an invite code, then register in under a
            minute.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button variant="brass" className="px-6 py-3 text-base">
                Register Now
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="ghost"
                className="border border-parchment-soft/40 px-6 py-3 text-base text-parchment-soft hover:bg-parchment-soft/10"
              >
                Member Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-rule bg-cooperative">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-brass-light" strokeWidth={1.75} />
                <span className="font-display text-lg font-semibold text-parchment-soft">
                  Delight <span className="text-brass-light">MFB</span>
                </span>
              </div>
              <p className="mt-3 font-body text-sm text-parchment-soft/70">
                A digital ledger for our Thrift &amp; Credit Cooperative Society — replacing
                paper passbooks with a transparent, admin-verified record.
              </p>
            </div>

            <div>
              <p className="font-body text-sm font-semibold text-parchment-soft">Quick Links</p>
              <ul className="mt-3 space-y-2 font-body text-sm text-parchment-soft/70">
                <li><a href="#home" className="hover:text-brass-light">Home</a></li>
                <li><a href="#about" className="hover:text-brass-light">About</a></li>
                <li><a href="#products" className="hover:text-brass-light">Products</a></li>
                <li><Link href="/register" className="hover:text-brass-light">Register</Link></li>
                <li><Link href="/login" className="hover:text-brass-light">Member Login</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-body text-sm font-semibold text-parchment-soft">Our Products</p>
              <ul className="mt-3 space-y-2 font-body text-sm text-parchment-soft/70">
                <li>Digital Passbook</li>
                <li>Loan Tracking</li>
                <li>Admin-Verified Membership</li>
              </ul>
            </div>

            <div>
              <p className="font-body text-sm font-semibold text-parchment-soft">Contact Us</p>
              <ul className="mt-3 space-y-2 font-body text-sm text-parchment-soft/70">
                <li>[Cooperative office address]</li>
                <li>[Phone number]</li>
                <li>[Contact email]</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-parchment-soft/15 pt-6 text-center font-body text-xs text-parchment-soft/60 sm:flex-row sm:justify-between sm:text-left">
            <p>&copy; {new Date().getFullYear()} Delight Thrift &amp; Credit Cooperative Society.</p>
            <p>Internal ledger tool — not a payment platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}