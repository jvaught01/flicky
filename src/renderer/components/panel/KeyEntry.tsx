import { useState } from 'react';
import type { ApiKeyName } from '../../../shared/types';

interface KeyEntryProps {
  name: ApiKeyName;
  placeholder: string;
  /** Fires after the key was stored (validated or force-saved). */
  onSaved?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  /** Label for the primary button. */
  saveLabel?: string;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'failed'; error: string };

/**
 * Password field + "Test & save". Round-trips the key against the
 * provider before persisting so a mistyped key is caught here instead
 * of surfacing as a silent failure on the first push-to-talk. If the
 * check fails the user can still force-save (offline, proxy, etc.).
 */
export function KeyEntry({
  name,
  placeholder,
  onSaved,
  onCancel,
  autoFocus = true,
  saveLabel = 'Test & save',
}: KeyEntryProps) {
  const [value, setValue] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const commit = () => {
    window.flicky.setApiKey(name, value.trim());
    setValue('');
    setPhase({ kind: 'idle' });
    onSaved?.();
  };

  const testAndSave = async () => {
    const v = value.trim();
    if (!v || phase.kind === 'testing') return;
    setPhase({ kind: 'testing' });
    const res = await window.flicky.validateApiKey(name, v);
    if (res.ok) {
      commit();
    } else {
      setPhase({ kind: 'failed', error: res.error ?? 'Validation failed.' });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void testAndSave();
    else if (e.key === 'Escape') {
      setValue('');
      setPhase({ kind: 'idle' });
      onCancel?.();
    }
  };

  const busy = phase.kind === 'testing';

  return (
    <div className="key-entry">
      <div className="key-input-row">
        <input
          type="password"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          disabled={busy}
          onChange={(e) => {
            setValue(e.target.value);
            if (phase.kind === 'failed') setPhase({ kind: 'idle' });
          }}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          className="btn xs primary"
          onClick={() => void testAndSave()}
          disabled={!value.trim() || busy}
        >
          {busy && <span className="spinner-sm" />}
          {busy ? 'Testing…' : saveLabel}
        </button>
        {onCancel && (
          <button
            className="btn xs subtle"
            onClick={() => { setValue(''); setPhase({ kind: 'idle' }); onCancel(); }}
            disabled={busy}
          >
            Cancel
          </button>
        )}
      </div>
      {phase.kind === 'failed' && (
        <div className="key-entry-error" role="alert">
          <span>{phase.error}</span>
          <button className="link" onClick={commit}>Save anyway</button>
        </div>
      )}
    </div>
  );
}
