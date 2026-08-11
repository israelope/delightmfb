import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-plex-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata = {
  title: 'Delight of God Multipurpose Cooperative Society',
  description:
    'The digital passbook for Delight of God Multipurpose Cooperative Society. Transparent contributions, loans, and membership records in Osun State, Nigeria.',
  keywords: [
    'cooperative society',
    'Osun State',
    'savings',
    'loans',
    'digital passbook',
    'Delight of God MCS',
    'financial growth',
    'Nigeria'
  ],
  openGraph: {
    title: 'Delight of God Multipurpose Cooperative Society',
    description: 'Secure savings, transparent loans, and digital passbooks for our members.',
    url: 'https://delofgodmcs.com',
    siteName: 'Delight of God MCS',
    images: [
      {
        url: '/logo/delightlogo.png', 
        width: 800,
        height: 600,
        alt: 'Delight of God MCS Logo',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  icons: {
    icon: '/logo/delightlogo.png', 
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}