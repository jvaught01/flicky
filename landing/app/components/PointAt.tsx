'use client';

import { useEffect, useRef, useState } from 'react';
import { Mark } from './Mark';

interface PointAtProps {
  /** CSS selector, resolved inside the nearest positioned ancestor. */
  target: string;
  label: string;
  /** Fire on a timer instead of waiting for the section to scroll in. */
  delay?: number;
  /** Which side of the cursor the bubble sits on. */
  side?: 'right' | 'left';
}

/**
 * The page pointing at itself. A blue Flicky cursor parks in the
 * bottom-right of its section, then flies to `target` with the same
 * springy easing the real overlay uses and pops a little bubble.
 */
export function PointAt({ target, label, delay, side = 'right' }: PointAtProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ l: number; t: number } | null>(null);
  const [fired, setFired] = useState(false);
  const [instant, setInstant] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement as HTMLElement | undefined;
    if (!el || !host) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let io: IntersectionObserver | undefined;

    // Keep the cursor + its bubble inside the section so nothing ever
    // pushes the document sideways on a narrow screen.
    const clamp = (l: number) => {
      const w = host.clientWidth;
      const lead = side === 'right' ? 150 : 34;
      const trail = side === 'right' ? 34 : 150;
      return Math.min(Math.max(l, trail), Math.max(trail, w - lead));
    };

    const aim = () => {
      const t = host.querySelector(target) as HTMLElement | null;
      if (!t) return null;
      const hr = host.getBoundingClientRect();
      const tr = t.getBoundingClientRect();
      return {
        l: clamp(tr.left - hr.left + tr.width * 0.72),
        t: tr.top - hr.top + tr.height * 0.8,
      };
    };

    const park = () => ({
      l: clamp(host.clientWidth - 74),
      t: Math.max(40, host.clientHeight - 70),
    });

    if (reduce) {
      setInstant(true);
      const a = aim();
      if (a) setPos(a);
      firedRef.current = true;
      setFired(true);
      return;
    }

    setPos(park());

    const go = () => {
      if (!alive) return;
      const a = aim();
      if (!a) return;
      setPos(a);
      firedRef.current = true;
      setFired(true);
    };

    if (typeof delay === 'number') {
      timer = setTimeout(go, delay);
    } else {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io?.disconnect();
            timer = setTimeout(go, 320);
          }
        },
        { threshold: 0.5 },
      );
      io.observe(host);
    }

    // Keep the cursor glued to the target when the layout reflows.
    const resync = () => {
      if (!alive) return;
      setPos(() => (firedRef.current ? aim() ?? park() : park()));
    };

    const ro = new ResizeObserver(resync);
    ro.observe(host);

    const onResize = resync;
    window.addEventListener('resize', onResize);

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      io?.disconnect();
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, delay, side]);

  return (
    <div
      ref={ref}
      className={`pointat${fired ? ' on' : ''}${instant ? ' instant' : ''} side-${side}`}
      style={pos ? { left: `${pos.l}px`, top: `${pos.t}px` } : { left: '-999px', top: '-999px' }}
      aria-hidden="true"
    >
      <span className="pointat-halo" />
      <Mark className="pointat-mark" />
      <span className="pointat-bubble">{label}</span>
    </div>
  );
}
