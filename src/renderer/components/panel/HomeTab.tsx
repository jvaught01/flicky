import type { FlickySettings, VoiceState, MemoryStats } from '../../../shared/types';
import { Waveform } from '../Waveform';

interface HomeTabProps {
  voiceState: VoiceState;
  settings: FlickySettings;
  memory: MemoryStats | null;
  onNavigate: (tab: 'mind' | 'voice' | 'ear' | 'general') => void;
}

function formatTokens(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function HomeTab({ voiceState, settings, memory, onNavigate }: HomeTabProps) {
  const { apiKeyStatus } = settings;
  const connectedCount = [apiKeyStatus.anthropic, apiKeyStatus.elevenlabs, apiKeyStatus.groq].filter(
    Boolean,
  ).length;
  const ready = connectedCount === 3;

  const modelLabel =
    settings.selectedModel === 'claude-sonnet-4-6' ? 'Claude Sonnet 4.6' : 'Claude Opus 4.6';

  const pct = memory ? Math.round((memory.tokens / memory.tokenBudget) * 100) : 0;

  return (
    <>
      <h1 className="main-h1">
        Welcome back<em>.</em>
      </h1>
      <p className="main-lead">
        {ready
          ? 'Hold the push-to-talk shortcut from anywhere and Flicky will listen, think, and reply.'
          : `${connectedCount} of 3 providers connected. Add the remaining keys to start talking.`}
      </p>

      <div className="home-hero">
        <div className="home-wave-wrap">
          <Waveform state={ready ? voiceState : 'idle'} bars={23} height={72} />
          {ready ? (
            <div className="home-ptt">
              hold <kbd>Ctrl</kbd>
              <kbd>Alt</kbd>
              <kbd>X</kbd> to talk
            </div>
          ) : (
            <div className="home-ptt blocked">add the missing key to start talking</div>
          )}
        </div>
        <div className="home-status">
          <div className="status-chip">
            <div
              className={`dot ${
                voiceState === 'listening' || voiceState === 'responding'
                  ? 'active'
                  : ready
                    ? ''
                    : 'warn'
              }`}
            />
            <div style={{ flex: 1 }}>
              <div className="t">
                {voiceState === 'listening'
                  ? 'Listening'
                  : voiceState === 'processing'
                    ? 'Thinking'
                    : voiceState === 'responding'
                      ? 'Responding'
                      : ready
                        ? 'Ready'
                        : 'Setup needed'}
              </div>
              <div className="s">{ready ? 'all providers connected' : `${connectedCount} of 3 connected`}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Memory</div>
          <div className="stat-value">{formatTokens(memory?.tokens ?? 0)}</div>
          <div className="stat-sub">of {formatTokens(memory?.tokenBudget ?? 250_000)} tokens ({pct}%)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Model</div>
          <div className="stat-value" style={{ fontSize: 22, lineHeight: 1.15 }}>{modelLabel}</div>
          <div className="stat-sub">{settings.reasoningDepth === 'off' ? 'no extended thinking' : `${settings.reasoningDepth} reasoning`}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Messages</div>
          <div className="stat-value">{memory?.messageCount ?? 0}</div>
          <div className="stat-sub">
            {memory?.summarizedCount
              ? `${memory.summarizedCount} summarized`
              : 'in this session'}
          </div>
        </div>
      </div>

      <div className="provider-summary">
        <h3>Connected providers</h3>
        <div className="provider-row">
          <div className="provider-logo">A</div>
          <div className="nm">
            Anthropic <span className="purpose" style={{ marginLeft: 6 }}>· reasoning</span>
          </div>
          {apiKeyStatus.anthropic ? (
            <span className="pill-saved">Connected</span>
          ) : (
            <button className="goto" onClick={() => onNavigate('mind')}>Add key →</button>
          )}
        </div>
        <div className="provider-row">
          <div className="provider-logo eleven">11</div>
          <div className="nm">
            ElevenLabs <span className="purpose" style={{ marginLeft: 6 }}>· voice</span>
          </div>
          {apiKeyStatus.elevenlabs ? (
            <span className="pill-saved">Connected</span>
          ) : (
            <button className="goto" onClick={() => onNavigate('voice')}>Add key →</button>
          )}
        </div>
        <div className="provider-row">
          <div className="provider-logo groq">G</div>
          <div className="nm">
            Groq <span className="purpose" style={{ marginLeft: 6 }}>· transcription</span>
          </div>
          {apiKeyStatus.groq ? (
            <span className="pill-saved">Connected</span>
          ) : (
            <button className="goto" onClick={() => onNavigate('ear')}>Add key →</button>
          )}
        </div>
      </div>
    </>
  );
}
