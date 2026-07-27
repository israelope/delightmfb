import Link from 'next/link';
import {
  GraduationCap,
  Refrigerator,
  MapPin,
  Gift,
  Moon,
  CalendarDays,
  UtensilsCrossed,
} from 'lucide-react';
import Navbar from '@/components/features/Navbar';
import Footer from '@/components/features/Footer';
import Button from '@/components/ui/Button';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import Image from 'next/image';

const PRODUCTS = [
  {
    icon: GraduationCap,
    title: 'Education Savings',
    body: "Save steadily toward school fees and education costs — including members saving toward sending their children abroad to study. Contribute monthly and track your progress toward the target you've set for yourself.",
    src: '/images/education.jpg',
    alt: 'Education savings representation',
  },
  {
    icon: Refrigerator,
    title: 'Home Appliances Savings',
    body: 'A dedicated plan for members saving toward household appliances — from refrigerators to generators — so a big purchase never has to come from a single lump sum.',
    src: '/images/appliances.jpg',
    alt: 'Home appliances savings representation',
  },
  {
    icon: MapPin,
    title: 'Land Savings',
    body: 'For members working toward acquiring land, this plan lets you save in manageable monthly amounts rather than needing the full sum at once.',
    src: '/images/land.jpg',
    alt: 'Land savings representation',
  },
  {
    icon: Gift,
    title: 'Christmas Savings',
    body: 'Save a little every month throughout the year so December expenses — travel, gifts, celebrations — are already covered when the season arrives.',
    src: '/images/christmas.png',
    alt: 'Christmas savings representation',
  },
  {
    icon: Moon,
    title: 'Eid-Kabir Savings',
    body: 'A savings plan built around Eid-el-Kabir, helping members prepare for the ram and other celebration costs well ahead of time.',
    src: '/images/eid.webp',
    alt: 'Eid-Kabir savings representation',
  },
  {
    icon: CalendarDays,
    title: 'AGM (Annual General Meeting)',
    body: "Once a year, the cooperative comes together to review the year's performance, hear updates from the admin team, and strengthen the trust the whole society is built on.",
    src: '/images/agm.jpg',
    alt: 'AGM meeting representation',
  },
  {
    icon: UtensilsCrossed,
    title: 'Kitchen Utensils',
    body: 'A bulk-purchasing plan for kitchen utensils and household essentials — members contribute together to unlock better prices than buying alone.',
    src: '/images/kitchen.webp',
    alt: 'Kitchen utensils representation',
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />

      <section className="bg-cooperative">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">
            Our Products
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-parchment-soft sm:text-5xl">
            Savings plans built around real goals
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-parchment-soft/80">
            Members join Delight of God Multipurpose Cooperative Society for different reasons — here's every plan we offer to help
            you reach yours.
          </p>
        </div>
      </section>

      <section>
        {/* 1. Destructure src and alt here */}
        {PRODUCTS.map(({ icon: Icon, title, body, src, alt }, index) => {
          const reversed = index % 2 === 1;
          return (
            <div
              key={title}
              className={`border-b border-rule ${index % 2 === 0 ? 'bg-parchment' : 'bg-parchment-soft'}`}
            >
              <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
                <div
                  className={`flex flex-col items-center gap-10 md:flex-row ${
                    reversed ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className="w-full md:flex-1">
                    {/* 2. Swap ImagePlaceholder for the real Next.js Image */}
                    <Image
                      src={src}
                      alt={alt}
                      width={800} // Arbitrary large width for high quality
                      height={600} // Matches the 4/3 aspect ratio
                      className="aspect-[4/3] w-full rounded-sm object-cover" 
                    />
                  </div>
                  <div className="w-full md:flex-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-cooperative/10">
                      <Icon className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
                    </div>
                    <h2 className="mt-4 font-display text-2xl font-semibold text-ink">{title}</h2>
                    <p className="mt-3 font-body leading-relaxed text-ink-muted">{body}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-4xl rounded-sm bg-cooperative px-8 py-12 text-center">
          <h2 className="font-display text-2xl font-semibold text-parchment-soft sm:text-3xl">
            Pick a goal, and let's start saving toward it
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
            <Link href="/about">
              <Button
                variant="ghost"
                className="border border-parchment-soft/40 px-6 py-3 text-base text-parchment-soft hover:bg-parchment-soft/10"
              >
                Read Our Story
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}