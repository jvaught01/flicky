import type { VoiceState } from '../../shared/types';

interface WaveformProps {
  /** Drives animation + color. */
  state: VoiceState;
  bars?: number;
  /** Height in px for each bar's container. */
  height?: number;
  className?: string;
}

/**
 * Hero-style animated waveform used both in the panel hero and in the
 * overlay while Flicky is listening. Pure CSS animation keyed off
 * --wf-state on the root so appearance follows voice state.
 */
export function Waveform({ state, bars = 19, height = 42, className }: WaveformProps) {
  const active = state === 'listening' || state === 'responding';
  const items = Array.from({ length: bars });

  return (
    <div
      className={`wf ${active ? 'wf-active' : 'wf-quiet'} wf-${state} ${className ?? ''}`}
      style={{ ['--wf-height' as string]: `${height}px`, ['--wf-bars' as string]: String(bars) }}
    >
      {items.map((_, i) => (
        <span
          key={i}
          className="wf-bar"
          style={{
            animationDelay: `${(i * 60) / 1000}s`,
            ['--wf-idx' as string]: String(i),
          }}
        />
      ))}
    </div>
  );
}
