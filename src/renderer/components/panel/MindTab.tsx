import type { FlickySettings, ClaudeModel, ReasoningDepth, ReplyTone } from '../../../shared/types';
import { ProviderKey } from './ProviderKey';

interface MindTabProps {
  settings: FlickySettings;
}

export function MindTab({ settings }: MindTabProps) {
  const setModel = (m: ClaudeModel) => window.flicky.setModel(m);
  const setDepth = (d: ReasoningDepth) => window.flicky.setReasoningDepth(d);
  const setTone = (t: ReplyTone) => window.flicky.setReplyTone(t);

  return (
    <div className="body">
      <ProviderKey
        name="anthropic"
        providerLabel="Anthropic"
        providerLogo="A"
        isSet={settings.apiKeyStatus.anthropic}
        keyPlaceholder="sk-ant-..."
        sectionTitle="Model provider"
        sectionHint="Powers the reasoning behind every answer."
      />

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>Model</div>
        <div className="model-list">
          <button
            className={`model-item ${settings.selectedModel === 'claude-sonnet-4-6' ? 'on' : ''}`}
            onClick={() => setModel('claude-sonnet-4-6')}
          >
            <div className="model-radio" />
            <div className="model-meta">
              <div className="model-name">Claude Sonnet 4.6</div>
              <div className="model-sub">fast · balanced · default</div>
            </div>
            <div className="model-tag info">recommended</div>
          </button>
          <button
            className={`model-item ${settings.selectedModel === 'claude-opus-4-6' ? 'on' : ''}`}
            onClick={() => setModel('claude-opus-4-6')}
          >
            <div className="model-radio" />
            <div className="model-meta">
              <div className="model-name">Claude Opus 4.6</div>
              <div className="model-sub">deepest reasoning · slower</div>
            </div>
          </button>
        </div>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>Reasoning depth</div>
        <p className="section-hint" style={{ marginBottom: 8 }}>How much Flicky thinks before replying.</p>
        <div className="seg">
          <button className={settings.reasoningDepth === 'off' ? 'on' : ''} onClick={() => setDepth('off')}>Off</button>
          <button className={settings.reasoningDepth === 'medium' ? 'on' : ''} onClick={() => setDepth('medium')}>Medium</button>
          <button className={settings.reasoningDepth === 'deep' ? 'on' : ''} onClick={() => setDepth('deep')}>Deep</button>
        </div>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>Reply tone</div>
        <div className="seg">
          <button className={settings.replyTone === 'concise' ? 'on' : ''} onClick={() => setTone('concise')}>Concise</button>
          <button className={settings.replyTone === 'friendly' ? 'on' : ''} onClick={() => setTone('friendly')}>Friendly</button>
          <button className={settings.replyTone === 'detailed' ? 'on' : ''} onClick={() => setTone('detailed')}>Detailed</button>
        </div>
      </div>
    </div>
  );
}
