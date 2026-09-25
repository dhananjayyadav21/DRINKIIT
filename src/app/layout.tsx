import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DRINK iT – Premium Water Bottle Delivery on WhatsApp',
  description:
    'DRINK iT supplies purified 1L and 500ml water bottles, ordered directly on WhatsApp and delivered to your door.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body style={{ margin: 0, background: '#ffffff', fontFamily: 'var(--font-body)' }}>{children}</body>
    </html>
  );
}
