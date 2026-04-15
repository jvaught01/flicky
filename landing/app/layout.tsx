import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { FlickyCursor } from './components/FlickyCursor';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const display = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Flicky — a voice companion for your computer',
  description:
    "Hold a hotkey, talk, and a little blue cursor flies across your screen to point at what Flicky is talking about. Open source, cross-platform.",
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Flicky',
    description:
      "Hold a hotkey. Talk. A little blue cursor flies to whatever Flicky is pointing at.",
    url: 'https://github.com/jvaught01/flicky',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <FlickyCursor />
        {children}
      </body>
    </html>
  );
}
