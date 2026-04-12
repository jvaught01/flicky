/**
 * CompanionCursor — Canvas-rendered classic pointer cursor.
 *
 * Replaces the Mercury Surface orb with a precision arrow-pointer cursor.
 * The cursor tip aligns exactly with the tracked mouse position.
 *
 * Visual design:
 *   - Classic OS arrow-pointer shape (Path2D, no bitmaps)
 *   - Black fill with semi-transparent white outline stroke
 *   - Mercury-palette state glow (shadowBlur) — audio-reactive intensity
 *   - Scale pulse on navigate / hold transitions
 *
 * Mercury glow per state:
 *   idle        — Parker teal    (#90C2D1)   slow breath
 *   listening   — Delicate Gold  (#FAE5B4)   warm, alert
 *   processing  — Caramel        (#ECB371)   amber, deliberate
 *   responding  — Parker teal    (#90C2D1)   expressive, flowing
 */

import { useRef, useEffect } from 'react';
import type { VoiceState } from '../../shared/types';

// ── Canvas constants ──────────────────────────────────────────────────────────

const CURSOR_SIZE = 48;   // CSS px — square canvas (includes glow headroom)

// Cursor tip sits at (TIP_X, TIP_Y) within the canvas.
// The element transform `translate(-TIP_X, -TIP_Y)` aligns the tip with the
// anchor div's position, which tracks the real mouse position.
const TIP_X = 8;
const TIP_Y = 8;
const S     = 1.10;  // path scale — cursor body spans ~18×26 CSS px

// ── Mercury palette ───────────────────────────────────────────────────────────

type RGB = [number, number, number];

const PARKER:  RGB = [144, 194, 209];  // #90C2D1
const CARAMEL: RGB = [236, 179, 113];  // #ECB371
const GOLD:    RGB = [250, 229, 180];  // #FAE5B4

// Per-state glow colour
const STATE_GLOW: Record<VoiceState, RGB> = {
  idle:       PARKER,
  listening:  GOLD,
  processing: CARAMEL,
  responding: PARKER,
};

