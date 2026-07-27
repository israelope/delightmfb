import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  KeyRound,
  ClipboardCheck,
  HandCoins,
  Wallet,
  ShieldHalf,
  ArrowRight,
} from 'lucide-react';
import Navbar from '@/components/features/Navbar';
import Footer from '@/components/features/Footer';
import { Menu, X} from 'lucide-react';
import Button from '@/components/ui/Button';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';

const STATS = [
  { icon: Users, value: '150+', label: 'Active Members' },
  { icon: Wallet, value: '₦30M', label: 'Total Savings' },
  { icon: HandCoins, value: '₦25M', label: 'Loans Disbursed' },
  { icon: ShieldHalf, value: '100%', label: 'Admin-Verified' },
];

const STEPS = [
  {
    n: '01',
    title: 'An officer issues your invite code',
    body: 'Membership stays by referral. A Delight of God MCS officer generates a single-use code for you offline.',
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
    <div className="min-h-screen bg-parchment">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-cooperative">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-14 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-parchment-soft/25 bg-parchment-soft/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.15em] text-parchment-soft/90">
              Registered under Osun State Cooperative Federation
            </p>
            <h1 className="max-w-lg font-display text-4xl font-semibold leading-[1.1] text-parchment-soft sm:text-5xl md:text-6xl md:leading-[1.08]">
              Welcome to{' '}
              <span className="italic text-brass-light">Delight Of God</span> Multipurpose Cooperative
              Society
            </h1>
            <p className="mt-6 max-w-md font-body text-base leading-relaxed text-parchment-soft/80">
              Your one step towards financial security and growth. Join a community of members who save together, support each other, and grow together.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register">
                <Button variant="brass" className="px-6 py-3 text-base">
                  Become a Member
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  variant="ghost"
                  className="border border-parchment-soft/40 px-6 py-3 text-base text-parchment-soft hover:bg-parchment-soft/10"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <ImagePlaceholder
              src="/images/1.png"
              alt="Delight Cooperative Team"
              className="aspect-[4/3] w-full"
            />    

            <div className="absolute -right-4 -top-4 rounded-sm bg-parchment-soft px-4 py-3 shadow-lg sm:-right-6 sm:-top-6">
              <p className="font-body text-xs text-ink-muted">Members</p>
              <p className="tabular font-display text-lg font-semibold text-cooperative">150+</p>
            </div>

            <div className="absolute -bottom-4 -left-4 rounded-sm bg-parchment-soft px-4 py-3 shadow-lg sm:-bottom-6 sm:-left-6">
              <p className="font-body text-xs text-ink-muted">Total Savings</p>
              <p className="tabular font-display text-lg font-semibold text-cooperative">₦30M</p>
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

      {/* Products teaser */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Our Products</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
                Savings plans built around real goals
              </h2>
              <p className="mt-2 max-w-xl font-body text-ink-muted">
                From your child's education to Christmas and Eid celebrations — see every
                savings plan we offer.
              </p>
            </div>
            <Link href="/products">
              <Button variant="secondary" className="px-5 py-2.5">
                View all products
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About teaser */}
      <section className="border-b border-rule bg-parchment-soft">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">About Delight of God MCS</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
                From a local savings group to an international community
              </h2>
              <p className="mt-4 font-body leading-relaxed text-ink-muted">
                Delight of God Multipurpose Cooperative Society didn't start as a formal institution — it grew out of members
                looking out for one another. Read the full story of where we came from, and
                the mission that guides where we're going.
              </p>
              <Link href="/about" className="mt-5 inline-block">
                <Button variant="primary" className="px-5 py-2.5">
                  Read our story
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Button>
              </Link>
            </div>
            <ImagePlaceholder
              src="/images/2.png"
              alt="Delight Cooperative Team"
              className="aspect-[4/3] w-full"
            />    
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-rule">
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
      <section className="border-b border-rule bg-parchment-soft">
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
        <div className="mx-auto max-w-4xl rounded-sm bg-cooperative px-8 py-12 text-center">
          <h2 className="font-display text-2xl font-semibold text-parchment-soft sm:text-3xl">
            Ready to join Delight of God Multipurpose Cooperative Society?
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

      <Footer />
    </div>
  );
}