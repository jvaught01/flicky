import { useState } from 'react';
import type { ApiKeyName } from '../../../shared/types';

interface ProviderKeyProps {
  name: ApiKeyName;
  providerLabel: string;
  providerLogo: string;
  providerLogoClass?: string;
  isSet: boolean;
  keyPlaceholder: string;
  sectionTitle: string;
  sectionHint: string;
  /** Mask preview e.g. sk-ant-...8f4c (when isSet). Caller provides it; we don't have access to the real key. */
  maskHint?: string;
}

/**
 * Unified provider + key card for each service tab.
 * Shows the provider pill, the current key state, and inline input on "Add" / "Replace".
 */
export function ProviderKey({
  name,
  providerLabel,
  providerLogo,
  providerLogoClass,
  isSet,
  keyPlaceholder,
  sectionTitle,
  sectionHint,
  maskHint,
}: ProviderKeyProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const save = () => {
    const v = value.trim();
    if (!v) return;
    window.flicky.setApiKey(name, v);
    setValue('');
    setEditing(false);
  };

  const remove = () => {
    window.flicky.deleteApiKey(name);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save();
    else if (e.key === 'Escape') {
      setValue('');
      setEditing(false);
    }
  };

  return (
    <div className="provider-card">
      <div className="section-title" style={{ marginBottom: 8 }}>{sectionTitle}</div>
      <div className="provider-header">
        <div className="provider-pick">
          <div className={`provider-logo ${providerLogoClass ?? ''}`}>{providerLogo}</div>
          <span>{providerLabel}</span>
          <span className="soon">more soon</span>
          <span className="chev">▾</span>
        </div>
      </div>

      <div className="label">API key</div>
      {isSet && !editing ? (
        <>
          <div className="mask">
            {maskHint ? (
              <>
                <span>{maskHint.split('••••')[0] ?? ''}</span>
                <span className="dots">••••••••</span>
                <span>{maskHint.split('••••')[1] ?? ''}</span>
              </>
            ) : (
              <span className="dots">••••••••••••••</span>
            )}
          </div>
          <div className="actions">
            <button className="btn xs" onClick={() => setEditing(true)}>Replace</button>
            <button className="btn xs subtle" onClick={remove}>Remove</button>
            <span className="pill-saved" style={{ marginLeft: 'auto' }}>Connected</span>
          </div>
        </>
      ) : editing ? (
        <div className="key-input-row">
          <input
            type="password"
            autoFocus
            placeholder={keyPlaceholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className="btn xs primary" onClick={save} disabled={!value.trim()}>Save</button>
          <button className="btn xs subtle" onClick={() => { setEditing(false); setValue(''); }}>Cancel</button>
        </div>
      ) : (
        <>
          <div className="mask empty">not configured</div>
          <div className="actions">
            <button className="btn xs add" onClick={() => setEditing(true)}>+ Add key</button>
            <span className="pill-needed" style={{ marginLeft: 'auto' }}>Needed</span>
          </div>
        </>
      )}

      {sectionHint && <p className="section-hint" style={{ marginTop: 8 }}>{sectionHint}</p>}
    </div>
  );
}