function lerp3(a: RGB, b: RGB, t: number): RGB {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function rgba(c: RGB, a: number): string {
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a.toFixed(3)})`;
}

// ── Audio helpers ─────────────────────────────────────────────────────────────

function getOverall(analyser: AnalyserNode | null, buf: Uint8Array): number {
  if (!analyser) return 0;
  analyser.getByteFrequencyData(buf);
  const len = buf.length;
  let s = 0;
  for (let i = 0; i < len; i++) s += buf[i];
  return s / (len * 255);
}

function getBass(buf: Uint8Array): number {
  const hi = Math.floor(buf.length * 0.10);
  let s = 0;
  for (let i = 0; i < hi; i++) s += buf[i];
  return s / (hi * 255);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  voiceState:   VoiceState;
  isNavigating: boolean;
  isHolding:    boolean;
  analyser:     AnalyserNode | null;
}

export function CompanionOrb({ voiceState, isNavigating, isHolding, analyser }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const state = useRef({
    voiceState,
    isNavigating,
    isHolding,
    analyser,
    glow:    [...STATE_GLOW.idle]    as RGB,
    tgtGlow: [...STATE_GLOW.idle]    as RGB,
    glowT:   1,
    time:    0,
  });

  // Snapshot mid-transition glow colour on state change
  useEffect(() => {
    const s = state.current;
    const t = Math.min(s.glowT, 1);
    s.glow    = lerp3(s.glow, s.tgtGlow, t);
    s.tgtGlow = [...STATE_GLOW[voiceState]];
    s.voiceState = voiceState;
    s.glowT   = 0;
  }, [voiceState]);

  useEffect(() => { state.current.isNavigating = isNavigating; }, [isNavigating]);
  useEffect(() => { state.current.isHolding    = isHolding;    }, [isHolding]);
  useEffect(() => { state.current.analyser     = analyser;     }, [analyser]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CURSOR_SIZE * dpr;
    canvas.height = CURSOR_SIZE * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // ── Arrow-pointer path (built once, reused every frame) ────────────────
    // Classic OS cursor shape: tip at (TIP_X, TIP_Y), body scaled by S.
    //
    //   Tip ──────────────── upper-right edge
    //   │                    /
    //   left edge           /
    //   │         inner-right notch
    //   │        /
    //   notch ──── tail bottom ── tail right
    //
    const p = new Path2D();
    p.moveTo(TIP_X,            TIP_Y           );   // tip
    p.lineTo(TIP_X,            TIP_Y + 20 * S  );   // left edge bottom
    p.lineTo(TIP_X +  5 * S,   TIP_Y + 15 * S  );   // inner notch
    p.lineTo(TIP_X + 12 * S,   TIP_Y + 23 * S  );   // tail bottom
    p.lineTo(TIP_X + 15 * S,   TIP_Y + 20 * S  );   // tail right
    p.lineTo(TIP_X +  8 * S,   TIP_Y + 13 * S  );   // inner right notch
    p.lineTo(TIP_X + 16 * S,   TIP_Y +  2 * S  );   // upper right edge
    p.closePath();

    const buf = new Uint8Array(256);
    let raf   = 0;

    function frame() {
      raf = requestAnimationFrame(frame);
      const s = state.current;

      // ── Audio ────────────────────────────────────────────────────────────
      const overall = getOverall(s.analyser, buf);
      const audioActive = overall > 0.015;
      const breathe = Math.sin(s.time * 0.42) * 0.5 + 0.5;
      const eBass   = audioActive ? getBass(buf) : breathe * 0.10;

      // ── Time ─────────────────────────────────────────────────────────────
      const baseSpeed = s.voiceState === 'idle' ? 0.012
                      : s.voiceState === 'processing' ? 0.022
                      : 0.016;
      s.time += baseSpeed;

      // ── Glow colour crossfade ─────────────────────────────────────────────
      s.glowT = Math.min(s.glowT + 0.04, 1);
      const glowColor = lerp3(s.glow, s.tgtGlow, s.glowT);
      if (s.glowT >= 1) s.glow = [...s.tgtGlow] as RGB;

      // ── Scale on navigate/hold ────────────────────────────────────────────
      const scale = s.isNavigating ? 1.12 : s.isHolding ? 1.06 : 1.0;

      ctx.clearRect(0, 0, CURSOR_SIZE, CURSOR_SIZE);
      ctx.save();

      if (scale !== 1) {
        ctx.translate(TIP_X, TIP_Y);
        ctx.scale(scale, scale);
        ctx.translate(-TIP_X, -TIP_Y);
      }

      // ── Glow pass — state-coloured Mercury shadow ─────────────────────────
      const glowAlpha = 0.50 + eBass * 0.38 + breathe * 0.07;
      const glowBlur  = (8 + eBass * 14 + breathe * 3) * dpr;

      ctx.save();
      ctx.shadowColor = rgba(glowColor, glowAlpha);
      ctx.shadowBlur  = glowBlur;
      ctx.lineWidth   = 7 * dpr;
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.stroke(p);
      ctx.restore();

      // ── Black fill — on top of stroke, no shadow needed ───────────────────
      // Filling after stroking leaves only the outer half of the stroke
      // visible as a white outline — exactly matching the reference design.
      ctx.fillStyle = '#0B0B0B';
      ctx.fill(p);

      ctx.restore();
    }

    frame();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width:         CURSOR_SIZE,
        height:        CURSOR_SIZE,
        // Shift the canvas so the tip at (TIP_X, TIP_Y) aligns exactly
        // with the anchor div's position (the tracked cursor coordinate).
        transform:     `translate(-${TIP_X}px, -${TIP_Y}px)`,
        pointerEvents: 'none',
        display:       'block',
      }}
    />
  );
}
