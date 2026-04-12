import { app, BrowserWindow, Tray, Menu, globalShortcut, screen, ipcMain, shell, nativeImage } from 'electron';
import path from 'path';
import { CompanionManager } from './companion-manager';
import { createPanelWindow, createOverlayWindow } from './windows';
import { IPC } from '../shared/types';
import { AUDIO_IPC } from './services/audio-capture';

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let tray: Tray | null = null;
let panelWindow: BrowserWindow | null = null;
let overlayWindows: BrowserWindow[] = [];
let companion: CompanionManager;
let isAppQuitting = false;

app.on('before-quit', () => { isAppQuitting = true; });

// ── Helpers ────────────────────────────────────────────────────────────

function createTrayIcon(): Electron.NativeImage {
  const iconPath = path.join(__dirname, '../../../assets/tray-icon.png');
  try {
    const img = nativeImage.createFromPath(iconPath);
    if (!img.isEmpty()) return img.resize({ width: 18, height: 18 });
  } catch {
    // fallback below
  }
  // Generate a simple icon if the file doesn't exist
  const size = 32;
  const canvas = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = size / 2, cy = size / 2, r = size / 2 - 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const i = (y * size + x) * 4;
      if (dist <= r) {
        canvas[i] = 100;     // R
        canvas[i + 1] = 149;  // G
        canvas[i + 2] = 237;  // B
        canvas[i + 3] = 255;  // A
      }
    }
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size });
}

function sendToPanel(channel: string, ...args: unknown[]): void {
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.webContents.send(channel, ...args);
  }
}

function sendToOverlays(channel: string, ...args: unknown[]): void {
  for (const win of overlayWindows) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  }
}

function sendToAll(channel: string, ...args: unknown[]): void {
  sendToPanel(channel, ...args);
  sendToOverlays(channel, ...args);
}

