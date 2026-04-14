import { useEffect, useRef, useState } from 'react';
import type { ChatEntry } from '../../../shared/types';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today · ${time}`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return `Yesterday · ${time}`;

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ` · ${time}`;
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJson(entries: ChatEntry[]): void {
  const payload = entries.map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    date: new Date(e.timestamp).toISOString(),
    user: e.userText,
    assistant: e.assistantText,
  }));
  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `flicky-chat-${dateStamp()}.json`,
  );
}

function exportTxt(entries: ChatEntry[]): void {
  const lines = entries
    .map((e) => {
      const date = new Date(e.timestamp).toLocaleString();
      return `[${date}]\nYou: ${e.userText}\nFlicky: ${e.assistantText}`;
    })
    .join('\n\n─────────────────────────────────────────\n\n');
  downloadBlob(
    new Blob([`Flicky Chat History\nExported ${new Date().toLocaleString()}\n\n${lines}\n`], {
      type: 'text/plain;charset=utf-8',
    }),
    `flicky-chat-${dateStamp()}.txt`,
  );
}

function buildPdfHtml(entries: ChatEntry[]): string {
  const rows = entries
    .map((e) => {
      const date = new Date(e.timestamp).toLocaleString();
      return `
        <div class="pair">
          <div class="time">${date}</div>
          <div class="turn user"><span class="avatar">You</span><span class="text">${e.userText}</span></div>
          <div class="turn assistant"><span class="avatar">Flicky</span><span class="text">${e.assistantText}</span></div>
        </div>`;
    })
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: system-ui, sans-serif; font-size: 12px; color: #111; margin: 32px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #666; margin-bottom: 24px; }
    .pair { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e5e5; page-break-inside: avoid; }
    .time { font-size: 10px; color: #888; margin-bottom: 8px; }
    .turn { display: flex; gap: 8px; margin-bottom: 6px; }
    .avatar { font-weight: 700; min-width: 44px; font-size: 11px; padding-top: 2px; }
    .turn.user .avatar { color: #2563eb; }
    .turn.assistant .avatar { color: #7c3aed; }
    .text { flex: 1; line-height: 1.5; white-space: pre-wrap; }
  </style></head><body>
    <h1>Flicky Chat History</h1>
    <div class="meta">Exported ${new Date().toLocaleString()} · ${entries.length} conversation${entries.length !== 1 ? 's' : ''}</div>
    ${rows}
  </body></html>`;
}

async function exportPdf(entries: ChatEntry[]): Promise<void> {
  const html = buildPdfHtml(entries);
  const result = await window.flicky.exportChatPdf(html);
  if (!result.ok) {
    console.error('[Flicky] PDF export failed:', result.error);
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function ChatsTab() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [streamingUser, setStreamingUser] = useState<string | null>(null);
  const [streamingAssistant, setStreamingAssistant] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.flicky
      .getChatHistory()
      .then(setEntries)
      .catch((err) => console.error('[Flicky] load chat history failed:', err));

    const unsubs = [
      window.flicky.onChatEntryAdded((entry) => {
        setEntries((prev) => [...prev, entry]);
        setStreamingUser(null);
        setStreamingAssistant('');
      }),
      window.flicky.onTranscriptUpdate((t) => {
        if (t.text) setStreamingUser(t.text);
      }),
      window.flicky.onAiResponseChunk((chunk) => {
        setStreamingAssistant((prev) => prev + chunk);
      }),
      window.flicky.onVoiceStateChanged((state) => {
        if (state === 'listening') {
          setStreamingUser(null);
          setStreamingAssistant('');
        }
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  // Auto-scroll on new content
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries, streamingUser, streamingAssistant]);

  const clearAll = () => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return;
    window.flicky.clearChatHistory();
    setEntries([]);
  };

  const hasAny = entries.length > 0 || streamingUser || streamingAssistant;
  const hasEntries = entries.length > 0;

  return (
    <>
      <div className="chats-head">
        <div>
          <h1 className="main-h1">
            Chats<em>.</em>
          </h1>
          <p className="main-lead" style={{ marginBottom: 0 }}>
            Everything you and Flicky have said. All stored locally on your machine.
          </p>
        </div>
        <div className="chats-actions">
          {/* Download history dropdown */}
          <div className="export-dropdown-wrap" ref={exportRef}>
            <button
              className="btn xs"
              onClick={() => setExportOpen((x) => !x)}
              disabled={!hasEntries}
            >
              Download ▾
            </button>
            {exportOpen && (
              <div className="export-dropdown">
                <button
                  className="export-item"
                  onClick={() => { exportJson(entries); setExportOpen(false); }}
                >
                  <span className="export-icon">{ }</span>
                  Export chat (.json)
                </button>
                <button
                  className="export-item"
                  onClick={() => { exportTxt(entries); setExportOpen(false); }}
                >
                  <span className="export-icon">≡</span>
                  Plain text (.txt)
                </button>
                <button
                  className="export-item"
                  onClick={() => { void exportPdf(entries); setExportOpen(false); }}
                >
                  <span className="export-icon">⬇</span>
                  PDF document (.pdf)
                </button>
              </div>
            )}
          </div>

          <button className="btn xs" onClick={clearAll} disabled={!hasEntries}>
            Clear history
          </button>
        </div>
      </div>

      <div className="chat-log" ref={scrollRef}>
        {!hasAny && (
          <div className="chat-empty">
            <div className="chat-empty-icon">F</div>
            <div className="chat-empty-t">No chats yet</div>
            <div className="chat-empty-s">
              Hold the push-to-talk shortcut from anywhere on your machine to start a conversation.
            </div>
          </div>
        )}

        {entries.map((e) => (
          <ChatPair key={e.id} user={e.userText} assistant={e.assistantText} ts={e.timestamp} />
        ))}

        {(streamingUser || streamingAssistant) && (
          <ChatPair
            user={streamingUser ?? ''}
            assistant={streamingAssistant}
            ts={Date.now()}
            live
          />
        )}
      </div>
    </>
  );
}

function ChatPair({
  user,
  assistant,
  ts,
  live,
}: {
  user: string;
  assistant: string;
  ts: number;
  live?: boolean;
}) {
  return (
    <div className={`chat-pair ${live ? 'live' : ''}`}>
      <div className="chat-time">{formatTime(ts)}{live ? ' · live' : ''}</div>
      {user && (
        <div className="chat-turn user">
          <div className="chat-avatar user">You</div>
          <div className="chat-text">{user}</div>
        </div>
      )}
      {assistant && (
        <div className="chat-turn assistant">
          <div className="chat-avatar assistant">F</div>
          <div className="chat-text">
            {assistant}
            {live && <span className="caret" />}
          </div>
        </div>
      )}
    </div>
  );
}
