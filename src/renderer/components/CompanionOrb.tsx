/**
 * CompanionCursor — Mercury Crystal Arrow
 *
 * Shape: isosceles arrowhead — sharp apex, two equal sides, concave curved back.
 *        3-point path: tip → back-left → (quadratic bezier, inward) → back-right → closePath.
 *        No tail. No notch protrusion. Clean pointer silhouette.
 *
 * Holographic crystal coloring: vivid teal dominant (state-aware) + magenta-pink
 * accent on the lower face. Animated shimmer sweep + audio-reactive glow.
 * Color separation from gradients only — no visible dividing lines.
 *
 * Rendering pipeline:
 *   Pass 1 — drop shadow
 *   Pass 2 — clipped crystal body (base → teal → pink → shimmer → tip glow)
 *   Pass 3 — outline (teal rim + white edge, no shadowBlur)
 *   Pass 4 — ambient Mercury halo
 *   Pass 5 — tight crystal glow
 */

import { useRef, useEffect } from 'react';
import type { VoiceState } from '../../shared/types';

// ── Canvas constants ──────────────────────────────────────────────────────────

const CURSOR_SIZE = 56;
const TIP_X      = 10;
const TIP_Y      = 10;

// ── Color definitions ─────────────────────────────────────────────────────────

type RGB = [number, number, number];

const ROSE:  RGB = [218,  60, 148];
const WHITE: RGB = [255, 255, 255];
const BASE:  RGB = [  3,   2,  12];

const STATE_VIVID: Record<VoiceState, RGB> = {
  idle:       [ 55, 198, 185],
  listening:  [240, 210,  70],
  processing: [245, 148,  55],
  responding: [ 55, 198, 185],
};

