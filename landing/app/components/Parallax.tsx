'use client';

import { useEffect, useRef } from 'react';

/**
 * Publishes normalised pointer position (-1..1) as --mx / --my on its
 * parent element, so the scattered desktop clutter can drift with the
 * mouse. Does nothing at all under prefers-reduced-motion.
 */
export function Parallax() {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const host = ref.current?.parentElement as HTMLElement | undefined;
    if (!host) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let raf = 0;
    let mx = 0;
    let my = 0;

    const apply = () => {
      raf = 0;
      host.style.setProperty('--mx', mx.toFixed(3));
      host.style.setProperty('--my', my.toFixed(3));
    };

    const onMove = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      mx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      my = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <span ref={ref} className="parallax-probe" aria-hidden="true" />;
}
