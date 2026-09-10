'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const KEY = 'flicky-theme';

function current(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/**
 * Small round sun/moon button. The initial attribute is set by the
 * blocking script in layout.tsx, so this component only mirrors and
 * flips it — it never causes a flash of the wrong theme.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(current());
    setMounted(true);

    // Follow the OS only while the visitor hasn't picked a side.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystem = () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(KEY);
      } catch {
        /* storage blocked — treat as "no explicit choice" */
      }
      if (stored === 'light' || stored === 'dark') return;
      const next: Theme = mq.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      setTheme(next);
    };
    mq.addEventListener('change', onSystem);
    return () => mq.removeEventListener('change', onSystem);
  }, []);

  const toggle = () => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };

  const isDark = mounted && theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.5 14.4A8.6 8.6 0 1 1 9.6 3.5a7 7 0 0 0 10.9 10.9Z" />
        </svg>
      )}
    </button>
  );
}
