import { app, BrowserWindow, Display } from 'electron';
import path from 'path';

const isDev = !app.isPackaged && process.env.VITE_DEV_SERVER === '1';

function getPreloadPath(): string {
  return path.join(__dirname, '../preload/index.js');
}

function loadPage(win: BrowserWindow, page: string): void {
  if (isDev) {
    const url = `http://localhost:5173/${page}.html`;
    console.log(`[Flicky] Loading ${page} from dev server: ${url}`);
    win.loadURL(url);
  } else {
    const filePath = path.join(__dirname, '../../renderer', `${page}.html`);
    console.log(`[Flicky] Loading ${page} from file: ${filePath}`);
    win.loadFile(filePath);
  }
}

/** The menu-bar settings / status panel. */
export function createPanelWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 340,
    height: 580,
    show: false,
    frame: false,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    transparent: false,
    backgroundColor: '#1a1a2e',
    alwaysOnTop: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  loadPage(win, 'panel');
  return win;
}

/** A transparent, click-through overlay covering one display. */
export function createOverlayWindow(display: Display): BrowserWindow {
  const { x, y, width, height } = display.bounds;

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    show: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Click-through: let mouse events pass to windows underneath
  win.setIgnoreMouseEvents(true, { forward: true });

  // Keep overlay above everything
  win.setAlwaysOnTop(true, 'screen-saver');

  // Visible on all workspaces / virtual desktops
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  loadPage(win, 'overlay');

  // Pass display info to overlay so it knows its coordinate space
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('display-info', {
      id: display.id,
      bounds: display.bounds,
      scaleFactor: display.scaleFactor,
    });
  });

  return win;
}
