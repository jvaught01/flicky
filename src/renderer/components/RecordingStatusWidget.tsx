import { AudioWaveform } from './AudioWaveform';

/**
 * Ported from voquill's RecordingStatusWidget.tsx.
 * MUI + react-intl stripped; same structure, same phases, same layout.
 */

export type RecordingPhase = 'idle' | 'recording' | 'processing';

export interface RecordingStatusWidgetProps {
  phase: RecordingPhase;
  levels: number[];
  idleLabel?: string;
}

export function RecordingStatusWidget({
  phase,
  levels,
  idleLabel = 'Hold Ctrl+Alt+X to dictate',
}: RecordingStatusWidgetProps) {
  const isIdle = phase === 'idle';
  const isListening = phase === 'recording';
  const isProcessing = phase === 'processing';

  return (
    <div className="rec-pill">
      <div className="rec-inner">
        <div
          className="rec-idle-label"
          style={{ opacity: isIdle ? 1 : 0 }}
        >
          {idleLabel}
        </div>

        <div
          className="rec-processing-layer"
          style={{ opacity: isProcessing ? 1 : 0 }}
        >
          <div className="rec-progress">
            <div className="rec-progress-bar" />
          </div>
        </div>

        <div
          className="rec-waveform-layer"
          style={{ opacity: isListening ? 1 : 0 }}
        >
          <AudioWaveform
            levels={levels}
            active={isListening}
            processing={isProcessing}
            strokeColor="#ffffff"
            width={120}
            height={36}
            baselineOffset={3}
          />
        </div>

        <div
          className="rec-edge-fade"
          style={{ opacity: isIdle ? 0 : 1 }}
        />
      </div>
    </div>
  );
}
