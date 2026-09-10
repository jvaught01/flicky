import { useEffect, useState } from 'react';
import type { FlickySettings, PermissionStatus } from '../../../shared/types';

interface Row {
  kind: 'microphone' | 'screen' | 'accessibility';
  label: string;
  reason: string;
  /** Which platforms actually gate this. */
  platforms: NodeJS.Platform[];
  /** Settings-derived gate — only shown when this returns true. */
  visibleWhen?: (s: FlickySettings | null) => boolean;
}

const ROWS: Row[] = [
  {
    kind: 'microphone',
    label: 'Microphone',
    reason: 'so Flicky can hear you when you push to talk',
    platforms: ['darwin', 'win32'],
  },
  {
    kind: 'screen',
    label: 'Screen Recording',
    reason: 'so Flicky can see your screen and point at things',
    platforms: ['darwin'],
  },
  {
    kind: 'accessibility',
    label: 'Accessibility',
    reason: 'so Flicky can type into the focused field for you',
    platforms: ['darwin'],
    // Only nag the user about this one when they've actually turned
    // on auto-typing. Keeps the banner quiet for users who never
    // care about that feature.
    visibleWhen: (s) => !!s?.autoTypeEnabled,
  },
];

const platform = window.flicky.platform;
const GATED = platform === 'darwin' || platform === 'win32';

export function PermissionsBanner() {
  const [perms, setPerms] = useState<PermissionStatus | null>(null);
  const [settings, setSettings] = useState<FlickySettings | null>(null);

  useEffect(() => {
    if (!GATED) return;
    window.flicky.getPermissions().then(setPerms);
    window.flicky.getSettings().then(setSettings);
    const unsubPerms = window.flicky.onPermissionStatus(setPerms);
    const unsubSettings = window.flicky.onSettingsChanged(setSettings);
    return () => {
      unsubPerms();
      unsubSettings();
    };
  }, []);

  if (!GATED) return null;
  if (!perms) return null;

  const missing = ROWS.filter((r) => {
    if (!r.platforms.includes(platform)) return false;
    if (perms[r.kind]) return false;
    if (r.visibleWhen && !r.visibleWhen(settings)) return false;
    return true;
  });
  if (missing.length === 0) return null;

  const isWin = platform === 'win32';

  return (
    <div className="perm-banner">
      <div className="perm-banner-head">
        <span className="perm-banner-title">Flicky needs a permission</span>
        <span className="perm-banner-sub">
          {isWin
            ? 'Windows blocks desktop apps from the microphone until you allow it under Settings → Privacy & security → Microphone.'
            : 'macOS controls access per-app. Without these, Flicky can’t hear you, see your screen, or type for you.'}
        </span>
      </div>
      <div className="perm-banner-rows">
        {missing.map((r) => (
          <div className="perm-banner-row" key={r.kind}>
            <div className="perm-banner-text">
              <span className="perm-banner-label">{r.label}</span>
              <span className="perm-banner-reason">{r.reason}</span>
            </div>
            <button
              className="perm-banner-btn"
              onClick={() => window.flicky.requestPermission(r.kind)}
            >
              {isWin ? 'Open settings' : 'Grant'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