const STATE_GLOW: Record<VoiceState, RGB> = {
  idle:       [144, 194, 209],
  listening:  [250, 229, 180],
  processing: [236, 179, 113],
  responding: [144, 194, 209],
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

// ── Arrow path — isosceles arrowhead with concave curved back ─────────────────
//
//  tip(10,10)
//    |\
//    | \  ← right side (closePath straight line)
//    |  \
//    |   back-right(48,14)
//    |  ↗          (quadratic bezier — inward control at (25,25))
//    | ↗  ← concave curved back
//    |↗
//  back-left(12,48)
//
//  Both sides ≈ 38px — isosceles.
//  Control point (25,25) is pulled toward the tip → concave back curve.
//  Bezier tangency at back-left and back-right softens those corners naturally.
//
function buildArrowPath(): Path2D {
  const p = new Path2D();
  const tx = TIP_X, ty = TIP_Y;
  p.moveTo(tx,      ty      );   // tip — sharp apex
  p.lineTo(tx +  2, ty + 38 );   // back-left  (12, 48)
  p.quadraticCurveTo(
    tx + 15, ty + 15,             // control — inward toward tip axis (25, 25)
    tx + 38, ty +  4,             // back-right (48, 14)
  );
  p.closePath();                   // straight right side back to tip
  return p;
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
    vivid:    [...STATE_VIVID.idle] as RGB,
    tgtVivid: [...STATE_VIVID.idle] as RGB,
    glow:     [...STATE_GLOW.idle]  as RGB,
    tgtGlow:  [...STATE_GLOW.idle]  as RGB,
    glowT:    1,
    time:     0,
  });

  useEffect(() => {
    const s = state.current;
    const t = Math.min(s.glowT, 1);
    s.vivid    = lerp3(s.vivid, s.tgtVivid, t);
    s.glow     = lerp3(s.glow,  s.tgtGlow,  t);
    s.tgtVivid = [...STATE_VIVID[voiceState]];
    s.tgtGlow  = [...STATE_GLOW[voiceState]];
    s.voiceState = voiceState;
    s.glowT    = 0;
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

    const arrowPath = buildArrowPath();

    const buf = new Uint8Array(256);
    let raf   = 0;

    function frame() {
      raf = requestAnimationFrame(frame);
      const s = state.current;

      const overall    = getOverall(s.analyser, buf);
      const audioActive = overall > 0.015;
      const breathe    = Math.sin(s.time * 0.42) * 0.5 + 0.5;
      const eBass      = audioActive ? getBass(buf) : breathe * 0.06;

      const speed = s.voiceState === 'idle'       ? 0.010
                  : s.voiceState === 'processing' ? 0.022
                  : 0.015;
      s.time += speed;

      s.glowT = Math.min(s.glowT + 0.04, 1);
      const vividColor = lerp3(s.vivid, s.tgtVivid, s.glowT);
      const glowColor  = lerp3(s.glow,  s.tgtGlow,  s.glowT);
      if (s.glowT >= 1) {
        s.vivid = [...s.tgtVivid] as RGB;
        s.glow  = [...s.tgtGlow]  as RGB;
      }

      const scale = s.isNavigating ? 1.12 : s.isHolding ? 1.06 : 1.0;

      ctx.clearRect(0, 0, CURSOR_SIZE, CURSOR_SIZE);
      ctx.save();  // A

      if (scale !== 1) {
        ctx.translate(TIP_X, TIP_Y);
        ctx.scale(scale, scale);
        ctx.translate(-TIP_X, -TIP_Y);
      }

      // ── PASS 1: Drop shadow ───────────────────────────────────────────
      ctx.save();
      ctx.shadowColor   = 'rgba(0,0,0,0.75)';
      ctx.shadowBlur    = 8 * dpr;
      ctx.shadowOffsetX = 2 * dpr;
      ctx.shadowOffsetY = 3 * dpr;
      ctx.fillStyle     = 'rgba(0,0,0,0.01)';
      ctx.fill(arrowPath);
      ctx.restore();

      // ── PASS 2: Clipped crystal body ──────────────────────────────────
      ctx.save();
      ctx.clip(arrowPath);

      // Dark base
      ctx.fillStyle = rgba(BASE, 1);
      ctx.fillRect(0, 0, CURSOR_SIZE, CURSOR_SIZE);

      // Teal face — radiates from back-right vertex (the lit face)
      const ufGrad = ctx.createRadialGradient(
        TIP_X + 38, TIP_Y + 4, 0,
        TIP_X + 38, TIP_Y + 4, 46,
      );
      ufGrad.addColorStop(0,    rgba(vividColor, 0.95));
      ufGrad.addColorStop(0.20, rgba(vividColor, 0.80));
      ufGrad.addColorStop(0.55, rgba(vividColor, 0.42));
      ufGrad.addColorStop(0.85, rgba(vividColor, 0.10));
      ufGrad.addColorStop(1,    rgba(vividColor, 0));
      ctx.fillStyle = ufGrad;
      ctx.fillRect(0, 0, CURSOR_SIZE, CURSOR_SIZE);

      // Pink face — radiates from back-left vertex (the shadow face)
      const lfGrad = ctx.createRadialGradient(
        TIP_X + 2, TIP_Y + 38, 0,
        TIP_X + 2, TIP_Y + 38, 36,
      );
      lfGrad.addColorStop(0,    rgba(ROSE, 0.88 + eBass * 0.10));
      lfGrad.addColorStop(0.30, rgba(ROSE, 0.55));
      lfGrad.addColorStop(0.65, rgba(ROSE, 0.22));
      lfGrad.addColorStop(1,    rgba(ROSE, 0));
      ctx.fillStyle = lfGrad;
      ctx.fillRect(0, 0, CURSOR_SIZE, CURSOR_SIZE);

      // Holographic shimmer sweep
      const sweepT   = Math.sin(s.time * 0.55) * 0.5 + 0.5;
      const sweepX0  = TIP_X - 8 + sweepT * 46;
      const shimCol  = lerp3(vividColor, WHITE, 0.60);
      const shimGrad = ctx.createLinearGradient(sweepX0, TIP_Y, sweepX0 + 18, TIP_Y + 42);
      shimGrad.addColorStop(0,   rgba(shimCol, 0));
      shimGrad.addColorStop(0.5, rgba(shimCol, 0.34 + eBass * 0.20 + breathe * 0.05));
      shimGrad.addColorStop(1,   rgba(shimCol, 0));
      ctx.fillStyle = shimGrad;
      ctx.fillRect(0, 0, CURSOR_SIZE, CURSOR_SIZE);

      // Tip hot-point
      const tipR    = 5 + eBass * 6 + breathe * 2;
      const tipGrad = ctx.createRadialGradient(TIP_X + 1, TIP_Y + 1, 0, TIP_X + 1, TIP_Y + 1, tipR);
      tipGrad.addColorStop(0,   rgba(WHITE,      0.95));
      tipGrad.addColorStop(0.3, rgba(vividColor, 0.65));
      tipGrad.addColorStop(1,   rgba(vividColor, 0));
      ctx.fillStyle = tipGrad;
      ctx.fillRect(0, 0, CURSOR_SIZE, CURSOR_SIZE);

      ctx.restore();  // end clip

      // ── PASS 3: Outline (no shadowBlur) ──────────────────────────────
      ctx.save();
      ctx.lineWidth   = 2.5;
      ctx.strokeStyle = rgba(vividColor, 0.72 + eBass * 0.18 + breathe * 0.06);
      ctx.lineJoin    = 'round';
      ctx.stroke(arrowPath);
      ctx.restore();

      ctx.save();
      ctx.lineWidth   = 1.1;
      ctx.strokeStyle = rgba(WHITE, 0.84 + eBass * 0.12);
      ctx.lineJoin    = 'round';
      ctx.stroke(arrowPath);
      ctx.restore();

      // ── PASS 4: Ambient Mercury glow ─────────────────────────────────
      ctx.save();
      ctx.shadowColor = rgba(glowColor, 0.22 + eBass * 0.14 + breathe * 0.06);
      ctx.shadowBlur  = (12 + eBass * 12 + breathe * 4) * dpr;
      ctx.fillStyle   = rgba(glowColor, 0.01);
      ctx.fill(arrowPath);
      ctx.restore();

      // ── PASS 5: Tight crystal glow ────────────────────────────────────
      ctx.save();
      ctx.shadowColor = rgba(vividColor, 0.68 + eBass * 0.22 + breathe * 0.08);
      ctx.shadowBlur  = (4 + eBass * 7 + breathe * 2) * dpr;
      ctx.fillStyle   = rgba(vividColor, 0.01);
      ctx.fill(arrowPath);
      ctx.restore();

      ctx.restore();  // A
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
        transform:     `translate(-${TIP_X}px, -${TIP_Y}px)`,
        pointerEvents: 'none',
        display:       'block',
      }}
    />
  );
}
