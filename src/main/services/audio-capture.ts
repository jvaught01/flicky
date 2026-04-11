/**
 * Audio capture using Electron's desktopCapturer + Web Audio API.
 *
 * The actual microphone capture happens in the renderer (overlay window)
 * because the Web Audio API requires a browser context. This module
 * defines the IPC protocol for the renderer to stream PCM16 audio back
 * to the main process.
 *
 * In the renderer, we use navigator.mediaDevices.getUserMedia() for mic
 * access, pipe through an AudioWorklet to produce PCM16 @ 16kHz mono,
 * and send the buffers to main via IPC.
 */

export const AUDIO_IPC = {
  /** Renderer → Main: raw PCM16 audio chunk (ArrayBuffer) */
  AUDIO_CHUNK: 'audio-chunk',
  /** Main → Renderer: start capturing mic audio */
  START_CAPTURE: 'start-audio-capture',
  /** Main → Renderer: stop capturing mic audio */
  STOP_CAPTURE: 'stop-audio-capture',
  /** Renderer → Main: current audio power level (0-1) */
  AUDIO_LEVEL: 'audio-level',
} as const;
