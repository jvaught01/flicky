import { useState } from 'react';
import type {
  FlickySettings,
  ClaudeModel,
  OpenAIModel,
  MindProvider,
  ReasoningDepth,
  ReplyTone,
} from '../../../shared/types';
import { ProviderKey } from './ProviderKey';

interface MindTabProps {
  settings: FlickySettings;
}

interface ModelEntry<M extends string> {
  id: M;
  name: string;
  sub: string;
  tag?: { label: string; cls: string };
}

const CLAUDE_MODELS: Array<ModelEntry<ClaudeModel>> = [
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    sub: 'fast · balanced · default',
    tag: { label: 'recommended', cls: 'info' },
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    sub: 'deepest reasoning · slower',
  },
];

const OPENAI_MODELS: Array<ModelEntry<OpenAIModel>> = [
  {
    id: 'gpt-5',
    name: 'GPT-5',
    sub: 'frontier reasoning · supports extended thinking',
    tag: { label: 'recommended', cls: 'info' },
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 mini',
    sub: 'fast + cheap reasoning model',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    sub: 'multimodal · fast',
  },
];

export function MindTab({ settings }: MindTabProps) {
  const [providerOpen, setProviderOpen] = useState(false);

  const isAnthropic = settings.mindProvider === 'anthropic';
  const setTone = (t: ReplyTone) => window.flicky.setReplyTone(t);
  const setDepth = (d: ReasoningDepth) => window.flicky.setReasoningDepth(d);

  return (
    <>
      <h1 className="main-h1">
        Mind<em>.</em>
      </h1>
      <p className="main-lead">
        How Flicky thinks — which provider, which model, how deep it reasons, and the tone of
        its replies.
      </p>

      <div className="section">
        <div className="section-title">Model provider</div>

        <div className="provider-header">
          <button
            type="button"
            className="provider-pick"
            onClick={() => setProviderOpen((x) => !x)}
          >
            <div className={`provider-logo ${isAnthropic ? '' : 'openai'}`}>
              {isAnthropic ? 'A' : 'Ai'}
            </div>
            <span>{isAnthropic ? 'Anthropic' : 'OpenAI'}</span>
            <span className="chev">▾</span>
          </button>
        </div>

        {providerOpen && (
          <div className="voice-list" style={{ marginTop: 8 }}>
            <button
              className={`voice-item ${isAnthropic ? 'on' : ''}`}
              onClick={() => {
                window.flicky.setMindProvider('anthropic');
                setProviderOpen(false);
              }}
            >
              <div className="nm">Anthropic</div>
              <div className="sub">Claude Sonnet / Opus · built-in web search</div>
            </button>
            <button
              className={`voice-item ${!isAnthropic ? 'on' : ''}`}
              onClick={() => {
                window.flicky.setMindProvider('openai');
                setProviderOpen(false);
              }}
            >
              <div className="nm">OpenAI</div>
              <div className="sub">GPT-5 · GPT-4o · reasoning effort</div>
            </button>
          </div>
        )}

        {isAnthropic ? (
          <ProviderKey
            name="anthropic"
            providerLabel="Anthropic"
            providerLogo="A"
            isSet={settings.apiKeyStatus.anthropic}
            keyPlaceholder="sk-ant-..."
          />
        ) : (
          <ProviderKey
            name="openai"
            providerLabel="OpenAI"
            providerLogo="Ai"
            providerLogoClass="openai"
            isSet={settings.apiKeyStatus.openai}
            keyPlaceholder="sk-..."
          />
        )}
        <p className="section-hint">Powers the reasoning behind every answer.</p>
      </div>

      <div className="section">
        <div className="section-title" style={{ marginBottom: 14 }}>Model</div>
        <div className="model-list">
          {isAnthropic
            ? CLAUDE_MODELS.map((m) => (
                <button
                  key={m.id}
                  className={`model-item ${settings.selectedModel === m.id ? 'on' : ''}`}
                  onClick={() => window.flicky.setModel(m.id)}
                >
                  <div className="model-radio" />
                  <div className="model-meta">
                    <div className="model-name">{m.name}</div>
                    <div className="model-sub">{m.sub}</div>
                  </div>
                  {m.tag && <div className={`model-tag ${m.tag.cls}`}>{m.tag.label}</div>}
                </button>
              ))
            : OPENAI_MODELS.map((m) => (
                <button
                  key={m.id}
                  className={`model-item ${settings.selectedOpenAIModel === m.id ? 'on' : ''}`}
                  onClick={() => window.flicky.setOpenAIModel(m.id)}
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

      <div className="section">
        <div className="section-title" style={{ marginBottom: 6 }}>Reasoning depth</div>
        <p className="section-hint" style={{ margin: '0 0 14px' }}>
          How much Flicky thinks before replying.
        </p>
        <div className="seg">
          <button
            className={settings.reasoningDepth === 'off' ? 'on' : ''}
            onClick={() => setDepth('off')}
          >
            Off
          </button>
          <button
            className={settings.reasoningDepth === 'medium' ? 'on' : ''}
            onClick={() => setDepth('medium')}
          >
            Medium
          </button>
          <button
            className={settings.reasoningDepth === 'deep' ? 'on' : ''}
            onClick={() => setDepth('deep')}
          >
            Deep
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-title" style={{ marginBottom: 14 }}>Reply tone</div>
        <div className="seg">
          <button
            className={settings.replyTone === 'concise' ? 'on' : ''}
            onClick={() => setTone('concise')}
          >
            Concise
          </button>
          <button
            className={settings.replyTone === 'friendly' ? 'on' : ''}
            onClick={() => setTone('friendly')}
          >
            Friendly
          </button>
          <button
            className={settings.replyTone === 'detailed' ? 'on' : ''}
            onClick={() => setTone('detailed')}
          >
            Detailed
          </button>
        </div>
      </div>
    </>
  );
}
