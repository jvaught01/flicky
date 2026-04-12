import { useState, useEffect, useRef, useCallback } from 'react';
import type { VoiceState, DetectedElement } from '../../shared/types';
import { Waveform as SharedWaveform } from './Waveform';

const POINTING_PHRASES = [
  'right here!',
  'found it!',
  'this one!',
  'over here!',
  'look!',
  'here it is!',
  'this thing!',
  'see this?',
];

function randomPhrase(): string {
  return POINTING_PHRASES[Math.floor(Math.random() * POINTING_PHRASES.length)];
}

/**
 * Companion cursor behavior modes:
 * - 'following'  → smoothly tracks the user's mouse
 * - 'navigating' → flying to a target element Claude pointed at
 * - 'holding'    → staying at the target while Claude explains
 * - 'returning'  → smoothly drifting back to the mouse after holding
 */
type CursorMode = 'following' | 'navigating' | 'holding' | 'returning';

export function OverlayApp() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [responseText, setResponseText] = useState('');
  const [detectedElement, setDetectedElement] = useState<DetectedElement | null>(null);
  const [pointingPhrase, setPointingPhrase] = useState('');
  const [cursorMode, setCursorMode] = useState<CursorMode>('following');
  const [companionPos, setCompanionPos] = useState({ x: 0, y: 0 });
  const [isCursorOnThisDisplay, setIsCursorOnThisDisplay] = useState(false);
  const displayRef = useRef<{ id: number; bounds: { x: number; y: number; width: number; height: number } } | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnAnimRef = useRef<number | null>(null);
  const responseClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorModeRef = useRef<CursorMode>('following');
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const companionPosRef = useRef({ x: 0, y: 0 });

  // ── Mic capture ──────────────────────────────────────────────────────
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
        });
        mediaStreamRef.current = stream;

        const ctx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);

        // ScriptProcessor to get raw PCM and send to main
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        scriptNodeRef.current = processor;

        processor.onaudioprocess = (e) => {
          const float32 = e.inputBuffer.getChannelData(0);
          // Convert Float32 → PCM16
          const pcm16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            const s = Math.max(-1, Math.min(1, float32[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          window.flicky.sendAudioChunk(pcm16.buffer);
        };

        source.connect(processor);
        processor.connect(ctx.destination);
      } catch (err) {
        console.error('[Flicky] Mic capture failed:', err);
      }
    };

    const stopMic = () => {
      scriptNodeRef.current?.disconnect();
      scriptNodeRef.current = null;
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };

    const unsubStart = window.flicky.onStartCapture(() => startMic());
    const unsubStop = window.flicky.onStopCapture(() => stopMic());

    // Play TTS audio from main process, then clear bubble after playback
    const unsubPlayAudio = window.flicky.onPlayAudio(async (audioData) => {
      try {
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          // Clear speech bubble 5 seconds after TTS finishes
          if (responseClearTimerRef.current) clearTimeout(responseClearTimerRef.current);
          responseClearTimerRef.current = setTimeout(() => {
            setResponseText('');
            responseClearTimerRef.current = null;
          }, 5000);
        };
        await audio.play();
      } catch (err) {
        console.error('[Flicky] Audio playback failed:', err);
        // If TTS fails, fall back to clearing after 5 seconds
        if (responseClearTimerRef.current) clearTimeout(responseClearTimerRef.current);
        responseClearTimerRef.current = setTimeout(() => {
          setResponseText('');
          responseClearTimerRef.current = null;
        }, 5000);
      }
    });

    return () => {
      unsubStart();
      unsubStop();
      unsubPlayAudio();
      stopMic();
    };
  }, []);

  // Keep refs in sync with state for use in animation callbacks
  const setCursorModeSync = useCallback((mode: CursorMode) => {
    cursorModeRef.current = mode;
    setCursorMode(mode);
  }, []);

  const setCompanionPosSync = useCallback((pos: { x: number; y: number }) => {
    companionPosRef.current = pos;
    setCompanionPos(pos);
  }, []);

  // Smooth return animation: lerp from current position back to mouse
  const startReturnAnimation = useCallback(() => {
    setCursorModeSync('returning');

    const animate = () => {
      const target = cursorPosRef.current;
      const current = companionPosRef.current;
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 2) {
        // Close enough — snap and resume following
        setCompanionPosSync(target);
        setCursorModeSync('following');
        returnAnimRef.current = null;
        return;
      }

      // Ease toward mouse (lerp factor 0.08 = smooth drift)
      const next = {
        x: current.x + dx * 0.08,
        y: current.y + dy * 0.08,
      };
      setCompanionPosSync(next);
      returnAnimRef.current = requestAnimationFrame(animate);
    };

    returnAnimRef.current = requestAnimationFrame(animate);
  }, [setCursorModeSync, setCompanionPosSync]);

  // When following, sync companion position to mouse
  useEffect(() => {
    if (cursorMode === 'following') {
      setCompanionPosSync(cursorPos);
    }
    cursorPosRef.current = cursorPos;
  }, [cursorPos, cursorMode, setCompanionPosSync]);

  useEffect(() => {
    // Listen for display info from main process
    const handleDisplayInfo = (_e: Event, info: { id: number; bounds: { x: number; y: number; width: number; height: number } }) => {
      displayRef.current = info;
    };
    // @ts-expect-error — electron IPC on window
    window.electronAPI?.onDisplayInfo?.(handleDisplayInfo);

    const unsubs = [
      window.flicky.onVoiceStateChanged(setVoiceState),
      window.flicky.onCursorPosition((pos) => {
        const bounds = displayRef.current?.bounds;
        if (bounds) {
          const onThis =
            pos.x >= bounds.x && pos.x < bounds.x + bounds.width &&
            pos.y >= bounds.y && pos.y < bounds.y + bounds.height;
          setIsCursorOnThisDisplay(onThis);
          setCursorPos({ x: pos.x - bounds.x, y: pos.y - bounds.y });
        } else {
          setIsCursorOnThisDisplay(true);
          setCursorPos(pos);
        }
      }),
      window.flicky.onAiResponseChunk((chunk) => {
        setResponseText((prev) => prev + chunk);
      }),
      window.flicky.onAiResponseComplete(() => {
        // Bubble stays visible until TTS playback ends + 5 seconds.
        // If no TTS key is set, fall back to clearing after 8 seconds.
        if (responseClearTimerRef.current) clearTimeout(responseClearTimerRef.current);
        responseClearTimerRef.current = setTimeout(() => {
          setResponseText('');
          responseClearTimerRef.current = null;
        }, 8000);
      }),
      window.flicky.onElementDetected((el) => {
        if (el) {
          // Cancel any return animation in progress
          if (returnAnimRef.current) {
            cancelAnimationFrame(returnAnimRef.current);
            returnAnimRef.current = null;
          }
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
          }

          setPointingPhrase(randomPhrase());
          setDetectedElement(el);

          // Compute target in local coords
          const bounds = displayRef.current?.bounds;
          const localTarget = {
            x: el.x - (bounds?.x ?? 0),
            y: el.y - (bounds?.y ?? 0),
          };
          setCompanionPosSync(localTarget);
          setCursorModeSync('navigating');

          // After the fly-in animation completes, switch to holding
          setTimeout(() => setCursorModeSync('holding'), 650);
        } else {
          // Element cleared — hold position, then smoothly return
          setDetectedElement(null);
          holdTimerRef.current = setTimeout(() => {
            holdTimerRef.current = null;
            startReturnAnimation();
          }, 3000); // Hold at target for 3 seconds after clearing
        }
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (returnAnimRef.current) cancelAnimationFrame(returnAnimRef.current);
      if (responseClearTimerRef.current) clearTimeout(responseClearTimerRef.current);
    };
  }, [setCursorModeSync, setCompanionPosSync, startReturnAnimation]);

  // Reset response text when a new listening session starts
  useEffect(() => {
    if (voiceState === 'listening') {
      setResponseText('');
      setDetectedElement(null);
      if (responseClearTimerRef.current) {
        clearTimeout(responseClearTimerRef.current);
        responseClearTimerRef.current = null;
      }
      // Cancel any hold/return and snap back to following
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      if (returnAnimRef.current) {
        cancelAnimationFrame(returnAnimRef.current);
        returnAnimRef.current = null;
      }
      setCursorModeSync('following');
    }
  }, [voiceState, setCursorModeSync]);

  const isNavigating = cursorMode === 'navigating';
  const isHolding = cursorMode === 'holding';

  // Only render the companion on the display where the cursor is,
  // or on the display being pointed at (navigating/holding).
  const showOnThisDisplay = isCursorOnThisDisplay || isNavigating || isHolding;

  // Cursor transition style depends on mode
  const cursorTransition = isNavigating
    ? 'left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
    : cursorMode === 'following'
      ? 'left 0.05s linear, top 0.05s linear'
      : 'none'; // 'holding' and 'returning' — position set directly

  return (
    <div className="overlay-container">
      {showOnThisDisplay && (
        <>
          {/* Blue triangle cursor — companion cursor with independent position */}
          <div
            className={`cursor-triangle ${isNavigating || isHolding ? 'navigating' : ''}`}
            style={{
              left: companionPos.x,
              top: companionPos.y,
              transition: cursorTransition,
            }}
          >
            <svg viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">
              <polygon points="12,0 24,28 0,28" />
            </svg>
          </div>

          {/* Waveform during listening */}
          {voiceState === 'listening' && (
            <div
              className="overlay-waveform"
              style={{ left: companionPos.x + 30, top: companionPos.y - 4 }}
            >
              <SharedWaveform state="listening" bars={12} height={26} />
            </div>
          )}

          {/* Spinner during processing */}
          {voiceState === 'processing' && (
            <div
              className="processing-spinner"
              style={{ left: companionPos.x + 30, top: companionPos.y }}
            />
          )}

          {/* Speech bubble follows the companion cursor */}
          {responseText && (
            <div
              className="speech-bubble"
              style={{ left: companionPos.x + 30, top: companionPos.y - 10 }}
            >
              {responseText}
            </div>
          )}

          {/* Pointing label — shown while navigating or holding at target */}
          {(isNavigating || isHolding) && pointingPhrase && (
            <div
              className="pointing-bubble"
              style={{
                left: companionPos.x + 30,
                top: companionPos.y - 10,
              }}
            >
              {pointingPhrase}
            </div>
          )}
        </>
      )}
    </div>
  );
}

