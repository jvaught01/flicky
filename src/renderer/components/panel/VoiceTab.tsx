import { useState } from 'react';
import type { FlickySettings } from '../../../shared/types';
import { VOICE_PRESETS } from '../../../shared/types';
import { ProviderKey } from './ProviderKey';
import { Slider } from './Slider';

interface VoiceTabProps {
  settings: FlickySettings;
}

export function VoiceTab({ settings }: VoiceTabProps) {
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const selectedVoice = VOICE_PRESETS.find((v) => v.id === settings.voiceId) ?? VOICE_PRESETS[0];

  return (
    <div className="body">
      <ProviderKey
        name="elevenlabs"
        providerLabel="ElevenLabs"
        providerLogo="11"
        providerLogoClass="eleven"
        isSet={settings.apiKeyStatus.elevenlabs}
        keyPlaceholder="xi-..."
        sectionTitle="Voice provider"
        sectionHint="Gives Flicky a voice. Required to speak replies aloud."
      />

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>Voice</div>
        <div className="vpreview">
          <button
            className="play-btn"
            onClick={() => window.flicky.playVoicePreview(settings.voiceId)}
            aria-label="Preview voice"
          >
            ▶
          </button>
          <div className="vpreview-meta">
            <div className="vpreview-name">{selectedVoice.name}</div>
            <div className="vpreview-sub">{selectedVoice.description}</div>
          </div>
          <button className="btn xs" onClick={() => setVoicePickerOpen((x) => !x)}>
            {voicePickerOpen ? 'Close' : 'Change'}
          </button>
        </div>

        {voicePickerOpen && (
          <div className="voice-list" style={{ marginTop: 8 }}>
            {VOICE_PRESETS.map((v) => (
              <button
                key={v.id}
                className={`voice-item ${v.id === settings.voiceId ? 'on' : ''}`}
                onClick={() => {
                  window.flicky.setVoiceId(v.id);
                  setVoicePickerOpen(false);
                }}
              >
                <div>
                  <div className="nm">{v.name}</div>
                  <div className="sub">{v.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>Speed</div>
        <Slider
          value={settings.voiceSpeed}
          min={0.7}
          max={1.2}
          step={0.05}
          format={(v) => `${v.toFixed(2)}×`}
          onChange={(v) => window.flicky.setVoiceSpeed(v)}
        />
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>Stability</div>
        <Slider
          value={settings.voiceStability}
          min={0}
          max={1}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={(v) => window.flicky.setVoiceStability(v)}
        />
      </div>

      <div className="row" style={{ paddingTop: 2 }}>
        <div className="row-main">
          <div className="row-t">Speak replies aloud</div>
          <div className="row-s">auto-play voice response</div>
        </div>
        <button
          className={`toggle ${settings.speakReplies ? 'on' : ''}`}
          onClick={() => window.flicky.setSpeakReplies(!settings.speakReplies)}
          aria-label="Toggle speak replies"
        />
      </div>
    </div>
  );
}
