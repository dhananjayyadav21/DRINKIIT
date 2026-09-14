import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'DRINK IT WhatsApp Bot',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0b10' }}>{children}</body>
    </html>
  );
}
