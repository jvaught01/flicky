import type { Metadata, Viewport } from 'next';
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
  title: 'flicky — an ai buddy that lives on your desktop',
  description:
    'Hold a hotkey, talk, and a little blue cursor flies across your screen to point at what Flicky is talking about. Open source, cross-platform, bring your own keys.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Flicky',
    description:
      'Hold a hotkey. Talk. A little blue cursor flies to whatever Flicky is pointing at.',
    url: 'https://github.com/pango07/flicky',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef1f6' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f10' },
  ],
};

/* Runs before first paint so the right palette is on <html> immediately. */
const themeScript = `(function(){try{var t=localStorage.getItem('flicky-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${display.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <FlickyCursor />
        {children}
      </body>
    </html>
  );
}
