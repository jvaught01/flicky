import { useState, useEffect } from 'react';
import type { LocalConnection } from '../../../shared/types';
import type { OllamaTestResult } from '../../../main/services/ollama-api';

interface AddConnectionModalProps {
  existing?: LocalConnection;
  onSave: (conn: LocalConnection) => void;
  onClose: () => void;
  onDelete?: (conn: LocalConnection) => void;
}

type VerifyState = 'idle' | 'pending' | 'ok' | 'error';

export function AddConnectionModal({ existing, onSave, onClose, onDelete }: AddConnectionModalProps) {
  const [connType, setConnType] = useState<'local' | 'external'>(existing?.type ?? 'local');
  const [url, setUrl] = useState(existing?.url ?? '');
  const [bearerEnabled, setBearerEnabled] = useState(existing?.bearerEnabled ?? false);
  const [bearerToken, setBearerToken] = useState('');
  const [bearerVisible, setBearerVisible] = useState(false);
  const [prefixId, setPrefixId] = useState(existing?.prefixId ?? '');
  const [modelInput, setModelInput] = useState('');
  const [modelIds, setModelIds] = useState<string[]>(existing?.modelIds ?? []);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [verifyResult, setVerifyResult] = useState<OllamaTestResult | null>(null);

  // Pre-fill default URL for local type
  useEffect(() => {
    if (!existing && connType === 'local' && !url) {
      setUrl('http://localhost:11434');
    }
  }, [connType]);

  const handleVerify = async () => {
    if (!url.trim()) return;
    setVerifyState('pending');
    setVerifyResult(null);
    try {
      const token = bearerEnabled && bearerToken.trim() ? bearerToken.trim() : undefined;
      const result = await window.flicky.testLocalConnection(url.trim(), token);
      setVerifyResult(result);
      setVerifyState(result.ok ? 'ok' : 'error');
    } catch {
      setVerifyState('error');
      setVerifyResult({ ok: false, latencyMs: 0, error: 'Unexpected error' });
    }
  };

  const addModelId = () => {
    const v = modelInput.trim();
    if (v && !modelIds.includes(v)) setModelIds((prev) => [...prev, v]);
    setModelInput('');
  };

  const removeModelId = (id: string) => setModelIds((prev) => prev.filter((m) => m !== id));

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags((prev) => [...prev, v]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const handleSave = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    const conn: LocalConnection = {
      id: existing?.id ?? '',
      type: connType,
      url: trimmedUrl,
      enabled: existing?.enabled ?? true,
      bearerEnabled,
      prefixId: prefixId.trim() || undefined,
      modelIds,
      tags,
    };

    if (existing?.id) {
      await window.flicky.updateLocalConnection(existing.id, conn);
      if (bearerEnabled && bearerToken.trim()) {
        await window.flicky.setLocalConnectionKey(existing.id, bearerToken.trim());
      } else if (!bearerEnabled) {
        await window.flicky.deleteLocalConnectionKey(existing.id);
      }
      onSave({ ...conn, id: existing.id });
    } else {
      const saved = await window.flicky.addLocalConnection(conn);
      if (bearerEnabled && bearerToken.trim()) {
        await window.flicky.setLocalConnectionKey(saved.id, bearerToken.trim());
      }
      onSave(saved);
    }
  };

  const canSave = url.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{existing ? 'Edit Connection' : 'Add Connection'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Connection Type */}
        <div className="modal-field">
          <div className="modal-label">Connection Type</div>
          <div className="seg">
            <button
              className={connType === 'local' ? 'on' : ''}
              onClick={() => setConnType('local')}
            >
              Local
            </button>
            <button
              className={connType === 'external' ? 'on' : ''}
              onClick={() => setConnType('external')}
            >
              External
            </button>
          </div>
        </div>

        {/* URL */}
        <div className="modal-field">
          <div className="modal-label">URL</div>
          <div className="modal-input-row">
            <input
              type="text"
              className="modal-input"
              placeholder="http://localhost:11434"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setVerifyState('idle'); }}
            />
            <button
              className={`btn xs ${verifyState === 'ok' ? 'primary' : ''}`}
              onClick={handleVerify}
              disabled={verifyState === 'pending' || !url.trim()}
            >
              {verifyState === 'pending' ? '…' : verifyState === 'ok' ? '✓ Live' : 'Verify'}
            </button>
          </div>
          {verifyResult && (
            <div className={`modal-hint ${verifyResult.ok ? 'ok' : 'err'}`}>
              {verifyResult.ok
                ? `Connected · ${verifyResult.latencyMs}ms${verifyResult.modelCount !== undefined ? ` · ${verifyResult.modelCount} model${verifyResult.modelCount !== 1 ? 's' : ''} available` : ''}`
                : `Failed: ${verifyResult.error ?? 'unknown error'}`}
            </div>
          )}
        </div>

        {/* Auth */}
        <div className="modal-field">
          <div className="modal-label">Auth</div>
          <div className="modal-auth-row">
            <div className="seg" style={{ flexShrink: 0 }}>
              <button className={!bearerEnabled ? 'on' : ''} onClick={() => setBearerEnabled(false)}>
                None
              </button>
              <button className={bearerEnabled ? 'on' : ''} onClick={() => setBearerEnabled(true)}>
                Bearer
              </button>
            </div>
            {bearerEnabled && (
              <>
                <input
                  type={bearerVisible ? 'text' : 'password'}
                  className="modal-input"
                  placeholder={existing?.bearerEnabled ? '(unchanged)' : 'API key or token'}
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                />
                <button
                  className="btn xs subtle"
                  onClick={() => setBearerVisible((v) => !v)}
                  title={bearerVisible ? 'Hide' : 'Show'}
                >
                  {bearerVisible ? '🙈' : '👁'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Prefix ID */}
        <div className="modal-field">
          <div className="modal-label">Prefix ID</div>
          <input
            type="text"
            className="modal-input"
            placeholder="e.g. ollama/"
            value={prefixId}
            onChange={(e) => setPrefixId(e.target.value)}
          />
          <div className="modal-hint">Prepended to model names at inference time.</div>
        </div>

        {/* Model IDs */}
        <div className="modal-field">
          <div className="modal-label">Model IDs</div>
          <div className="modal-hint" style={{ marginBottom: 6 }}>
            Leave empty to include all models from the <code>/api/tags</code> endpoint.
          </div>
          {modelIds.length > 0 && (
            <div className="tag-list">
              {modelIds.map((m) => (
                <span key={m} className="tag-chip">
                  {m}
                  <button onClick={() => removeModelId(m)}>✕</button>
                </span>
              ))}
            </div>
          )}
          <div className="modal-input-row">
            <input
              type="text"
              className="modal-input"
              placeholder="e.g. llama3:8b"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addModelId(); }}
            />
            <button className="btn xs" onClick={addModelId} disabled={!modelInput.trim()}>+</button>
          </div>
        </div>

        {/* Tags */}
        <div className="modal-field">
          <div className="modal-label">Tags</div>
          {tags.length > 0 && (
            <div className="tag-list">
              {tags.map((t) => (
                <span key={t} className="tag-chip">
                  {t}
                  <button onClick={() => removeTag(t)}>✕</button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            className="modal-input"
            placeholder="Add a tag…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTag(); }}
          />
        </div>

        <div className="modal-footer">
          {existing && onDelete && (
            <button
              className="btn xs danger"
              onClick={() => onDelete(existing)}
            >
              Delete
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn xs subtle" onClick={onClose}>Cancel</button>
            <button className="btn xs primary" onClick={handleSave} disabled={!canSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
