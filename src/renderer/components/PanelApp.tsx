import { useState, useEffect } from 'react';
import type { VoiceState, FlickySettings, MemoryStats } from '../../shared/types';
import { HomeTab } from './panel/HomeTab';
import { ChatsTab } from './panel/ChatsTab';
import { MindTab } from './panel/MindTab';
import { VoiceTab } from './panel/VoiceTab';
import { EarTab } from './panel/EarTab';
import { GeneralTab } from './panel/GeneralTab';
import { CursorIcon } from './CursorIcon';

type Tab = 'home' | 'chats' | 'mind' | 'voice' | 'ear' | 'general';

export function PanelApp() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [settings, setSettings] = useState<FlickySettings | null>(null);
  const [memory, setMemory] = useState<MemoryStats | null>(null);
  const [tab, setTab] = useState<Tab>('home');

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

  const navItem = (
    id: Tab,
    label: string,
    opts: { needs?: boolean } = {},
  ) => (
    <button
      className={`nav-item ${tab === id ? 'on' : ''}`}
      onClick={() => setTab(id)}
    >
      <span className={`dot ${opts.needs ? 'warn' : ''}`} />
      <span className="label">{label}</span>
    </button>
  );

  return (
    <div className="panel-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <CursorIcon size={34} />
          </div>
          <div className="sidebar-title">Flicky</div>
        </div>

        <nav className="nav">
          {navItem('home', 'Home')}
          {navItem('chats', 'Chats')}

          <div className="nav-label">Providers</div>
          {navItem('mind', 'Mind', { needs: !apiKeyStatus.anthropic })}
          {navItem('voice', 'Voice', { needs: !apiKeyStatus.elevenlabs })}
          {navItem('ear', 'Ear', { needs: !apiKeyStatus.groq })}

          <div className="nav-label">System</div>
          {navItem('general', 'General')}
        </nav>

        <div className="sidebar-foot">
          <button className="nav-item quit" onClick={() => window.flicky.quit()}>
            <span className="label">Quit</span>
          </button>
          <div className="sidebar-version">v0.1.0</div>
        </div>
      </aside>

      <main className="main">
        {tab === 'home' && (
          <HomeTab
            voiceState={voiceState}
            settings={settings}
            memory={memory}
            onNavigate={(t) => setTab(t)}
          />
        )}
        {tab === 'chats' && <ChatsTab />}
        {tab === 'mind' && <MindTab settings={settings} />}
        {tab === 'voice' && <VoiceTab settings={settings} />}
        {tab === 'ear' && <EarTab settings={settings} />}
        {tab === 'general' && <GeneralTab settings={settings} memory={memory} />}
      </main>
    </div>
  );
}
