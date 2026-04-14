import { useState } from 'react';
import type { FlickySettings } from '../../../shared/types';
import { VOICE_PRESETS } from '../../../shared/types';
import { ProviderKey } from './ProviderKey';
import { Slider } from './Slider';

interface VoiceTabProps {
  settings: FlickySettings;
}

const TIERS: { key: 'standard' | 'paid'; label: string }[] = [
  { key: 'standard', label: 'Standard' },
  { key: 'paid',     label: 'Paid Library · subscription required' },
];

export function VoiceTab({ settings }: VoiceTabProps) {
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const selectedVoice = VOICE_PRESETS.find((v) => v.id === settings.voiceId) ?? VOICE_PRESETS[0];

  return (
    <>
      <h1 className="main-h1">
        Voice<em>.</em>
      </h1>
      <p className="main-lead">How Flicky sounds. Pick a voice, tune speed and stability, or mute replies for silent mode.</p>

      <div className="section">
        <div className="section-title">Voice provider</div>
        <ProviderKey
          name="elevenlabs"
          providerLabel="ElevenLabs"
          providerLogo="11"
          providerLogoClass="eleven"
          isSet={settings.apiKeyStatus.elevenlabs}
          keyPlaceholder="xi-..."
        />
        <p className="section-hint">Gives Flicky a voice. Required to speak replies aloud.</p>
      </div>

      <div className="section">
        <div className="section-title" style={{ marginBottom: 14 }}>Voice</div>
        <div className="vpreview">
          <button
            className="play-btn"
            onClick={() => window.flicky.playVoicePreview(settings.voiceId)}
            aria-label="Preview voice"
          >
            ▶
          </button>
          <div className="vpreview-meta">
            <div className="vpreview-name">
              {selectedVoice.name}
              {selectedVoice.tier === 'paid' && (
                <span className="voice-tier-badge paid">Paid</span>
              )}
            </div>
            <div className="vpreview-sub">{selectedVoice.description}</div>
          </div>
          <button className="btn xs" onClick={() => setVoicePickerOpen((x) => !x)}>
            {voicePickerOpen ? 'Close' : 'Change'}
          </button>
        </div>

        {voicePickerOpen && (
          <div className="voice-list">
            {TIERS.map(({ key, label }) => {
              const voices = VOICE_PRESETS.filter((v) => (v.tier ?? 'standard') === key);
              if (!voices.length) return null;
              return (
                <div key={key} className="voice-tier-group">
                  <div className={`voice-tier-label ${key}`}>{label}</div>
                  <div className="voice-tier-voices">
                    {voices.map((v) => (
                      <button
                        key={v.id}
                        className={`voice-item ${v.id === settings.voiceId ? 'on' : ''}`}
                        onClick={() => {
                          window.flicky.setVoiceId(v.id);
                          setVoicePickerOpen(false);
                        }}
                      >
                        <div className="nm">{v.name}</div>
                        <div className="sub">{v.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section">
        <div className="row">
          <div className="row-main">
            <div className="row-t">Speed</div>
            <div className="row-s">how fast Flicky speaks</div>
          </div>
          <div style={{ width: 220 }}>
            <Slider
              value={settings.voiceSpeed}
              min={0.7}
              max={1.2}
              step={0.05}
              format={(v) => `${v.toFixed(2)}×`}
              onChange={(v) => window.flicky.setVoiceSpeed(v)}
            />
          </div>
        </div>
        <div className="row">
          <div className="row-main">
            <div className="row-t">Stability</div>
            <div className="row-s">lower = more expressive, higher = more consistent</div>
          </div>
          <div style={{ width: 220 }}>
            <Slider
              value={settings.voiceStability}
              min={0}
              max={1}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(v) => window.flicky.setVoiceStability(v)}
            />
          </div>
        </div>
        <div className="row">
          <div className="row-main">
            <div className="row-t">Speak replies aloud</div>
            <div className="row-s">auto-play voice response after each answer</div>
          </div>
          <button
            className={`toggle ${settings.speakReplies ? 'on' : ''}`}
            onClick={() => window.flicky.setSpeakReplies(!settings.speakReplies)}
            aria-label="Toggle speak replies"
          />
        </div>
      </div>
    </>
  );
}