// ── App Lifecycle ──────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Initialize companion manager
  companion = new CompanionManager({
    onVoiceStateChanged: (state) => sendToAll(IPC.VOICE_STATE_CHANGED, state),
    onTranscriptUpdate: (result) => sendToAll(IPC.TRANSCRIPT_UPDATE, result),
    onAiResponseChunk: (chunk) => sendToPanel(IPC.AI_RESPONSE_CHUNK, chunk),
    onAiResponseComplete: (text) => sendToPanel(IPC.AI_RESPONSE_COMPLETE, text),
    onElementDetected: (el) => sendToOverlays(IPC.ELEMENT_DETECTED, el),
    onSettingsChanged: (s) => sendToPanel(IPC.SETTINGS_CHANGED, s),
    onMemoryStatsChanged: (stats) => sendToPanel(IPC.MEMORY_STATS, stats),
    onChatEntryAdded: (entry) => sendToPanel(IPC.CHAT_ENTRY_ADDED, entry),
    onStartAudioCapture: () => sendToOverlays(AUDIO_IPC.START_CAPTURE),
    onStopAudioCapture: () => sendToOverlays(AUDIO_IPC.STOP_CAPTURE),
    onPlayAudio: (buf) => sendToOverlays('play-audio', buf),
  });

  // Create tray
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Flicky');

  console.log('[Flicky] Tray created, registering click handler...');

  tray.on('click', () => togglePanel());
  tray.on('double-click', () => togglePanel());

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Panel', click: () => { console.log('[Flicky] Show Panel menu clicked'); togglePanel(); } },
      { type: 'separator' },
      { label: 'Quit Flicky', click: () => app.quit() },
    ]),
  );

  // Create overlay windows for each display
  rebuildOverlays();
  screen.on('display-added', rebuildOverlays);
  screen.on('display-removed', rebuildOverlays);

  // Register global push-to-talk shortcut.
  // globalShortcut fires repeatedly on key-repeat while held, so we
  // debounce: the first press starts recording, subsequent repeats are
  // ignored, and we stop recording after the shortcut hasn't fired for
  // a short window (meaning the key was released).
  let pttDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pttActive = false;
  let currentShortcut = '';

  const pttHandler = () => {
    if (pttDebounceTimer) {
      clearTimeout(pttDebounceTimer);
      pttDebounceTimer = null;
    }
    if (!pttActive) {
      pttActive = true;
      companion.startPushToTalk();
    }
    pttDebounceTimer = setTimeout(() => {
      pttActive = false;
      pttDebounceTimer = null;
      companion.stopPushToTalk();
    }, 250);
  };

  function registerPttShortcut(accelerator: string): boolean {
    try {
      if (currentShortcut) globalShortcut.unregister(currentShortcut);
      const ok = globalShortcut.register(accelerator, pttHandler);
      if (ok) {
        currentShortcut = accelerator;
        return true;
      }
      // Failed — try to put the previous one back.
      if (currentShortcut && currentShortcut !== accelerator) {
        globalShortcut.register(currentShortcut, pttHandler);
      }
      return false;
    } catch (err) {
      console.error('[Flicky] shortcut register failed:', err);
      return false;
    }
  }

  registerPttShortcut(companion.getSettings().pushToTalkShortcut);
  companion.setShortcutReRegister(registerPttShortcut);

  function suspendPttShortcut(): void {
    if (currentShortcut) {
      try { globalShortcut.unregister(currentShortcut); } catch { /* no-op */ }
    }
  }
  function resumePttShortcut(): void {
    const desired = companion.getSettings().pushToTalkShortcut;
    registerPttShortcut(desired);
  }
  ipcMain.on(IPC.SUSPEND_PUSH_TO_TALK_SHORTCUT, () => suspendPttShortcut());
  ipcMain.on(IPC.RESUME_PUSH_TO_TALK_SHORTCUT, () => resumePttShortcut());

  // ── IPC Handlers ───────────────────────────────────────────────────

  ipcMain.handle(IPC.GET_SETTINGS, () => companion.getSettings());
  ipcMain.handle(IPC.GET_PERMISSIONS, () => companion.getPermissions());

  ipcMain.on(IPC.SET_MODEL, (_e, model) => companion.setModel(model));
  ipcMain.on(IPC.SET_OPENAI_MODEL, (_e, model) => companion.setOpenAIModel(model));
  ipcMain.on(IPC.SET_MIND_PROVIDER, (_e, provider) => companion.setMindProvider(provider));
  ipcMain.on(IPC.SET_REASONING_DEPTH, (_e, depth) => companion.setReasoningDepth(depth));
  ipcMain.on(IPC.SET_REPLY_TONE, (_e, tone) => companion.setReplyTone(tone));
  ipcMain.on(IPC.SET_VOICE_ID, (_e, id) => companion.setVoiceId(id));
  ipcMain.on(IPC.SET_VOICE_SPEED, (_e, speed) => companion.setVoiceSpeed(speed));
  ipcMain.on(IPC.SET_VOICE_STABILITY, (_e, stab) => companion.setVoiceStability(stab));
  ipcMain.on(IPC.SET_SPEAK_REPLIES, (_e, enabled) => companion.setSpeakReplies(enabled));
  ipcMain.on(IPC.TOGGLE_CURSOR, (_e, enabled) => companion.toggleCursor(enabled));
  ipcMain.on(IPC.SET_LAUNCH_AT_LOGIN, (_e, enabled) => companion.setLaunchAtLogin(enabled));
  ipcMain.on(IPC.SET_PUSH_TO_TALK_SHORTCUT, (_e, accel: string) => companion.setPushToTalkShortcut(accel));
  ipcMain.on(IPC.REQUEST_PERMISSION, (_e, kind) => companion.requestPermission(kind));
  ipcMain.on(IPC.OPEN_EXTERNAL, (_e, url) => shell.openExternal(url));
  ipcMain.on(IPC.QUIT_APP, () => app.quit());
  ipcMain.on(IPC.REPLAY_ONBOARDING, () => companion.replayOnboarding());
  ipcMain.on(IPC.COMPLETE_ONBOARDING, () => companion.completeOnboarding());
  ipcMain.on(IPC.SET_GROQ_MODEL, (_e, model) => companion.setGroqModel(model));
  ipcMain.on(IPC.CLEAR_CONTEXT, () => companion.clearContext());
  ipcMain.on(IPC.COMPACT_CONTEXT, () => { void companion.compactContext(); });
  ipcMain.on(IPC.PLAY_VOICE_PREVIEW, (_e, voiceId) => { void companion.playVoicePreview(voiceId); });
  ipcMain.handle(IPC.GET_MEMORY_STATS, () => companion.getMemoryStats());
  ipcMain.handle(IPC.GET_CHAT_HISTORY, () => companion.getChatHistory());
  ipcMain.on(IPC.CLEAR_CHAT_HISTORY, () => companion.clearChatHistory());

  // API Key Management
  ipcMain.on(IPC.SET_API_KEY, (_e, name, value) => companion.setApiKey(name, value));
  ipcMain.on(IPC.DELETE_API_KEY, (_e, name) => companion.deleteApiKey(name));
  ipcMain.handle(IPC.GET_API_KEY_STATUS, () => companion.getApiKeyStatus());

  // Audio capture: relay chunks from overlay renderer to companion
  ipcMain.on(AUDIO_IPC.AUDIO_CHUNK, (_e, buffer: Buffer) => {
    companion.handleAudioChunk(buffer);
  });

  // Track cursor position for overlay rendering
  setInterval(() => {
    const pos = screen.getCursorScreenPoint();
    sendToOverlays(IPC.CURSOR_POSITION, pos);
  }, 16); // ~60fps

  // Poll permissions
  setInterval(async () => {
    const perms = await companion.getPermissions();
    sendToPanel(IPC.PERMISSION_STATUS, perms);
  }, 1500);

  // Open the main window on first launch.
  togglePanel();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// macOS: don't quit when all windows are closed (tray app)
app.on('window-all-closed', () => {
  // Don't quit — this is a tray app
});

// ── Window Management ──────────────────────────────────────────────────

function togglePanel(): void {
  if (panelWindow && !panelWindow.isDestroyed()) {
    if (panelWindow.isVisible() && panelWindow.isFocused()) {
      panelWindow.hide();
      return;
    }
    panelWindow.show();
    panelWindow.focus();
    return;
  }

  panelWindow = createPanelWindow();
  panelWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[Flicky] Panel FAILED to load:', code, desc, url);
  });
  panelWindow.on('close', (e) => {
    // Don't destroy on close — hide so reopening is instant and keeps state.
    if (!isAppQuitting) {
      e.preventDefault();
      panelWindow?.hide();
    }
  });

  panelWindow.show();
  panelWindow.focus();
}

function rebuildOverlays(): void {
  // Destroy existing overlays
  for (const win of overlayWindows) {
    if (!win.isDestroyed()) win.destroy();
  }

  overlayWindows = screen.getAllDisplays().map((display) => createOverlayWindow(display));
}
