import type { FlickySettings, VoiceState } from '../../../shared/types';
import { Waveform } from '../Waveform';

interface HeroProps {
  voiceState: VoiceState;
  settings: FlickySettings;
}

export function Hero({ voiceState, settings }: HeroProps) {
  const { apiKeyStatus } = settings;
  const connectedCount = [apiKeyStatus.anthropic, apiKeyStatus.elevenlabs, apiKeyStatus.groq].filter(
    Boolean,
  ).length;
  const ready = connectedCount === 3;

  let stateLabel: string;
  let stateClass = '';
  if (voiceState === 'listening') {
    stateLabel = 'Listening';
    stateClass = 'listening';
  } else if (voiceState === 'processing') {
    stateLabel = 'Thinking';
  } else if (voiceState === 'responding') {
    stateLabel = 'Responding';
  } else if (!ready) {
    stateLabel = `Setup · ${connectedCount} of 3`;
    stateClass = 'setup';
  } else {
    stateLabel = 'Ready';
  }

  return (
    <div className="hero">
      <div className="hero-top">
        <div className="logo">F</div>
        <div>
          <div className="brand-name">Flicky</div>
          <div className="brand-sub">your voice companion</div>
        </div>
        <div className={`state ${stateClass}`}>{stateLabel}</div>
      </div>
      <Waveform state={ready ? voiceState : 'idle'} />
      {ready ? (
        <div className="hero-ptt">
          hold <kbd>Ctrl</kbd>
          <kbd>Alt</kbd>
          <kbd>X</kbd> to talk
        </div>
      ) : (
        <div className="hero-ptt blocked">
          {connectedCount === 2
            ? 'one more key needed to start talking'
            : `add ${3 - connectedCount} keys to start talking`}
        </div>
      )}
    </div>
  );
}
