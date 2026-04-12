import { useState, useEffect } from 'react';
import type { VoiceState, FlickySettings, MemoryStats } from '../../shared/types';
import { Hero } from './panel/Hero';
import { MindTab } from './panel/MindTab';
import { VoiceTab } from './panel/VoiceTab';
import { EarTab } from './panel/EarTab';
import { GeneralTab } from './panel/GeneralTab';

type Tab = 'mind' | 'voice' | 'ear' | 'general';

export function PanelApp() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [settings, setSettings] = useState<FlickySettings | null>(null);
  const [memory, setMemory] = useState<MemoryStats | null>(null);
  const [tab, setTab] = useState<Tab>('mind');

  useEffect(() => {
    window.flicky.getSettings().then(setSettings);
    window.flicky.getMemoryStats().then(setMemory);

    const unsubs = [
      window.flicky.onVoiceStateChanged(setVoiceState),
      window.flicky.onSettingsChanged(setSettings),
      window.flicky.onMemoryStats(setMemory),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  if (!settings) return null;

  const { apiKeyStatus } = settings;

  return (
    <div className="panel-container">
      <Hero voiceState={voiceState} settings={settings} />

      <div className="tabs">
        <button
          className={`tab ${tab === 'mind' ? 'on' : ''} ${!apiKeyStatus.anthropic ? 'warn' : ''}`}
          onClick={() => setTab('mind')}
        >
          <span className="ico" />
          Mind
        </button>
        <button
          className={`tab ${tab === 'voice' ? 'on' : ''} ${!apiKeyStatus.elevenlabs ? 'warn' : ''}`}
          onClick={() => setTab('voice')}
        >
          <span className="ico" />
          Voice
        </button>
        <button
          className={`tab ${tab === 'ear' ? 'on' : ''} ${!apiKeyStatus.groq ? 'warn' : ''}`}
          onClick={() => setTab('ear')}
        >
          <span className="ico" />
          Ear
        </button>
        <button
          className={`tab ${tab === 'general' ? 'on' : ''}`}
          onClick={() => setTab('general')}
        >
          <span className="ico" />
          General
        </button>
      </div>

      {tab === 'mind' && <MindTab settings={settings} />}
      {tab === 'voice' && <VoiceTab settings={settings} />}
      {tab === 'ear' && <EarTab settings={settings} />}
      {tab === 'general' && <GeneralTab settings={settings} memory={memory} />}

      <div className="footer-bar">
        <button className="q" onClick={() => window.flicky.quit()}>Quit</button>
      </div>
    </div>
  );
}
