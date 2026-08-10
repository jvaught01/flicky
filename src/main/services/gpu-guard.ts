import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { writeFileAtomic } from './fs-util';

/**
 * Self-healing fallback for machines where the GPU process can't start.
 *
 * On some Linux setups (AMD integrated graphics on Mesa in particular)
 * Chromium's GPU process fails to launch, retries, and then takes the
 * whole app down with:
 *
 *   [ERROR:gpu_process_host.cc] GPU process launch failed: error_code=1002
 *   [FATAL:gpu_data_manager_impl_private.cc] GPU process isn't usable. Goodbye.
 *
 * There's no way to detect that before it happens, so instead we count
 * GPU process crashes across runs. Once a machine has crashed enough
 * times to look chronic rather than incidental, the next launch starts
 * with hardware acceleration off and the app comes up in software
 * rendering instead of dying.
 *
 * A run that stays up without a GPU crash clears the counter, so a
 * one-off crash during a driver update doesn't permanently downgrade
 * a machine that's otherwise fine.
 */

/** Consecutive-ish GPU crashes before we stop asking for the GPU. */
const CRASH_THRESHOLD = 3;

/** Uptime without a GPU crash that counts as "this machine is fine". */
const HEALTHY_UPTIME_MS = 60_000;

interface GpuState {
  crashes: number;
}

function getStatePath(): string {
  // Safe before `ready`: userData resolves from the app name alone.
  return path.join(app.getPath('userData'), 'gpu-state.json');
}

function readState(): GpuState {
  try {
    const raw = fs.readFileSync(getStatePath(), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<GpuState>;
    return { crashes: typeof parsed.crashes === 'number' ? parsed.crashes : 0 };
  } catch {
    return { crashes: 0 };
  }
}

function writeState(state: GpuState): void {
  try {
    writeFileAtomic(getStatePath(), JSON.stringify(state));
  } catch {
    // A missing counter only costs us the fallback on the next launch;
    // never let it stop the app from starting.
  }
}

/**
 * Decide whether to ask for hardware acceleration at all. Must run
 * before `app.whenReady()` — `disableHardwareAcceleration` is a no-op
 * (and throws in some Electron versions) once the app is ready.
 */
export function applyGpuFallback(): void {
  // Escape hatch so a user hitting this can confirm it's the GPU
  // without waiting for the counter to trip.
  if (process.env.FLICKY_DISABLE_GPU === '1') {
    console.log('[Flicky] FLICKY_DISABLE_GPU=1 — starting with software rendering.');
    app.disableHardwareAcceleration();
    return;
  }

  const { crashes } = readState();
  if (crashes >= CRASH_THRESHOLD) {
    console.log(
      `[Flicky] GPU process crashed ${crashes} time(s) on previous runs — ` +
        'starting with software rendering. Delete gpu-state.json in the app ' +
        'data directory to retry hardware acceleration.',
    );
    app.disableHardwareAcceleration();
  }
}

/**
 * Track GPU process crashes so the next launch can act on them.
 * Call once, after the app is ready.
 */
export function watchGpuProcess(): void {
  let crashedThisRun = false;

  app.on('child-process-gone', (_event, details) => {
    if (details.type !== 'GPU') return;

    crashedThisRun = true;
    const next = readState().crashes + 1;
    writeState({ crashes: next });
    console.error(
      `[Flicky] GPU process gone (reason=${details.reason}, ` +
        `exitCode=${details.exitCode}). Crash count is now ${next}.`,
    );
  });

  setTimeout(() => {
    if (crashedThisRun) return;
    if (readState().crashes === 0) return;
    console.log('[Flicky] GPU has been stable this run — clearing the crash counter.');
    writeState({ crashes: 0 });
  }, HEALTHY_UPTIME_MS).unref?.();
}
