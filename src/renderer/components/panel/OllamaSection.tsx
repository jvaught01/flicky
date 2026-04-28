import { useState, useEffect, useCallback } from 'react';
import type { LocalConnection } from '../../../shared/types';
import { ConnectionRow } from './ConnectionRow';
import { AddConnectionModal } from './AddConnectionModal';
import { OllamaManageModal } from './OllamaManageModal';

interface OllamaSectionProps {
  ollamaEnabled: boolean;
  onToggleOllama: (enabled: boolean) => void;
}

export function OllamaSection({ ollamaEnabled, onToggleOllama }: OllamaSectionProps) {
  const [connections, setConnections] = useState<LocalConnection[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LocalConnection | undefined>(undefined);
  const [managing, setManaging] = useState<LocalConnection | undefined>(undefined);

  const reload = useCallback(async () => {
    const conns = await window.flicky.getLocalConnections();
    setConnections(conns);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const handleSave = async (conn: LocalConnection) => {
    setShowModal(false);
    setEditing(undefined);
    await reload();
    // If this is the first connection, switch model provider to ollama
    const all = await window.flicky.getLocalConnections();
    if (all.length === 1) {
      window.flicky.setMindProvider('ollama');
    }
  };

  const handleManage = (conn: LocalConnection) => {
    setManaging(conn);
  };

  const handleConfigure = (conn: LocalConnection) => {
    setEditing(conn);
    setShowModal(true);
  };

  const handleModelSelected = async (connId: string, modelId: string) => {
    await window.flicky.updateLocalConnection(connId, { activeModelId: modelId || undefined });
    await reload();
    // Reflect updated conn in the manage modal
    const updated = (await window.flicky.getLocalConnections()).find((c) => c.id === connId);
    if (updated) setManaging(updated);
  };

  const handleToggle = async (conn: LocalConnection) => {
    await window.flicky.updateLocalConnection(conn.id, { enabled: !conn.enabled });
    await reload();
  };

  const handleDelete = async (conn: LocalConnection) => {
    await window.flicky.deleteLocalConnection(conn.id);
    setShowModal(false);
    setEditing(undefined);
    await reload();
  };

  return (
    <>
      <div className="section">
        <div className="section-row">
          <div className="section-title">Ollama API</div>
          <button
            className={`toggle-pill ${ollamaEnabled ? 'on' : ''}`}
            onClick={() => onToggleOllama(!ollamaEnabled)}
          />
        </div>

        <div className="section-row" style={{ marginTop: 10 }}>
          <div className="section-sub">Manage Ollama API Connections</div>
          <button
            className="btn xs add"
            onClick={() => { setEditing(undefined); setShowModal(true); }}
          >
            + Add Connection
          </button>
        </div>

        {connections.length === 0 ? (
          <div className="empty-state">
            No connections yet. Add one to get started.
          </div>
        ) : (
          <div className="conn-list">
            {connections.map((c) => (
              <ConnectionRow
                key={c.id}
                conn={c}
                onManage={handleManage}
                onConfigure={handleConfigure}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        <p className="section-hint">
          Connect to any OpenAI-compatible local endpoint. Ollama, LM Studio, and vLLM are all
          supported.
        </p>
      </div>

      {showModal && (
        <AddConnectionModal
          existing={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(undefined); }}
          onDelete={editing ? handleDelete : undefined}
        />
      )}

      {managing && (
        <OllamaManageModal
          conn={managing}
          onClose={() => setManaging(undefined)}
          onModelSelected={(modelId) => void handleModelSelected(managing.id, modelId)}
        />
      )}
    </>
  );
}
