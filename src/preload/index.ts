import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/types';
import type {
  ApiKeyName,
  ClaudeModel,
  OpenAIModel,
  MindProvider,
  GroqTranscriptionModel,
  FlickySettings,
  VoiceState,
  TranscriptionResult,
  DetectedElement,
  ReasoningDepth,
  ReplyTone,
  MemoryStats,
  ChatEntry,
} from '../shared/types';

const api = {
  // ── Settings ───────────────────────────────────────────────────────
  getSettings: (): Promise<FlickySettings> => ipcRenderer.invoke(IPC.GET_SETTINGS),

  setModel: (model: ClaudeModel): void => ipcRenderer.send(IPC.SET_MODEL, model),
  setOpenAIModel: (model: OpenAIModel): void => ipcRenderer.send(IPC.SET_OPENAI_MODEL, model),
  setMindProvider: (provider: MindProvider): void => ipcRenderer.send(IPC.SET_MIND_PROVIDER, provider),
  setReasoningDepth: (depth: ReasoningDepth): void => ipcRenderer.send(IPC.SET_REASONING_DEPTH, depth),
  setReplyTone: (tone: ReplyTone): void => ipcRenderer.send(IPC.SET_REPLY_TONE, tone),

  setVoiceId: (id: string): void => ipcRenderer.send(IPC.SET_VOICE_ID, id),
  setVoiceSpeed: (speed: number): void => ipcRenderer.send(IPC.SET_VOICE_SPEED, speed),
  setVoiceStability: (stability: number): void => ipcRenderer.send(IPC.SET_VOICE_STABILITY, stability),
  setSpeakReplies: (enabled: boolean): void => ipcRenderer.send(IPC.SET_SPEAK_REPLIES, enabled),

  setGroqModel: (model: GroqTranscriptionModel): void => ipcRenderer.send(IPC.SET_GROQ_MODEL, model),

  toggleCursor: (enabled: boolean): void => ipcRenderer.send(IPC.TOGGLE_CURSOR, enabled),
  setLaunchAtLogin: (enabled: boolean): void => ipcRenderer.send(IPC.SET_LAUNCH_AT_LOGIN, enabled),
  setPushToTalkShortcut: (accel: string): void => ipcRenderer.send(IPC.SET_PUSH_TO_TALK_SHORTCUT, accel),
  suspendPushToTalkShortcut: (): void => ipcRenderer.send(IPC.SUSPEND_PUSH_TO_TALK_SHORTCUT),
  resumePushToTalkShortcut: (): void => ipcRenderer.send(IPC.RESUME_PUSH_TO_TALK_SHORTCUT),

  playVoicePreview: (voiceId: string): void => ipcRenderer.send(IPC.PLAY_VOICE_PREVIEW, voiceId),

  // ── Permissions ────────────────────────────────────────────────────
  getPermissions: (): Promise<Record<string, boolean>> => ipcRenderer.invoke(IPC.GET_PERMISSIONS),
  requestPermission: (kind: string): void => ipcRenderer.send(IPC.REQUEST_PERMISSION, kind),

  // ── API Keys ───────────────────────────────────────────────────────
  setApiKey: (name: ApiKeyName, value: string): void => ipcRenderer.send(IPC.SET_API_KEY, name, value),
  deleteApiKey: (name: ApiKeyName): void => ipcRenderer.send(IPC.DELETE_API_KEY, name),
  getApiKeyStatus: (): Promise<Record<ApiKeyName, boolean>> =>
    ipcRenderer.invoke(IPC.GET_API_KEY_STATUS),

  // ── Memory / context ───────────────────────────────────────────────
  getMemoryStats: (): Promise<MemoryStats> => ipcRenderer.invoke(IPC.GET_MEMORY_STATS),
  compactContext: (): void => ipcRenderer.send(IPC.COMPACT_CONTEXT),
  clearContext: (): void => ipcRenderer.send(IPC.CLEAR_CONTEXT),

  // ── Chat history ────────────────────────────────────────────────────
  getChatHistory: (): Promise<ChatEntry[]> => ipcRenderer.invoke(IPC.GET_CHAT_HISTORY),
  clearChatHistory: (): void => ipcRenderer.send(IPC.CLEAR_CHAT_HISTORY),

  // ── Lifecycle ──────────────────────────────────────────────────────
  openExternal: (url: string): void => ipcRenderer.send(IPC.OPEN_EXTERNAL, url),
  quit: (): void => ipcRenderer.send(IPC.QUIT_APP),
  replayOnboarding: (): void => ipcRenderer.send(IPC.REPLAY_ONBOARDING),
  completeOnboarding: (): void => ipcRenderer.send(IPC.COMPLETE_ONBOARDING),

  // ── Event listeners (Main → Renderer) ──────────────────────────────
  onVoiceStateChanged: (cb: (state: VoiceState) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, state: VoiceState) => cb(state);
    ipcRenderer.on(IPC.VOICE_STATE_CHANGED, handler);
    return () => ipcRenderer.removeListener(IPC.VOICE_STATE_CHANGED, handler);
  },

  onTranscriptUpdate: (cb: (result: TranscriptionResult) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, result: TranscriptionResult) => cb(result);
    ipcRenderer.on(IPC.TRANSCRIPT_UPDATE, handler);
    return () => ipcRenderer.removeListener(IPC.TRANSCRIPT_UPDATE, handler);
  },

  onAiResponseChunk: (cb: (chunk: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, chunk: string) => cb(chunk);
    ipcRenderer.on(IPC.AI_RESPONSE_CHUNK, handler);
    return () => ipcRenderer.removeListener(IPC.AI_RESPONSE_CHUNK, handler);
  },

  onAiResponseComplete: (cb: (fullText: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, text: string) => cb(text);
    ipcRenderer.on(IPC.AI_RESPONSE_COMPLETE, handler);
    return () => ipcRenderer.removeListener(IPC.AI_RESPONSE_COMPLETE, handler);
  },

  onElementDetected: (cb: (element: DetectedElement | null) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, el: DetectedElement | null) => cb(el);
    ipcRenderer.on(IPC.ELEMENT_DETECTED, handler);
    return () => ipcRenderer.removeListener(IPC.ELEMENT_DETECTED, handler);
  },

  onCursorPosition: (cb: (pos: { x: number; y: number }) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, pos: { x: number; y: number }) => cb(pos);
    ipcRenderer.on(IPC.CURSOR_POSITION, handler);
    return () => ipcRenderer.removeListener(IPC.CURSOR_POSITION, handler);
  },

  onSettingsChanged: (cb: (settings: FlickySettings) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, settings: FlickySettings) => cb(settings);
    ipcRenderer.on(IPC.SETTINGS_CHANGED, handler);
    return () => ipcRenderer.removeListener(IPC.SETTINGS_CHANGED, handler);
  },

  onPermissionStatus: (cb: (perms: Record<string, boolean>) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, perms: Record<string, boolean>) => cb(perms);
    ipcRenderer.on(IPC.PERMISSION_STATUS, handler);
    return () => ipcRenderer.removeListener(IPC.PERMISSION_STATUS, handler);
  },

  onMemoryStats: (cb: (stats: MemoryStats) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, stats: MemoryStats) => cb(stats);
    ipcRenderer.on(IPC.MEMORY_STATS, handler);
    return () => ipcRenderer.removeListener(IPC.MEMORY_STATS, handler);
  },

  onChatEntryAdded: (cb: (entry: ChatEntry) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, entry: ChatEntry) => cb(entry);
    ipcRenderer.on(IPC.CHAT_ENTRY_ADDED, handler);
    return () => ipcRenderer.removeListener(IPC.CHAT_ENTRY_ADDED, handler);
  },

  // ── Audio Capture (overlay ↔ main) ──────────────────────────────────
  onStartCapture: (cb: () => void) => {
    const handler = () => cb();
    ipcRenderer.on('start-audio-capture', handler);
    return () => ipcRenderer.removeListener('start-audio-capture', handler);
  },

  onStopCapture: (cb: () => void) => {
    const handler = () => cb();
    ipcRenderer.on('stop-audio-capture', handler);
    return () => ipcRenderer.removeListener('stop-audio-capture', handler);
  },

  sendAudioChunk: (buffer: ArrayBuffer): void => {
    ipcRenderer.send('audio-chunk', Buffer.from(buffer));
  },

  onPlayAudio: (cb: (audioData: ArrayBuffer) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: Buffer) => {
      const copy = new ArrayBuffer(data.byteLength);
      new Uint8Array(copy).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
      cb(copy);
    };
    ipcRenderer.on('play-audio', handler);
    return () => ipcRenderer.removeListener('play-audio', handler);
  },
};

export type FlickyAPI = typeof api;

contextBridge.exposeInMainWorld('flicky', api);
