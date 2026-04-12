import { useRef } from 'react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

export function Slider({ value, min, max, step, format, onChange }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;

  const pick = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    const snapped = Math.round(raw / step) * step;
    onChange(Number(snapped.toFixed(4)));
  };

  return (
    <div className="slider-row">
      <div
        ref={trackRef}
        className="slider-track"
        onMouseDown={(e) => {
          pick(e.clientX);
          const move = (ev: MouseEvent) => pick(ev.clientX);
          const up = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
          };
          window.addEventListener('mousemove', move);
          window.addEventListener('mouseup', up);
        }}
      >
        <div className="fill" style={{ width: `${pct}%` }} />
        <div className="knob" style={{ left: `${pct}%` }} />
      </div>
      <div className="slider-val">{format(value)}</div>
    </div>
  );
}
