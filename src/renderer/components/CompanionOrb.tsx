/**
 * CompanionOrb — Mercury Surface Edition
 *
 * Visual layers (back → front):
 *   1. Outer aura           — audio-reactive bloom, Mercury-palette state-coloured
 *   2. Deep glass base      — American navy anchors the orb; denser than desktop
 *   3. Liquid mercury yolk  — primary drifting radial (Caramel/Gold), bass-reactive
 *   4. Secondary reflection — cooler counter-drifting pool (Parker/Dark Metal)
 *   5. Inner vignette       — edge depth, mimics glass curvature
 *   6. Chromatic aberration — R/B offset arcs via screen blend; prismatic glass edge
 *   7. Glass ring bevel     — Gold top-left → American bottom-right gradient stroke
 *   8. Rotating specular    — mirror-sharp Delicate Gold arc constrained to ring band
 *   9. Centre pulse         — bass-reactive radial, state-yolk coloured
 *
 * Mercury Color Scheme per state:
 *   idle        — Parker teal aura · Dark Metal interior · slow drift
 *   listening   — Delicate Gold bloom · Gold yolk warming · Parker secondary
 *   processing  — Caramel amber aura · pulsing faster · Dark Metal secondary
 *   responding  — Parker aura · Gold yolk · Caramel secondary · warm expressive
 */

import { useRef, useEffect } from 'react';
import type { VoiceState } from '../../shared/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const ORB_SIZE = 44;   // CSS px — smaller, sits beside cursor (was 62)
const RING_R   = 16;   // CSS px ring radius

// ── Mercury Color Palette ─────────────────────────────────────────────────────

type RGB = [number, number, number];

const PARKER:     RGB = [144, 194, 209];  // #90C2D1  soft teal-cyan
const AMERICAN:   RGB = [49,  57,  99 ];  // #313963  deep navy-indigo
const DARK_METAL: RGB = [107, 115, 123];  // #6B737B  cool steel-grey
const CARAMEL:    RGB = [236, 179, 113];  // #ECB371  warm amber
const GOLD:       RGB = [250, 229, 180];  // #FAE5B4  pale champagne-gold

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

// ── Per-state configuration ───────────────────────────────────────────────────

interface StateCfg {
  aura:       RGB;    // outer bloom colour
  yolkCore:   RGB;    // centre of primary mercury pool
  yolkEdge:   RGB;    // rim fade of primary mercury pool
  secondary:  RGB;    // counter-drifting reflection blob
  driftFreqX: number; // Lissajous x-axis frequency — controls path shape
  driftFreqY: number; // Lissajous y-axis frequency — incommensurable = non-repeating
}

const STATE_CFG: Record<VoiceState, StateCfg> = {
  //                                                                 driftFreqX  driftFreqY
  idle:       { aura: PARKER,  yolkCore: DARK_METAL, yolkEdge: AMERICAN, secondary: DARK_METAL, driftFreqX: 1.00, driftFreqY: 0.76 },
  listening:  { aura: GOLD,    yolkCore: GOLD,        yolkEdge: PARKER,   secondary: PARKER,     driftFreqX: 1.40, driftFreqY: 0.83 },
  processing: { aura: CARAMEL, yolkCore: CARAMEL,     yolkEdge: AMERICAN, secondary: DARK_METAL, driftFreqX: 1.80, driftFreqY: 1.10 },
  responding: { aura: PARKER,  yolkCore: GOLD,        yolkEdge: PARKER,   secondary: CARAMEL,    driftFreqX: 1.10, driftFreqY: 0.65 },
};

// ── Audio helpers ─────────────────────────────────────────────────────────────

interface AudioMetrics { bass: number; mid: number; high: number; overall: number; }

