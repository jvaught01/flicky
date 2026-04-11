import { useState, useEffect } from 'react';
import type { VoiceState, FlickySettings, ClaudeModel, GroqTranscriptionModel, ApiKeyName } from '../../shared/types';

const STATUS_LABELS: Record<VoiceState, string> = {
  idle: 'Ready',
  listening: 'Listening',
  processing: 'Processing',
  responding: 'Responding',
};

const API_KEY_LABELS: Record<ApiKeyName, { label: string; placeholder: string; required: boolean }> = {
  anthropic: {
    label: 'Anthropic',
    placeholder: 'sk-ant-...',
    required: true,
  },
  elevenlabs: {
    label: 'ElevenLabs',
    placeholder: 'xi-...',
    required: false,
  },
  groq: {
    label: 'Groq',
    placeholder: 'gsk_...',
    required: false,
  },
};

export function PanelApp() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [settings, setSettings] = useState<FlickySettings | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    window.flicky.getSettings().then(setSettings);
    window.flicky.getPermissions().then(setPermissions);

    const unsubs = [
      window.flicky.onVoiceStateChanged(setVoiceState),
      window.flicky.onSettingsChanged(setSettings),
      window.flicky.onPermissionStatus(setPermissions),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  if (!settings) return null;

  const allPermissionsGranted = Object.values(permissions).every(Boolean);
  const hasAnthropicKey = settings.apiKeyStatus.anthropic;

  return (
    <div className="panel-container">
      {/* Header */}
      <div className="panel-header">
        <div className={`status-dot ${voiceState}`} />
        <span className="panel-title">Flicky</span>
        <span className="panel-status">{STATUS_LABELS[voiceState]}</span>
      </div>

      <div className="panel-body">
        {/* API Keys */}
        <div>
          <div className="section-label">API Keys</div>
          <p className="section-hint">
            Keys are encrypted and stored locally on your machine. They never leave your computer.
          </p>
          {(Object.entries(API_KEY_LABELS) as [ApiKeyName, typeof API_KEY_LABELS[ApiKeyName]][]).map(
            ([name, config]) => (
              <ApiKeyRow
                key={name}
                name={name}
                label={config.label}
                placeholder={config.placeholder}
                required={config.required}
                isSet={settings.apiKeyStatus[name]}
              />
            ),
          )}
        </div>

        {/* Permissions (macOS) */}
        {process.platform === 'darwin' && (
          <div>
            <div className="section-label">Permissions</div>
            <PermissionRow
              label="Microphone"
              granted={permissions.microphone}
              onRequest={() => window.flicky.requestPermission('microphone')}
            />
            <PermissionRow
              label="Screen Recording"
              granted={permissions.screen}
              onRequest={() => window.flicky.requestPermission('screen')}
            />
          </div>
        )}

        {/* Model Picker */}
        {allPermissionsGranted && hasAnthropicKey && (
          <div>
            <div className="section-label">Model</div>
            <div className="model-picker">
              <ModelButton
                label="Sonnet"
                model="claude-sonnet-4-6"
                active={settings.selectedModel === 'claude-sonnet-4-6'}
                onClick={() => window.flicky.setModel('claude-sonnet-4-6')}
              />
              <ModelButton
                label="Opus"
                model="claude-opus-4-6"
                active={settings.selectedModel === 'claude-opus-4-6'}
                onClick={() => window.flicky.setModel('claude-opus-4-6')}
              />
            </div>
          </div>
        )}

        {/* Groq Model Picker */}
        {settings.apiKeyStatus.groq && (
          <div>
            <div className="section-label">Transcription Model</div>
            <div className="model-picker">
              <GroqModelButton
                label="Large v3"
                model="whisper-large-v3"
                active={settings.groqTranscriptionModel === 'whisper-large-v3'}
                onClick={() => window.flicky.setGroqModel('whisper-large-v3')}
              />
              <GroqModelButton
                label="Turbo"
                model="whisper-large-v3-turbo"
                active={settings.groqTranscriptionModel === 'whisper-large-v3-turbo'}
                onClick={() => window.flicky.setGroqModel('whisper-large-v3-turbo')}
              />
              <GroqModelButton
                label="English"
                model="distil-whisper-large-v3-en"
                active={settings.groqTranscriptionModel === 'distil-whisper-large-v3-en'}
                onClick={() => window.flicky.setGroqModel('distil-whisper-large-v3-en')}
              />
            </div>
          </div>
        )}

        {/* Shortcut */}
        {allPermissionsGranted && hasAnthropicKey && (
          <div>
            <div className="section-label">Push to Talk</div>
            <div className="shortcut-display">
              <span className="shortcut-key">Ctrl</span>
              <span className="shortcut-separator">+</span>
              <span className="shortcut-key">Alt</span>
              <span className="shortcut-separator">+</span>
              <span className="shortcut-key">X</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="panel-footer">
        <button className="footer-btn" onClick={() => window.flicky.replayOnboarding()}>
          Replay Intro
        </button>
        <button className="footer-btn" onClick={() => window.flicky.clearContext()}>
          Clear Context
        </button>
        <button className="footer-btn destructive" onClick={() => window.flicky.quit()}>
          Quit
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function ApiKeyRow({
  name,
  label,
  placeholder,
  required,
  isSet,
}: {
  name: ApiKeyName;
  label: string;
  placeholder: string;
  required: boolean;
  isSet: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const handleSave = () => {
    if (value.trim()) {
      window.flicky.setApiKey(name, value.trim());
      setValue('');
      setEditing(false);
    }
  };

  const handleDelete = () => {
    window.flicky.deleteApiKey(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setValue('');
      setEditing(false);
    }
  };

  return (
    <div className="api-key-row">
      <div className="api-key-header">
        <span className="api-key-label">
          {label}
          {required && <span className="api-key-required">*</span>}
        </span>
        {isSet ? (
          <div className="api-key-actions">
            <span className="permission-badge granted">Saved</span>
            <button className="api-key-action-btn" onClick={() => setEditing(true)}>
              Change
            </button>
            <button className="api-key-action-btn destructive" onClick={handleDelete}>
              Remove
            </button>
          </div>
        ) : (
          <button
            className="api-key-action-btn"
            onClick={() => setEditing(true)}
          >
            Add
          </button>
        )}
      </div>
      {editing && (
        <div className="api-key-input-row">
          <input
            className="api-key-input"
            type="password"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button className="api-key-save-btn" onClick={handleSave} disabled={!value.trim()}>
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function PermissionRow({
  label,
  granted,
  onRequest,
}: {
  label: string;
  granted: boolean;
  onRequest: () => void;
}) {
  return (
    <div className="permission-row">
      <span className="permission-label">{label}</span>
      {granted ? (
        <span className="permission-badge granted">Granted</span>
      ) : (
        <span className="permission-badge denied" onClick={onRequest}>
          Grant
        </span>
      )}
    </div>
  );
}

function ModelButton({
  label,
  model,
  active,
  onClick,
}: {
  label: string;
  model: ClaudeModel;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`model-btn ${active ? 'active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

function GroqModelButton({
  label,
  model,
  active,
  onClick,
}: {
  label: string;
  model: GroqTranscriptionModel;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`model-btn ${active ? 'active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}
