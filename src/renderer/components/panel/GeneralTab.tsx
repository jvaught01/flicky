import type { FlickySettings, MemoryStats } from '../../../shared/types';

interface GeneralTabProps {
  settings: FlickySettings;
  memory: MemoryStats | null;
}

function formatTokens(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function formatRelative(ts: number | null): string {
  if (!ts) return 'never';
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function GeneralTab({ settings, memory }: GeneralTabProps) {
  const tokens = memory?.tokens ?? 0;
  const budget = memory?.tokenBudget ?? 250_000;
  const pct = Math.min(100, (tokens / budget) * 100);
  const healthLabel = pct < 60 ? 'healthy' : pct < 85 ? 'getting full' : 'near cap';
  const healthColor = pct < 60 ? 'var(--fl-green)' : pct < 85 ? 'var(--fl-amber-text)' : 'var(--fl-peach-deep)';

  return (
    <div className="body">
      <div>
        <div className="section-title" style={{ marginBottom: 6 }}>Shortcut</div>
        <div className="row" style={{ padding: '8px 0' }}>
          <div className="row-main">
            <div className="row-t">Push to talk</div>
            <div className="row-s">hold to speak</div>
          </div>
          <div className="shortcut-edit">
            <div className="keys">
              <kbd>Ctrl</kbd>
              <kbd>Alt</kbd>
              <kbd>X</kbd>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>Memory</div>
        <p className="section-hint" style={{ marginBottom: 10 }}>
          Flicky auto-compacts older messages into a summary near the {formatTokens(budget)} cap so the
          conversation can run forever.
        </p>
        <div className="context-bar">
          <div className="context-meta">
            <span>
              <b>{formatTokens(tokens)}</b> / {formatTokens(budget)} tokens
            </span>
            <span style={{ color: healthColor }}>{healthLabel}</span>
          </div>
          <div className="bar"><div className="f" style={{ width: `${pct}%` }} /></div>
          <div className="context-footer">
            <span>
              {memory?.messageCount ?? 0} messages
              {memory?.summarizedCount ? ` · ${memory.summarizedCount} summarized` : ''}
            </span>
            <span>last compact {formatRelative(memory?.lastCompactedAt ?? null)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="btn xs" onClick={() => window.flicky.compactContext()}>Compact now</button>
          <button className="btn xs subtle" onClick={() => window.flicky.clearContext()}>Clear memory</button>
        </div>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>Companion</div>
        <div className="row" style={{ padding: '8px 0' }}>
          <div className="row-main">
            <div className="row-t">Show cursor</div>
            <div className="row-s">blue pointer on screen</div>
          </div>
          <button
            className={`toggle ${settings.isClickyCursorEnabled ? 'on' : ''}`}
            onClick={() => window.flicky.toggleCursor(!settings.isClickyCursorEnabled)}
            aria-label="Toggle cursor"
          />
        </div>
        <div className="row" style={{ padding: '8px 0' }}>
          <div className="row-main">
            <div className="row-t">Launch at login</div>
            <div className="row-s">open Flicky on startup</div>
          </div>
          <button
            className={`toggle ${settings.launchAtLogin ? 'on' : ''}`}
            onClick={() => window.flicky.setLaunchAtLogin(!settings.launchAtLogin)}
            aria-label="Toggle launch at login"
          />
        </div>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>Tour</div>
        <div className="tour-card">
          <div className="tour-icon">F</div>
          <div className="tour-meta">
            <div className="tour-title">Replay the welcome tour</div>
            <div className="tour-sub">
              A one-minute walkthrough of what Flicky can do and how to use it.
            </div>
          </div>
          <button className="btn xs" onClick={() => window.flicky.replayOnboarding()}>Play</button>
        </div>
      </div>
    </div>
  );
}
