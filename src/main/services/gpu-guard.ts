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
 * GPU process crashes across runs and degrade in tiers on the next
 * launch:
 *
 *   tier 0  hardware acceleration, the normal path
 *   tier 1  software rendering (`disableHardwareAcceleration`)
 *   tier 2  tier 1 plus an unsandboxed GPU process
 *
 * Tier 2 exists because tier 1 does not stop the GPU process from
 * launching — it only skips GL/driver init. That fixes a crash during
 * Mesa driver setup, but not one caused by the GPU sandbox failing to
 * start the process at all, which is a commonly reported cause of this
 * same error signature. If a machine keeps crashing while already in
 * software rendering, the sandbox is the next suspect.
 */

/** Crash counts at which each tier engages. */
const TIER_1_THRESHOLD = 3;
const TIER_2_THRESHOLD = 6;

/** Uptime without a GPU crash that counts as "this machine is fine". */
const HEALTHY_UPTIME_MS = 60_000;

/**
 * Reasons that indicate a broken GPU stack. Deliberately excludes
 * `clean-exit` and `killed` (normal teardown, OS/OOM kill, driver reset)
 * and `oom` — counting those would let ordinary shutdowns accumulate
 * into a permanent downgrade on a perfectly healthy machine.
 */
const FAILURE_REASONS = new Set(['crashed', 'abnormal-exit', 'launch-failed', 'integrity-failure']);

interface GpuState {
  crashes: number;
}

/** Tier applied this run, so the reset logic knows not to undo itself. */
let activeTier = 0;

/** Keeps a failed write from spamming the log on every crash event. */
let writeErrorLogged = false;

/** Set once the GPU has failed at least once during this run. */
let crashedThisRun = false;

function getStatePath(): string {
  // Safe before `ready`: userData is derived from the app name, and
  // nothing in this app calls setName/setPath.
  return path.join(app.getPath('userData'), 'gpu-state.json');
}

function readState(): GpuState {
  try {
    const raw = fs.readFileSync(getStatePath(), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<GpuState>;
    const crashes = Number(parsed?.crashes);
    // Number.isFinite rather than typeof: NaN is a number, and NaN
    // compares false against every threshold, which would disable the
    // fallback entirely.
    return { crashes: Number.isFinite(crashes) ? Math.max(0, Math.floor(crashes)) : 0 };
  } catch {
    return { crashes: 0 };
  }
}

function writeState(state: GpuState): void {
  try {
    writeFileAtomic(getStatePath(), JSON.stringify(state));
  } catch (err) {
    // A counter we can't persist only costs us the fallback on the next
    // launch; never let it stop the app from starting. Log it once so
    // it's diagnosable rather than invisible.
    if (!writeErrorLogged) {
      writeErrorLogged = true;
      console.error('[Flicky] Could not persist GPU crash state:', err);
    }
  }
}

function tierFor(crashes: number): number {
  if (crashes >= TIER_2_THRESHOLD) return 2;
  if (crashes >= TIER_1_THRESHOLD) return 1;
  return 0;
}

function applyTier(tier: number): void {
  if (tier >= 1) app.disableHardwareAcceleration();
  if (tier >= 2) app.commandLine.appendSwitch('disable-gpu-sandbox');
}

/**
 * Decide how much to degrade, and start counting crashes.
 *
 * Must run before `app.whenReady()`: `disableHardwareAcceleration` and
 * `commandLine.appendSwitch` only take effect pre-ready, and the crash
 * this guards against happens during startup, so the listener has to be
 * attached before ready or it misses the very events it exists to count.
 */
export function initGpuGuard(): void {
  // Escape hatch so a user hitting this can confirm it's the GPU
  // without waiting for the counter to trip.
  const forced = process.env.FLICKY_DISABLE_GPU;
  if (forced === '1' || forced === '2') {
    activeTier = Number(forced);
    console.log(`[Flicky] FLICKY_DISABLE_GPU=${forced} — starting at GPU fallback tier ${activeTier}.`);
    applyTier(activeTier);
  } else {
    const { crashes } = readState();
    activeTier = tierFor(crashes);
    if (activeTier > 0) {
      console.log(
        `[Flicky] GPU process failed ${crashes} time(s) on previous runs — ` +
          `starting at fallback tier ${activeTier}. Delete gpu-state.json in the ` +
          'app data directory to retry hardware acceleration.',
      );
      applyTier(activeTier);
    }
  }

  app.on('child-process-gone', (_event, details) => {
    if (details.type !== 'GPU') return;
    if (!FAILURE_REASONS.has(details.reason)) return;

    crashedThisRun = true;
    const next = readState().crashes + 1;
    writeState({ crashes: next });
    console.error(
      `[Flicky] GPU process gone (reason=${details.reason}, ` +
        `exitCode=${details.exitCode}). Failure count is now ${next}` +
        (tierFor(next) > activeTier ? `; tier ${tierFor(next)} will apply on next launch.` : '.'),
    );
  });
}

/**
 * Clear the counter once a run has proven itself stable. Call after the
 * app is ready.
 *
 * Only meaningful at tier 0. Above it the GPU is quiet *because* we
 * degraded, so treating that as proof the machine is healthy would
 * re-enable acceleration on the next launch and crash it again, forever.
 * Recovery at tier 1+ is the documented gpu-state.json deletion.
 */
export function confirmGpuHealthy(): void {
  if (activeTier > 0) return;

  setTimeout(() => {
    // A run that recovered from a GPU failure is not a clean run — the
    // count has to survive so repeated failures still add up.
    if (crashedThisRun) return;
    if (readState().crashes === 0) return;
    console.log('[Flicky] GPU has been stable this run — clearing the failure counter.');
    writeState({ crashes: 0 });
  }, HEALTHY_UPTIME_MS).unref?.();
}
