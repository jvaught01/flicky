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
  // Hide dock icon on macOS (menu-bar-only app)
  if (process.platform === 'darwin') {
    app.dock?.hide();
  }

  // Initialize companion manager
  companion = new CompanionManager({
    onVoiceStateChanged: (state) => sendToAll(IPC.VOICE_STATE_CHANGED, state),
    onTranscriptUpdate: (result) => sendToAll(IPC.TRANSCRIPT_UPDATE, result),
    onAiResponseChunk: (chunk) => sendToOverlays(IPC.AI_RESPONSE_CHUNK, chunk),
    onAiResponseComplete: (text) => sendToAll(IPC.AI_RESPONSE_COMPLETE, text),
    onElementDetected: (el) => sendToOverlays(IPC.ELEMENT_DETECTED, el),
    onSettingsChanged: (s) => sendToPanel(IPC.SETTINGS_CHANGED, s),
    onStartAudioCapture: () => sendToOverlays(AUDIO_IPC.START_CAPTURE),
    onStopAudioCapture: () => sendToOverlays(AUDIO_IPC.STOP_CAPTURE),
    onPlayAudio: (buf) => sendToOverlays('play-audio', buf),
  });

  // Create tray
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Flicky');

  console.log('[Flicky] Tray created, registering click handler...');

  tray.on('click', (_event, bounds) => {
    console.log('[Flicky] Tray clicked, bounds:', bounds);
    togglePanel(bounds);
  });

  tray.on('double-click', (_event, bounds) => {
    console.log('[Flicky] Tray double-clicked, bounds:', bounds);
    togglePanel(bounds);
  });

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

  globalShortcut.register('Ctrl+Alt+X', () => {
    // Clear any pending "key released" timer
    if (pttDebounceTimer) {
      clearTimeout(pttDebounceTimer);
      pttDebounceTimer = null;
    }

    // Start recording on first press
    if (!pttActive) {
      pttActive = true;
      companion.startPushToTalk();
    }

    // Schedule stop — if no repeat fires within 250ms, the key was released
    pttDebounceTimer = setTimeout(() => {
      pttActive = false;
      pttDebounceTimer = null;
      companion.stopPushToTalk();
    }, 250);
  });

  // ── IPC Handlers ───────────────────────────────────────────────────

  ipcMain.handle(IPC.GET_SETTINGS, () => companion.getSettings());
  ipcMain.handle(IPC.GET_PERMISSIONS, () => companion.getPermissions());

  ipcMain.on(IPC.SET_MODEL, (_e, model) => companion.setModel(model));
  ipcMain.on(IPC.TOGGLE_CURSOR, (_e, enabled) => companion.toggleCursor(enabled));
  ipcMain.on(IPC.REQUEST_PERMISSION, (_e, kind) => companion.requestPermission(kind));
  ipcMain.on(IPC.OPEN_EXTERNAL, (_e, url) => shell.openExternal(url));
  ipcMain.on(IPC.QUIT_APP, () => app.quit());
  ipcMain.on(IPC.REPLAY_ONBOARDING, () => companion.replayOnboarding());
  ipcMain.on(IPC.COMPLETE_ONBOARDING, () => companion.completeOnboarding());
  ipcMain.on(IPC.SET_GROQ_MODEL, (_e, model) => companion.setGroqModel(model));
  ipcMain.on(IPC.CLEAR_CONTEXT, () => companion.clearContext());

  // API Key Management
  ipcMain.on(IPC.SET_API_KEY, (_e, name, value) => companion.setApiKey(name, value));
  ipcMain.on(IPC.DELETE_API_KEY, (_e, name) => companion.deleteApiKey(name));
  ipcMain.handle(IPC.GET_API_KEY_STATUS, () => companion.getApiKeyStatus());
  ipcMain.handle(IPC.TEST_TTS, () => companion.testTts());
  ipcMain.on(IPC.SET_VOICE, (_e, voiceId) => companion.setVoice(voiceId));

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
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// macOS: don't quit when all windows are closed (tray app)
app.on('window-all-closed', () => {
  // Don't quit — this is a tray app
});

// ── Window Management ──────────────────────────────────────────────────

function togglePanel(trayBounds?: Electron.Rectangle): void {
  console.log('[Flicky] togglePanel called, trayBounds:', trayBounds);
  console.log('[Flicky] panelWindow exists:', !!panelWindow, 'destroyed:', panelWindow?.isDestroyed(), 'visible:', panelWindow && !panelWindow.isDestroyed() ? panelWindow.isVisible() : 'N/A');

  if (panelWindow && !panelWindow.isDestroyed()) {
    if (panelWindow.isVisible()) {
      console.log('[Flicky] Panel is visible, hiding...');
      panelWindow.hide();
      return;
    }
  } else {
    console.log('[Flicky] Creating new panel window...');
    panelWindow = createPanelWindow();

    panelWindow.webContents.on('did-finish-load', () => {
      console.log('[Flicky] Panel webContents finished loading');
    });
    panelWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error('[Flicky] Panel FAILED to load:', code, desc, url);
    });

    // DEBUG: disable blur-to-hide for now so we can see the panel
    // panelWindow.on('blur', () => { panelWindow?.hide(); });

    // Open DevTools to inspect what's rendering
    panelWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Center on primary display work area
  {
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    const pb = panelWindow.getBounds();
    const x = Math.round((sw - pb.width) / 2);
    const y = Math.round((sh - pb.height) / 2);
    console.log('[Flicky] Centering panel at:', x, y);
    panelWindow.setPosition(x, y, false);
  }

  console.log('[Flicky] Showing and focusing panel...');
  panelWindow.show();
  panelWindow.focus();
  console.log('[Flicky] Panel visible:', panelWindow.isVisible(), 'bounds:', panelWindow.getBounds());
}

function rebuildOverlays(): void {
  // Destroy existing overlays
  for (const win of overlayWindows) {
    if (!win.isDestroyed()) win.destroy();
  }

  overlayWindows = screen.getAllDisplays().map((display) => createOverlayWindow(display));
}
