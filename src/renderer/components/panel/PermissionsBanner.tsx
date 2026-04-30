import { useEffect, useState } from 'react';

type Perms = Record<string, boolean>;

const ROWS: Array<{ kind: 'microphone' | 'screen'; label: string; reason: string }> = [
  {
    kind: 'microphone',
    label: 'Microphone',
    reason: 'so Flicky can hear you when you push to talk',
  },
  {
    kind: 'screen',
    label: 'Screen Recording',
    reason: 'so Flicky can see your screen and point at things',
  },
];

export function PermissionsBanner() {
  const [perms, setPerms] = useState<Perms | null>(null);

  useEffect(() => {
    if (process.platform !== 'darwin') return;
    window.flicky.getPermissions().then(setPerms);
    const unsub = window.flicky.onPermissionStatus(setPerms);
    return () => { unsub(); };
  }, []);

  if (process.platform !== 'darwin') return null;
  if (!perms) return null;

  const missing = ROWS.filter((r) => !perms[r.kind]);
  if (missing.length === 0) return null;

  return (
    <div className="perm-banner">
      <div className="perm-banner-head">
        <span className="perm-banner-title">Flicky needs a few permissions</span>
        <span className="perm-banner-sub">
          macOS controls access per-app. Without these, Flicky can&apos;t hear you or see your screen.
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
              Grant
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
