/**
 * Linux X11 cursor position source.
 *
 * Electron's screen.getCursorScreenPoint() has been broken on Linux X11
 * since v29 (electron/electron#42519) — it returns a single stale point
 * forever. Flicky's overlay follows the cursor at ~60fps, so a frozen
 * coordinate pins the companion cursor in place.
 *
 * This module reads the pointer directly from the X server via the pure-JS
 * `x11` client (no native compilation, no subprocess). QueryPointer is
 * async — the reply arrives on the next event-loop turn — so poll() issues
 * the query and returns the last-known position, yielding a one-tick lag
 * that is imperceptible at 60fps.
 */

/** Minimal typing for the `x11` package (has no bundled type declarations). */
interface X11ClientHandle {
  client: {
    QueryPointer(
      root: number,
      callback: (
        err: Error | null,
        reply?: { rootX: number; rootY: number; sameScreen: boolean },
      ) => void,
    ): void;
  };
  screen: Array<{ root: number }>;
}

interface X11Module {
  createClient(options: { display: string }): {
    on(event: 'connect', handler: (client: X11ClientHandle) => void): void;
    on(event: 'error', handler: (err: Error) => void): void;
  };
}

/**
 * Polls the real pointer position directly from the X server.
 *
 * `display` is the X11 display string (e.g. ":0"). The connection is
 * established lazily on first poll and held open; if the display is
 * unreachable, polls keep returning the fallback position instead of
 * throwing.
 */
export class X11CursorSource {
  private client: X11ClientHandle | null = null;
  private connectionError: Error | null = null;
  private lastPoint: { x: number; y: number } | null = null;
  private readonly display: string;

  constructor(display: string) {
    this.display = display;
  }

  /**
   * Issues a fresh pointer query and returns the most recent known
   * position. Returns null only when the X connection has not yet produced
   * a reply (first call) or is unreachable.
   */
  poll(): { x: number; y: number } | null {
    if (!this.client && !this.connectionError) {
      this.connect();
    }
    if (!this.client || this.connectionError) return this.lastPoint;

    const root = this.client.screen[0]?.root;
    if (root === undefined) return this.lastPoint;

    try {
      this.client.client.QueryPointer(root, (err, reply) => {
        if (err) {
          this.connectionError = err;
          return;
        }
        if (reply) {
          this.lastPoint = { x: reply.rootX, y: reply.rootY };
        }
      });
    } catch (err) {
      this.connectionError = err as Error;
    }
    return this.lastPoint;
  }

  private connect(): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const x11 = require('x11') as X11Module;
      const client = x11.createClient({ display: this.display });
      client.on('connect', (handle) => {
        this.client = handle;
        this.connectionError = null;
      });
      client.on('error', (err) => {
        this.connectionError = err;
      });
    } catch (err) {
      this.connectionError = err as Error;
    }
  }

  get isConnected(): boolean {
    return !!this.client && !this.connectionError;
  }
}
