'use client';

import { useEffect, useRef, useState } from 'react';
import { Mark } from './Mark';

/**
 * Page-wide companion cursor — mirrors the real Flicky overlay: the
 * blue triangle trails your real mouse at the same +14px / +8px
 * offset the desktop app uses. Pointer-events are off so it never
 * blocks clicks or text selection, and it's hidden entirely on
 * touch / no-hover devices since there's nothing to follow.
 */
export function FlickyCursor() {
  const [visible, setVisible] = useState(false);
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Bail on touch / coarse-pointer devices.
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let raf = 0;
    let lastX = 0;
    let lastY = 0;
    let hasPos = false;

    const apply = () => {
      raf = 0;
      if (!elRef.current) return;
      elRef.current.style.transform = `translate3d(${lastX + 14}px, ${lastY + 8}px, 0)`;
    };

    const onMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!hasPos) {
        hasPos = true;
        setVisible(true);
      }
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => {
      if (hasPos) setVisible(true);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={elRef}
      className="flicky-cursor"
      aria-hidden="true"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <Mark className="flicky-cursor-mark" />
    </div>
  );
}
