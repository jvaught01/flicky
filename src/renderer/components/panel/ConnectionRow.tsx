import type { LocalConnection } from '../../../shared/types';

interface ConnectionRowProps {
  conn: LocalConnection;
  onManage: (conn: LocalConnection) => void;
  onConfigure: (conn: LocalConnection) => void;
  onToggle: (conn: LocalConnection) => void;
}

export function ConnectionRow({ conn, onManage, onConfigure, onToggle }: ConnectionRowProps) {
  const displayUrl = conn.label ?? conn.url;
  const activeModel = conn.activeModelId;

  return (
    <div className={`conn-row ${conn.enabled ? '' : 'disabled'}`}>
      <div className="conn-info">
        <div className="conn-url" title={conn.url}>{displayUrl}</div>
        {activeModel && (
          <div className="conn-model">{activeModel}</div>
        )}
      </div>
      <div className="conn-actions">
        <button className="btn xs subtle" onClick={() => onManage(conn)}>
          Manage
        </button>
        <button className="btn xs subtle" onClick={() => onConfigure(conn)}>
          Configure
        </button>
        <button
          className={`toggle-pill ${conn.enabled ? 'on' : ''}`}
          onClick={() => onToggle(conn)}
          title={conn.enabled ? 'Disable' : 'Enable'}
        />
      </div>
    </div>
  );
}
