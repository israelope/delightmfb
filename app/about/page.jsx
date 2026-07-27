import Link from 'next/link';
import { ShieldCheck, Target, Eye } from 'lucide-react';
import Navbar from '@/components/features/Navbar';
import Footer from '@/components/features/Footer';
import Button from '@/components/ui/Button';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';

const GOVERNANCE = [
  'Every member account manually verified against physical records before approval',
  'Contributions and loans logged by an admin, visible to members in real time',
  'No payment processors — nothing moves through this platform except records',
  'A single invite code per member, issued by a cooperative officer, never reused',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />

      <section className="bg-cooperative">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">
            About Us
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-parchment-soft sm:text-5xl">
            Delight of God Multipurpose Cooperative Society
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-parchment-soft/80">
            A savings community built on trust, grown from a small group of neighbors into a
            cooperative that reaches members near and far.
          </p>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-4xl px-6 py-14 md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Our Story</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
            From a local area savings group to an international community
          </h2>
          <div className="mt-6 space-y-5 font-body leading-relaxed text-ink-muted">
            <p>
              Delight of God Multipurpose Cooperative Society began the way many cooperatives do — as an informal savings group
              among neighbors who trusted one another to save together and support each other
              in turn. What started as a small circle keeping track of contributions by hand
              grew, year after year, into something more structured: agreed rules, elected
              leadership, and a shared commitment to transparency.
            </p>
            <p>
              As the group grew, so did its reach. Members who relocated abroad asked to stay
              involved rather than leave the cooperative behind, and the community welcomed
              them in. What was once a local area savings group is now a cooperative that
              connects members across borders, all still bound by the same original idea:
              save together, and look out for one another.
            </p>
            <p>
              This platform is the latest step in that same tradition — replacing the paper
              passbook with a digital one, so that wherever a member is, they can see their
              contributions and loan standing exactly as clearly as if they were sitting in
              the cooperative office.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-rule bg-parchment-soft">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <ImagePlaceholder
              src="/images/mission.jpg"
              alt="Delight Cooperative Team"
              className="aspect-[4/3] w-full"
            />
              <div className="mt-5 flex items-center gap-2">
                <Target className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
                <h3 className="font-display text-xl font-semibold text-ink">Our Mission</h3>
              </div>
              <p className="mt-3 font-body leading-relaxed text-ink-muted">
                To give every member a disciplined, transparent way to save toward what matters
                to them — from everyday goals to once-in-a-lifetime milestones — supported by a
                cooperative that keeps an honest, verifiable record of every contribution.
              </p>
            </div>
            <div>
              <ImagePlaceholder
              src="/images/vision.png"
              alt="Delight Cooperative Team"
              className="aspect-[4/3] w-full"
            />
              <div className="mt-5 flex items-center gap-2">
                <Eye className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
                <h3 className="font-display text-xl font-semibold text-ink">Our Vision</h3>
              </div>
              <p className="mt-3 font-body leading-relaxed text-ink-muted">
                To grow from a local area savings group into a trusted international savings
                community — one where distance never weakens the trust members place in each
                other, or in the cooperative that holds their record.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-4xl px-6 py-14 md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
            Governance &amp; Values
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
            How the cooperative runs
          </h2>
          <ul className="mt-6 space-y-3">
            {GOVERNANCE.map((item) => (
              <li key={item} className="flex items-start gap-3 font-body text-ink">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cooperative" strokeWidth={2} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-4xl rounded-sm bg-cooperative px-8 py-12 text-center">
          <h2 className="font-display text-2xl font-semibold text-parchment-soft sm:text-3xl">
            Want to be part of the story?
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-parchment-soft/80">
            Reach out to a cooperative officer for an invite code, then register in under a
            minute.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button variant="brass" className="px-6 py-3 text-base">
                Become a Member
              </Button>
            </Link>
            <Link href="/products">
              <Button
                variant="ghost"
                className="border border-parchment-soft/40 px-6 py-3 text-base text-parchment-soft hover:bg-parchment-soft/10"
              >
                See Our Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}