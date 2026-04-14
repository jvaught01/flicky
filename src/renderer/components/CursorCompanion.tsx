import { useEffect, useRef } from 'react';
import type { VoiceState } from '../../shared/types';

interface CursorCompanionProps {
  voiceState: VoiceState;
  isNavigating: boolean;
  isHolding: boolean;
  analyserNode: AnalyserNode | null;
}

/** Logical canvas size in CSS px. The canvas renders at SIZE×DPR device pixels. */
const SIZE = 64;

// ── Colour palette per voice state ──────────────────────────────────────────

const STATE_VIVID: Record<string, [number, number, number]> = {
  idle:       [55,  198, 185],
  responding: [55,  198, 185],
  listening:  [240, 210, 70],
  processing: [245, 148, 55],
};
const STATE_GLOW: Record<string, [number, number, number]> = {
  idle:       [144, 194, 209],
  responding: [144, 194, 209],
  listening:  [250, 229, 180],
  processing: [236, 179, 113],
};
const ROSE:  [number, number, number] = [218,  60, 148];
const WHITE: [number, number, number] = [255, 255, 255];
const BASE:  [number, number, number] = [  3,   2,  12];

function rgba(c: [number, number, number], a = 1): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/**
 * Arrow path in SIZE-coordinate space.
 * Original design: 48×48 viewBox — tip at (10,10), tail at (12,48), wing at (48,14).
 */
function buildArrowPath(): Path2D {
  const s = SIZE / 48;
  const p = new Path2D();
  p.moveTo(10 * s, 10 * s);
  p.lineTo(12 * s, 48 * s);
  p.quadraticCurveTo(25 * s, 25 * s, 48 * s, 14 * s);
  p.closePath();
  return p;
}

// ── Component ────────────────────────────────────────────────────────────────

export function CursorCompanion({
  voiceState,
  isNavigating,
  isHolding,
  analyserNode,
}: CursorCompanionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  /**
   * stateRef pattern: single RAF loop started once; props kept in sync via
   * useEffect without ever restarting the animation loop.
   */
  const stateRef = useRef({ voiceState, isNavigating, isHolding, analyserNode, time: 0 });

  useEffect(() => {
    stateRef.current.voiceState = voiceState;
    stateRef.current.isNavigating = isNavigating;
    stateRef.current.isHolding = isHolding;
    stateRef.current.analyserNode = analyserNode;
  }, [voiceState, isNavigating, isHolding, analyserNode]);

  // ── RAF draw loop (mounted once) ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = SIZE * dpr;
    canvas.height = SIZE * dpr;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Pre-build path once; reused every frame (Path2D is immutable + fast).
    const path = buildArrowPath();

    // Gradient anchor points scaled to SIZE
    const s = SIZE / 48;
    const tipX  = 10 * s;
    const tipY  = 10 * s;
    const tailX = 48 * s;
    const tailY = 32 * s;
    const centX = 20 * s;
    const centY = 20 * s;

    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      stateRef.current.time += dt;

      const { voiceState: vs, isNavigating: nav, isHolding: hold, analyserNode: an, time } =
        stateRef.current;

      // ── Audio analysis ─────────────────────────────────────────────────
      let overall = 0;
      let bass = 0;
      if (an) {
        const bins = an.frequencyBinCount;
        const data = new Uint8Array(bins);
        an.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < bins; i++) sum += data[i];
        overall = sum / bins / 255;
        const bassEnd = Math.max(1, Math.floor(bins * 0.1));
        let bassSum = 0;
        for (let i = 0; i < bassEnd; i++) bassSum += data[i];
        bass = bassSum / bassEnd / 255;
      } else {
        // Subtle breathing fallback when mic is idle
        overall = 0.12 + 0.08 * Math.sin(time * 0.42 * Math.PI * 2);
        bass = overall;
      }

      const vivid = STATE_VIVID[vs] ?? STATE_VIVID.idle;
      const glow  = STATE_GLOW[vs]  ?? STATE_GLOW.idle;
      const glowR = 12 + overall * 18 + (nav || hold ? 8 : 0);
      const glowA = 0.30 + bass * 0.38;

      ctx.clearRect(0, 0, SIZE, SIZE);

      // ── Pass 1: Drop shadow ───────────────────────────────────────────
      // shadowBlur is in device px space, unaffected by ctx.scale — multiply by dpr.
      ctx.save();
      ctx.shadowColor   = rgba(BASE, 0.8);
      ctx.shadowBlur    = 8 * dpr;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = rgba(BASE, 0.4);
      ctx.fill(path);
      ctx.restore();

      // ── Pass 2: Clipped crystal body ──────────────────────────────────
      ctx.save();
      ctx.clip(path);

      const bodyGrad = ctx.createLinearGradient(tipX, tipY, tailX, tailY);
      bodyGrad.addColorStop(0.00, rgba(WHITE, 0.92));
      bodyGrad.addColorStop(0.25, rgba(vivid, 0.88));
      bodyGrad.addColorStop(0.65, rgba(vivid, 0.62));
      bodyGrad.addColorStop(1.00, rgba(BASE,  0.80));
      ctx.fillStyle = bodyGrad;
      ctx.fill(path);

      // Inner gloss sweep from tip
      const glossGrad = ctx.createLinearGradient(tipX, tipY, tipX + 14 * s, tipY + 14 * s);
      glossGrad.addColorStop(0, rgba(WHITE, 0.58));
      glossGrad.addColorStop(1, rgba(WHITE, 0.00));
      ctx.fillStyle = glossGrad;
      ctx.fill(path);

      ctx.restore();

      // ── Pass 3: Edge strokes — NO shadowBlur (causes stray line artifacts) ──
      ctx.save();
      ctx.strokeStyle = rgba(WHITE, 0.52);
      ctx.lineWidth   = 1.2;
      ctx.stroke(path);
      ctx.strokeStyle = rgba(vivid, 0.38);
      ctx.lineWidth   = 0.6;
      ctx.stroke(path);
      ctx.restore();

      // ── Pass 4: Ambient Mercury glow (screen blend) ───────────────────
      ctx.save();
      const ambGrad = ctx.createRadialGradient(centX, centY, 0, centX, centY, glowR);
      ambGrad.addColorStop(0, rgba(glow, glowA * 0.65));
      ambGrad.addColorStop(1, rgba(glow, 0));
      ctx.fillStyle = ambGrad;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.restore();

      // ── Pass 5: Rose accent glow when navigating/holding ─────────────
      if (nav || hold) {
        ctx.save();
        ctx.shadowColor = rgba(ROSE, 0.85);
        ctx.shadowBlur  = 12 * dpr;
        ctx.fillStyle   = rgba(ROSE, 0.001); // near-transparent to trigger shadow only
        ctx.fill(path);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []); // intentionally empty — loop runs once, reads via stateRef

  return (
    <canvas
      ref={canvasRef}
      style={{ width: SIZE, height: SIZE, display: 'block', overflow: 'visible' }}
    />
  );
}
