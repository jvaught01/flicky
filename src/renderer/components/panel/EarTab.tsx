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
    <div className="body">
      <ProviderKey
        name="groq"
        providerLabel="Groq"
        providerLogo="G"
        providerLogoClass="groq"
        isSet={settings.apiKeyStatus.groq}
        keyPlaceholder="gsk_..."
        sectionTitle="Transcription provider"
        sectionHint="Transcribes your voice fast and accurately."
      />

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>Model</div>
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
    </div>
  );
}
