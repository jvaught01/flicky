import { useState, useEffect, useRef, useCallback } from 'react';
import type { VoiceState, DetectedElement } from '../../shared/types';
import { RecordingStatusWidget } from './RecordingStatusWidget';

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

type CursorMode = 'following' | 'navigating' | 'holding' | 'returning';

export function OverlayApp() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [detectedElement, setDetectedElement] = useState<DetectedElement | null>(null);
  const [pointingPhrase, setPointingPhrase] = useState('');
  const [cursorMode, setCursorMode] = useState<CursorMode>('following');
  const [companionPos, setCompanionPos] = useState({ x: 0, y: 0 });
  const [isCursorOnThisDisplay, setIsCursorOnThisDisplay] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const levelsBufferRef = useRef<number[]>([]);
  const displayRef = useRef<{ id: number; bounds: { x: number; y: number; width: number; height: number } } | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnAnimRef = useRef<number | null>(null);
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

        const processor = ctx.createScriptProcessor(4096, 1, 1);
        scriptNodeRef.current = processor;

        processor.onaudioprocess = (e) => {
          const float32 = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(float32.length);
          let sumSq = 0;
          for (let i = 0; i < float32.length; i++) {
            const s = Math.max(-1, Math.min(1, float32[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            sumSq += s * s;
          }
          window.flicky.sendAudioChunk(pcm16.buffer);

          // RMS → rolling level buffer for the recording widget.
          const rms = Math.sqrt(sumSq / float32.length);
          const level = Math.min(1, rms * 2.5);
          const buf = levelsBufferRef.current;
          buf.push(level);
          if (buf.length > 10) buf.shift();
          setAudioLevels([...buf]);
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

    // Play TTS audio. No visual bubble to clear — we just play and move on.
    const unsubPlayAudio = window.flicky.onPlayAudio(async (audioData) => {
      try {
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
      } catch (err) {
        console.error('[Flicky] Audio playback failed:', err);
      }
    });

    return () => {
      unsubStart();
      unsubStop();
      unsubPlayAudio();
      stopMic();
    };
  }, []);

  const setCursorModeSync = useCallback((mode: CursorMode) => {
    setCursorMode(mode);
  }, []);

  const setCompanionPosSync = useCallback((pos: { x: number; y: number }) => {
    companionPosRef.current = pos;
    setCompanionPos(pos);
  }, []);

  const startReturnAnimation = useCallback(() => {
    setCursorModeSync('returning');

    const animate = () => {
      const target = cursorPosRef.current;
      const current = companionPosRef.current;
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 2) {
        setCompanionPosSync(target);
        setCursorModeSync('following');
        returnAnimRef.current = null;
        return;
      }

      const next = { x: current.x + dx * 0.08, y: current.y + dy * 0.08 };
      setCompanionPosSync(next);
      returnAnimRef.current = requestAnimationFrame(animate);
    };

    returnAnimRef.current = requestAnimationFrame(animate);
  }, [setCursorModeSync, setCompanionPosSync]);

  useEffect(() => {
    if (cursorMode === 'following') setCompanionPosSync(cursorPos);
    cursorPosRef.current = cursorPos;
  }, [cursorPos, cursorMode, setCompanionPosSync]);

  useEffect(() => {
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
      window.flicky.onElementDetected((el) => {
        if (el) {
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

          const bounds = displayRef.current?.bounds;
          const localTarget = {
            x: el.x - (bounds?.x ?? 0),
            y: el.y - (bounds?.y ?? 0),
          };
          setCompanionPosSync(localTarget);
          setCursorModeSync('navigating');

          setTimeout(() => setCursorModeSync('holding'), 650);
        } else {
          setDetectedElement(null);
          holdTimerRef.current = setTimeout(() => {
            holdTimerRef.current = null;
            startReturnAnimation();
          }, 3000);
        }
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (returnAnimRef.current) cancelAnimationFrame(returnAnimRef.current);
    };
  }, [setCursorModeSync, setCompanionPosSync, startReturnAnimation]);

  useEffect(() => {
    if (voiceState === 'listening') {
      setDetectedElement(null);
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      if (returnAnimRef.current) {
        cancelAnimationFrame(returnAnimRef.current);
        returnAnimRef.current = null;
      }
      setCursorModeSync('following');
    } else if (voiceState === 'idle') {
      levelsBufferRef.current = [];
      setAudioLevels([]);
    }
  }, [voiceState, setCursorModeSync]);

  const isNavigating = cursorMode === 'navigating';
  const isHolding = cursorMode === 'holding';
  const showOnThisDisplay = isCursorOnThisDisplay || isNavigating || isHolding;

  const cursorTransition = isNavigating
    ? 'left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
    : cursorMode === 'following'
      ? 'left 0.05s linear, top 0.05s linear'
      : 'none';

  void detectedElement;

  return (
    <div className="overlay-container">
      {showOnThisDisplay && (
        <>
          <div
            className={`cursor-triangle ${isNavigating || isHolding ? 'navigating' : ''}`}
            style={{
              left: companionPos.x,
              top: companionPos.y,
              transition: cursorTransition,
            }}
          >
            <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="fl-back" x1="20%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="fl-front" x1="10%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e0f2fe" />
                  <stop offset="50%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>

              {/* Back layer — offset down/right, darker */}
              <polygon
                points="10,14 40,24 20,42"
                fill="url(#fl-back)"
                stroke="url(#fl-back)"
                strokeWidth="3"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {/* Front layer — brighter, glossy */}
              <polygon
                points="4,4 34,14 14,32"
                fill="url(#fl-front)"
                stroke="url(#fl-front)"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {/* Upper-left edge gloss highlight */}
              <polyline
                points="4,4 34,14"
                fill="none"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <polyline
                points="4,4 14,32"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {(voiceState === 'listening' || voiceState === 'processing') && (
            <div
              className="overlay-recorder"
              style={{ left: companionPos.x + 44, top: companionPos.y - 4 }}
            >
              <RecordingStatusWidget
                phase={voiceState === 'listening' ? 'recording' : 'processing'}
                levels={audioLevels}
              />
            </div>
          )}

          {(isNavigating || isHolding) && pointingPhrase && (
            <div
              className="pointing-bubble"
              style={{
                left: companionPos.x + 44,
                top: companionPos.y - 8,
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
