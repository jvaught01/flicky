import type { FlickySettings, GroqTranscriptionModel } from '../../../shared/types';
import { ProviderKey } from './ProviderKey';

interface EarTabProps {
  settings: FlickySettings;
}

const MODELS: Array<{
  id: GroqTranscriptionModel;
  name: string;
  sub: string;
  tag?: { label: string; cls: string };
}> = [
  { id: 'whisper-large-v3', name: 'Whisper Large v3', sub: 'highest accuracy · multilingual' },
  {
    id: 'whisper-large-v3-turbo',
    name: 'Whisper Large v3 Turbo',
    sub: 'fast · multilingual',
    tag: { label: 'default', cls: 'info' },
  },
  {
    id: 'distil-whisper-large-v3-en',
    name: 'Distil Whisper English',
    sub: 'fastest · english only',
    tag: { label: 'fastest', cls: 'free' },
  },
];

export function EarTab({ settings }: EarTabProps) {
  return (
    <>
      <h1 className="main-h1">
        Ear<em>.</em>
      </h1>
      <p className="main-lead">How Flicky hears you. Pick a transcription model based on the tradeoff between speed and accuracy.</p>

      <div className="section">
        <div className="section-title">Transcription provider</div>
        <ProviderKey
          name="groq"
          providerLabel="Groq"
          providerLogo="G"
          providerLogoClass="groq"
          isSet={settings.apiKeyStatus.groq}
          keyPlaceholder="gsk_..."
        />
        <p className="section-hint">Transcribes your voice fast and accurately.</p>
      </div>

      <div className="section">
        <div className="section-title" style={{ marginBottom: 14 }}>Model</div>
        <div className="model-list">
          {MODELS.map((m) => (
            <button
              key={m.id}
              className={`model-item ${settings.groqTranscriptionModel === m.id ? 'on' : ''}`}
              onClick={() => window.flicky.setGroqModel(m.id)}
            >
              <div className="model-radio" />
              <div className="model-meta">
                <div className="model-name">{m.name}</div>
                <div className="model-sub">{m.sub}</div>
              </div>
              {m.tag && <div className={`model-tag ${m.tag.cls}`}>{m.tag.label}</div>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
