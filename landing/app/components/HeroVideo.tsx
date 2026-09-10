'use client';

import { useEffect, useRef } from 'react';
import { Win } from './Win';

/**
 * The demo clip, inside the Windows-11 window frame. Autoplays muted
 * and looping, but stops for anyone who asked for reduced motion (and
 * shows controls instead so they can still play it themselves).
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (mq.matches) {
        el.autoplay = false;
        el.loop = false;
        el.controls = true;
        el.pause();
      } else {
        el.controls = false;
        el.loop = true;
        void el.play().catch(() => {});
      }
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <Win title="flicky-demo.mp4" className="video-win" flush>
      <video
        ref={ref}
        src="/flicky-hero2-1776235182036.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Flicky answering a question about what's on screen"
      />
    </Win>
  );
}