function getMetrics(analyser: AnalyserNode | null, buf: Uint8Array): AudioMetrics {
  if (!analyser) return { bass: 0, mid: 0, high: 0, overall: 0 };
  analyser.getByteFrequencyData(buf);
  const len = buf.length;
  const avg = (lo: number, hi: number) => {
    let s = 0;
    for (let i = lo; i < hi; i++) s += buf[i];
    return s / ((hi - lo) * 255);
  };
  const bass    = avg(0,                      Math.floor(len * 0.10));
  const mid     = avg(Math.floor(len * 0.10), Math.floor(len * 0.40));
  const high    = avg(Math.floor(len * 0.40), Math.floor(len * 0.80));
  const overall = bass * 0.5 + mid * 0.3 + high * 0.2;
  return { bass, mid, high, overall };
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

  // All mutable render state lives here — the RAF loop never restarts on prop changes.
  const state = useRef({
    voiceState,
    isNavigating,
    isHolding,
    analyser,
    cfg:    STATE_CFG.idle as StateCfg,
    tgtCfg: STATE_CFG.idle as StateCfg,
    cfgT:   1,
    time:   0,
  });

  // On state change: snapshot the current mid-transition colour as the new origin,
  // preventing any visible jump when voiceState changes during a crossfade.
  useEffect(() => {
    const s = state.current;
    const t = Math.min(s.cfgT, 1);
    s.cfg = {
      aura:       lerp3(s.cfg.aura,      s.tgtCfg.aura,      t),
      yolkCore:   lerp3(s.cfg.yolkCore,  s.tgtCfg.yolkCore,  t),
      yolkEdge:   lerp3(s.cfg.yolkEdge,  s.tgtCfg.yolkEdge,  t),
      secondary:  lerp3(s.cfg.secondary, s.tgtCfg.secondary,  t),
      driftFreqX: s.cfg.driftFreqX + (s.tgtCfg.driftFreqX - s.cfg.driftFreqX) * t,
      driftFreqY: s.cfg.driftFreqY + (s.tgtCfg.driftFreqY - s.cfg.driftFreqY) * t,
    };
    s.tgtCfg    = STATE_CFG[voiceState];
    s.voiceState = voiceState;
    s.cfgT      = 0;
  }, [voiceState]);

  useEffect(() => { state.current.isNavigating = isNavigating; }, [isNavigating]);
  useEffect(() => { state.current.isHolding    = isHolding;    }, [isHolding]);
  useEffect(() => { state.current.analyser     = analyser;     }, [analyser]);

  // Single RAF loop — lives for the lifetime of the overlay window.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = ORB_SIZE * dpr;
    canvas.height = ORB_SIZE * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const cx  = ORB_SIZE / 2;
    const cy  = ORB_SIZE / 2;
    const r   = RING_R;
    const buf = new Uint8Array(256);
    let raf   = 0;

    function frame() {
      raf = requestAnimationFrame(frame);
      const s = state.current;

      // ── Audio ──────────────────────────────────────────────────────────
      const { bass, mid, high, overall } = getMetrics(s.analyser, buf);
      const audioActive = overall > 0.015;
      const breathe     = Math.sin(s.time * 0.38) * 0.5 + 0.5;  // 0→1 procedural breath
      const eBass  = audioActive ? bass  : breathe * 0.12;
      const eMid   = audioActive ? mid   : breathe * 0.06;
      const eHigh  = audioActive ? high  : breathe * 0.04;

      // ── Time ───────────────────────────────────────────────────────────
      const speedMult = 1 + (audioActive ? eMid * 3.0 : breathe * 0.45);
      const baseSpeed = s.voiceState === 'idle'
                      ? 0.009
                      : s.voiceState === 'processing'
                      ? 0.019
                      : 0.014;
      s.time += baseSpeed * speedMult;

      // ── Colour crossfade ───────────────────────────────────────────────
      s.cfgT = Math.min(s.cfgT + 0.035, 1);
      const t = s.cfgT;
      const C: StateCfg = {
        aura:       lerp3(s.cfg.aura,      s.tgtCfg.aura,      t),
        yolkCore:   lerp3(s.cfg.yolkCore,  s.tgtCfg.yolkCore,  t),
        yolkEdge:   lerp3(s.cfg.yolkEdge,  s.tgtCfg.yolkEdge,  t),
        secondary:  lerp3(s.cfg.secondary, s.tgtCfg.secondary,  t),
        driftFreqX: s.cfg.driftFreqX + (s.tgtCfg.driftFreqX - s.cfg.driftFreqX) * t,
        driftFreqY: s.cfg.driftFreqY + (s.tgtCfg.driftFreqY - s.cfg.driftFreqY) * t,
      };
      if (t >= 1) s.cfg = { ...s.tgtCfg };

      // Scale up slightly when locked onto a target element
      const scale = s.isNavigating ? 1.14 : s.isHolding ? 1.07 : 1.0;

      ctx.clearRect(0, 0, ORB_SIZE, ORB_SIZE);
      ctx.save();
      if (scale !== 1) {
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
      }

      // ── Layer 1 — Outer aura (Mercury-palette, audio-reactive bloom) ───
      const glowRadius = r + 5 + eBass * 9;
      const glowAlpha  = 0.22 + eBass * 0.35;
      const glowGrad   = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, glowRadius);
      glowGrad.addColorStop(0,   rgba(C.aura, glowAlpha));
      glowGrad.addColorStop(0.4, rgba(C.aura, glowAlpha * 0.36));
      glowGrad.addColorStop(1,   rgba(C.aura, 0));
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // ── Layer 2 — Deep glass base (American navy) ──────────────────────
      // Denser than the previous transparent base — mercury reads as a
      // dense, weighty material rather than a barely-there ghost.
      const base = ctx.createRadialGradient(cx, cy * 0.72, 0, cx, cy, r);
      base.addColorStop(0, rgba(AMERICAN, 0.36));
      base.addColorStop(1, rgba(AMERICAN, 0.54));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = base;
      ctx.fill();

      // ── Layers 3 & 4 — Liquid mercury interior (clipped to orb) ───────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r - dpr * 0.4, 0, Math.PI * 2);
      ctx.clip();

      if (s.voiceState === 'processing') {
        // ── Laminar streamline flow (Poiseuille profile) ─────────────────
        // Three parallel horizontal streams; center moves fastest, edges slowest.
        // Horizontally-stretched radials form band geometry. Slow viscous clock.
        // Each stream has an even 2π/3 phase offset so they're clearly distinct.
        //
        //   stream  yFrac   speed    Poiseuille v = v_max × (1 − (y/R)²)
        //     0     −0.30   0.45 ─── edge, slow
        //     1      0.00   1.00 ─── centre, fastest
        //     2     +0.30   0.45 ─── edge, slow
        //
        const lT = s.time * 0.32;  // viscous pacing — deliberate, unhurried
        const streamDefs: Array<{ yFrac: number; speed: number; phase: number; color: RGB }> = [
          { yFrac: -0.30, speed: 0.45, phase: 0.00, color: C.secondary },
          { yFrac:  0.00, speed: 1.00, phase: 2.09, color: C.yolkCore  },
          { yFrac: +0.30, speed: 0.45, phase: 4.19, color: C.secondary },
        ];

        for (const st of streamDefs) {
          const xOff = Math.sin(lT * st.speed + st.phase) * r * 0.20;
          const xc   = cx + xOff;
          const yc   = cy + st.yFrac * r;

          // Stretch 3.2× horizontally — converts radial to streamline band shape
          ctx.save();
          ctx.translate(xc, yc);
          ctx.scale(3.2, 1.0);
          ctx.translate(-xc, -yc);

          // Band radius + breathe pulse keeps it alive when no audio is present
          const sR   = r * 0.26 + breathe * r * 0.04 + eMid * r * 0.07;
          const sAlp = (st.yFrac === 0 ? 0.84 : 0.60) + breathe * 0.08;
          const sg   = ctx.createRadialGradient(xc, yc, 0, xc, yc, sR);
          sg.addColorStop(0,    rgba(st.color, sAlp));
          sg.addColorStop(0.50, rgba(st.color, sAlp * 0.42));
          sg.addColorStop(1,    rgba(st.color, 0));
          ctx.beginPath();
          ctx.arc(xc, yc, sR, 0, Math.PI * 2);
          ctx.fillStyle = sg;
          ctx.fill();
          ctx.restore();
        }
      } else {
        // ── Lissajous yolk + secondary (idle / listening / responding) ───

        // Primary yolk: Lissajous drift — frequency driven by state config
        const yolkX = cx + Math.cos(s.time * C.driftFreqX) * r * 0.30;
        const yolkY = cy + Math.sin(s.time * C.driftFreqY) * r * 0.20;
        const yolkR = r * 0.72 + eBass * r * 0.24;
        const yolk  = ctx.createRadialGradient(yolkX, yolkY, 0, yolkX, yolkY, yolkR);
        yolk.addColorStop(0,    rgba(C.yolkCore, 0.78 + eBass * 0.16));
        yolk.addColorStop(0.45, rgba(C.yolkEdge, 0.36 + eMid  * 0.14));
        yolk.addColorStop(1,    rgba(C.yolkEdge, 0));
        ctx.beginPath();
        ctx.arc(yolkX, yolkY, yolkR, 0, Math.PI * 2);
        ctx.fillStyle = yolk;
        ctx.fill();

        // Secondary reflection: independent frequency + phase offset — trails
        // the primary rather than mirroring it; creates convincing liquid depth.
        const secX = cx + Math.cos(s.time * 1.30 + 2.10) * r * 0.18;
        const secY = cy + Math.sin(s.time * 0.97 + 2.10) * r * 0.12;
        const secR = r * 0.30 + eMid * r * 0.14;
        const sec  = ctx.createRadialGradient(secX, secY, 0, secX, secY, secR);
        sec.addColorStop(0,   rgba(C.secondary, 0.42 + eMid * 0.18));
        sec.addColorStop(0.5, rgba(C.secondary, 0.14));
        sec.addColorStop(1,   rgba(C.secondary, 0));
        ctx.beginPath();
        ctx.arc(secX, secY, secR, 0, Math.PI * 2);
        ctx.fillStyle = sec;
        ctx.fill();
      }

      ctx.restore();

      // ── Layer 5 — Inner vignette (glass curvature depth) ───────────────
      const vig = ctx.createRadialGradient(cx, cy, r * 0.42, cx, cy, r);
      vig.addColorStop(0,    'rgba(0,0,0,0)');
      vig.addColorStop(0.62, 'rgba(0,0,0,0)');
      vig.addColorStop(1,    'rgba(0,0,12,0.52)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = vig;
      ctx.fill();

      // ── Layer 6 — Chromatic aberration (prismatic glass edge) ──────────
      // R offset top-right, B offset bottom-left via screen blend.
      // Green channel is supplied by the bevel stroke (layer 7).
      const CA  = 1.0;
      const caW = 1.3 * dpr;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.lineWidth = caW;
      ctx.beginPath();
      ctx.arc(cx + CA * 0.70, cy - CA * 0.70, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,80,80,0.18)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - CA * 0.70, cy + CA * 0.70, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(80,80,255,0.18)';
      ctx.stroke();
      ctx.restore();

      // ── Layer 7 — Glass ring bevel (Mercury palette) ───────────────────
      const ringW = 1.8 * dpr;

      // Shadow anchor — depth separation from desktop
      ctx.beginPath();
      ctx.arc(cx, cy, r + ringW * 0.35, 0, Math.PI * 2);
      ctx.lineWidth   = ringW * 1.5;
      ctx.strokeStyle = 'rgba(0,0,14,0.62)';
      ctx.stroke();

      // Bevel: Delicate Gold top-left (warm highlight) → American deep navy
      // bottom-right (cool shadow) — distinct from any violet/indigo AriaOrb bevel.
      const bevel = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      bevel.addColorStop(0,    rgba(GOLD,       0.82));
      bevel.addColorStop(0.20, rgba(PARKER,     0.42));
      bevel.addColorStop(0.55, rgba(DARK_METAL, 0.18));
      bevel.addColorStop(1,    rgba(AMERICAN,   0.58));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth   = ringW;
      ctx.strokeStyle = bevel;
      ctx.stroke();

      // ── Layer 8 — Rotating specular (mirror-sharp Delicate Gold arc) ───
      const shimmerAngle = s.time * 0.48;
      const shimmerAlpha = 0.55 + eHigh * 0.32;
      const sx      = cx + Math.cos(shimmerAngle) * r;
      const sy      = cy + Math.sin(shimmerAngle) * r;
      const shimmerR = (5 + eHigh * 4) * dpr;

      const shimmer = ctx.createRadialGradient(sx, sy, 0, sx, sy, shimmerR);
      shimmer.addColorStop(0,    rgba(GOLD, shimmerAlpha));
      shimmer.addColorStop(0.35, rgba(GOLD, shimmerAlpha * 0.36));
      shimmer.addColorStop(1,    'rgba(255,255,255,0)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r + ringW, 0, Math.PI * 2);
      ctx.arc(cx, cy, r - ringW, 0, Math.PI * 2, true);
      ctx.clip('evenodd');
      ctx.beginPath();
      ctx.arc(sx, sy, shimmerR, 0, Math.PI * 2);
      ctx.fillStyle = shimmer;
      ctx.fill();
      ctx.restore();

      // ── Layer 9 — Centre pulse (bass-reactive, state-yolk coloured) ────
      const pulseR = (0.11 + eBass * 0.20) * r;
      const pulse  = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
      pulse.addColorStop(0,   rgba(C.yolkCore, 0.38 + eBass * 0.36));
      pulse.addColorStop(0.6, rgba(C.yolkCore, 0.10 + eBass * 0.14));
      pulse.addColorStop(1,   rgba(C.yolkCore, 0));
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = pulse;
      ctx.fill();

      ctx.restore();
    }

    frame();
    return () => cancelAnimationFrame(raf);
  }, []); // intentionally empty — all live state is read from ref each frame

  return (
    <canvas
      ref={canvasRef}
      style={{
        width:         ORB_SIZE,
        height:        ORB_SIZE,
        // Sits to the right of the cursor tip, vertically centred on it.
        // translate(8px, -50%) = 8px gap from cursor, vertically centred.
        transform:     'translate(8px, -50%)',
        pointerEvents: 'none',
        display:       'block',
        borderRadius:  '50%',
      }}
    />
  );
}
