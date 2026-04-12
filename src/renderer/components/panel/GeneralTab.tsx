import { useState } from 'react';
import type { FlickySettings, MemoryStats } from '../../../shared/types';
import { ShortcutCapture } from './ShortcutCapture';

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
  const [editingShortcut, setEditingShortcut] = useState(false);
  const [isCompacting, setIsCompacting] = useState(false);
  const [compactStatus, setCompactStatus] = useState<
    { kind: 'success' | 'error'; message: string } | null
  >(null);

  const onCompact = async () => {
    setIsCompacting(true);
    setCompactStatus(null);
    try {
      const res = await window.flicky.compactContext();
      if (res.ok) {
        setCompactStatus({ kind: 'success', message: 'Compacted.' });
      } else {
        setCompactStatus({ kind: 'error', message: res.error ?? 'Compaction failed.' });
      }
    } catch (err) {
      setCompactStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Compaction failed.',
      });
    } finally {
      setIsCompacting(false);
      setTimeout(() => setCompactStatus(null), 4000);
    }
  };

  const tokens = memory?.tokens ?? 0;
  const budget = memory?.tokenBudget ?? 250_000;
  const pct = Math.min(100, (tokens / budget) * 100);
  const healthLabel = pct < 60 ? 'healthy' : pct < 85 ? 'getting full' : 'near cap';
  const healthColor =
    pct < 60 ? 'var(--fl-ok)' : pct < 85 ? 'var(--fl-warn)' : 'var(--fl-danger)';

  const shortcutKeys = settings.pushToTalkShortcut.split('+').filter(Boolean);

  return (
    <>
      <h1 className="main-h1">
        General<em>.</em>
      </h1>
      <p className="main-lead">Shortcuts, memory, and the companion cursor.</p>

      <div className="section">
        <div className="section-title" style={{ marginBottom: 10 }}>Shortcut</div>
        <div className="row">
          <div className="row-main">
            <div className="row-t">Push to talk</div>
            <div className="row-s">hold to speak from anywhere on your machine</div>
          </div>
          {editingShortcut ? (
            <ShortcutCapture
              onSave={(accel) => {
                window.flicky.setPushToTalkShortcut(accel);
                setEditingShortcut(false);
              }}
              onCancel={() => setEditingShortcut(false)}
            />
          ) : (
            <div className="shortcut-edit">
              <div className="keys">
                {shortcutKeys.map((k, i) => (
                  <kbd key={`${k}-${i}`}>{k}</kbd>
                ))}
              </div>
              <span className="rec" onClick={() => setEditingShortcut(true)}>edit</span>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Memory</div>
        <p className="section-hint" style={{ margin: '6px 0 14px' }}>
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
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <button className="btn xs" onClick={onCompact} disabled={isCompacting}>
            {isCompacting && <span className="spinner-sm" />}
            {isCompacting ? 'Compacting…' : 'Compact now'}
          </button>
          <button
            className="btn xs subtle"
            onClick={() => window.flicky.clearContext()}
            disabled={isCompacting}
          >
            Clear memory
          </button>
          {compactStatus && (
            <span
              className={`compact-status ${compactStatus.kind}`}
              title={compactStatus.message}
            >
              {compactStatus.message}
            </span>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-title" style={{ marginBottom: 4 }}>Companion</div>
        <div className="row">
          <div className="row-main">
            <div className="row-t">Show cursor</div>
            <div className="row-s">blue pointer that flies to things Flicky mentions</div>
          </div>
          <button
            className={`toggle ${settings.isClickyCursorEnabled ? 'on' : ''}`}
            onClick={() => window.flicky.toggleCursor(!settings.isClickyCursorEnabled)}
            aria-label="Toggle cursor"
          />
        </div>
        <div className="row">
          <div className="row-main">
            <div className="row-t">Launch at login</div>
            <div className="row-s">open Flicky when you sign in</div>
          </div>
          <button
            className={`toggle ${settings.launchAtLogin ? 'on' : ''}`}
            onClick={() => window.flicky.setLaunchAtLogin(!settings.launchAtLogin)}
            aria-label="Toggle launch at login"
          />
        </div>
      </div>
    </>
  );
}
