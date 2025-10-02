import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WOL Web Portal',
  description: 'Tailnet Wake-on-LAN control and monitoring portal',
  icons: {
    icon: '/favicon.svg'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
