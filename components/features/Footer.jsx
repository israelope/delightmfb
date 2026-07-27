import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-rule bg-cooperative">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Image 
                          src="/logo/delightlogo.png" // or "/logo.svg"
                          alt="Delight MFB Logo" 
                          width={150} // Adjust based on your logo's actual proportions
                          height={40} 
                          className="h-10 w-auto object-contain" 
                          priority // Tells Next.js to load this immediately since it's above the fold
                        />
              <span className="font-display text-lg font-semibold text-parchment-soft">
                Delight of God <span className="text-brass-light">MCS</span>
              </span>
            </div>
            <p className="mt-3 font-body text-sm text-parchment-soft/70">
              our one step towards financial security and growth. Join a community of members who save together, support each other, and grow together.
            </p>
          </div>

          <div>
            <p className="font-body text-sm font-semibold text-parchment-soft">Quick Links</p>
            <ul className="mt-3 space-y-2 font-body text-sm text-parchment-soft/70">
              <li><Link href="/" className="hover:text-brass-light">Home</Link></li>
              <li><Link href="/about" className="hover:text-brass-light">About</Link></li>
              <li><Link href="/products" className="hover:text-brass-light">Products</Link></li>
              <li><Link href="/register" className="hover:text-brass-light">Register</Link></li>
              <li><Link href="/login" className="hover:text-brass-light">Member Login</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-body text-sm font-semibold text-parchment-soft">Our Products</p>
            <ul className="mt-3 space-y-2 font-body text-sm text-parchment-soft/70">
              <li>Education Savings</li>
              <li>Home Appliances Savings</li>
              <li>Land Savings</li>
              <li>Christmas Savings</li>
              <li>Eid-Kabir Savings</li>
              <li>Kitchen Utensils</li>
            </ul>
          </div>

          <div>
            <p className="font-body text-sm font-semibold text-parchment-soft">Contact Us</p>
            <ul className="mt-3 space-y-2 font-body text-sm text-parchment-soft/70">
              <li>Osogbo, Osun State</li>
              <li>08132285332</li>
              <li>info@delightofgodmcs.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-parchment-soft/15 pt-6 text-center font-body text-xs text-parchment-soft/60 sm:flex-row sm:justify-between sm:text-left">
          <p>&copy; {new Date().getFullYear()} Delight of God Multiputpose Cooperative Society.</p>
          <p>Internal ledger tool</p>
        </div>
      </div>
    </footer>
  );
}