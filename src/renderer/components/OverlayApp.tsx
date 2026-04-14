import { useState, useEffect, useRef, useCallback } from 'react';
import type { VoiceState, DetectedElement } from '../../shared/types';
import { Waveform } from './Waveform';
import { CursorCompanion } from './CursorCompanion';

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
  const displayRef = useRef<{ id: number; bounds: { x: number; y: number; width: number; height: number } } | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnAnimRef = useRef<number | null>(null);
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const companionPosRef = useRef({ x: 0, y: 0 });

  // ── Mic capture ──────────────────────────────────────────────────────
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  /** AnalyserNode for CursorCompanion audio-reactive rendering. */
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  /** true while getUserMedia hasn't resolved yet. */
  const micStartingRef = useRef(false);
  /** set by stopMic so a pending start can abort before attaching. */
  const micStopRequestedRef = useRef(false);

  // ── TTS playback (cancelable) ───────────────────────────────────────
  const ttsRef = useRef<{ audio: HTMLAudioElement; url: string } | null>(null);
  const stopCurrentTts = useCallback(() => {
    const current = ttsRef.current;
    if (!current) return;
    try {
      current.audio.pause();
      current.audio.src = '';
    } catch { /* ignore */ }
    URL.revokeObjectURL(current.url);
    ttsRef.current = null;
  }, []);

  useEffect(() => {
    const startMic = async () => {
      // Ignore overlapping starts.
      if (micStartingRef.current || mediaStreamRef.current) return;
      micStartingRef.current = true;
      micStopRequestedRef.current = false;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
        });

        // A stop may have arrived before getUserMedia resolved; if so,
        // release the stream immediately instead of attaching it.
        if (micStopRequestedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        const ctx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);

        // AnalyserNode feeds CursorCompanion audio-reactive rendering
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        setAnalyserNode(analyser);

        const processor = ctx.createScriptProcessor(4096, 1, 1);
        scriptNodeRef.current = processor;

        processor.onaudioprocess = (e) => {
          const float32 = e.inputBuffer.getChannelData(0);
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
      } finally {
        micStartingRef.current = false;
      }
    };

    const stopMic = () => {
      // Flag for any in-flight startMic to bail before it attaches.
      micStopRequestedRef.current = true;
      scriptNodeRef.current?.disconnect();
      scriptNodeRef.current = null;
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      setAnalyserNode(null);
    };

    const unsubStart = window.flicky.onStartCapture(() => startMic());
    const unsubStop = window.flicky.onStopCapture(() => stopMic());

    // Play TTS audio. Any previous playback is interrupted first so
    // back-to-back responses don't stack on top of each other.
    const unsubPlayAudio = window.flicky.onPlayAudio(async (audioData) => {
      stopCurrentTts();
      try {
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        ttsRef.current = { audio, url };
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (ttsRef.current?.audio === audio) ttsRef.current = null;
        };
        await audio.play();
      } catch (err) {
        console.error('[Flicky] Audio playback failed:', err);
        stopCurrentTts();
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
    const unsubDisplayInfo = window.flicky.onDisplayInfo((info) => {
      displayRef.current = { id: info.id, bounds: info.bounds };
    });

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
      unsubDisplayInfo();
      unsubs.forEach((u) => u());
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (returnAnimRef.current) cancelAnimationFrame(returnAnimRef.current);
    };
  }, [setCursorModeSync, setCompanionPosSync, startReturnAnimation]);

  useEffect(() => {
    if (voiceState === 'listening') {
      // User started a new turn — interrupt anything Flicky was saying.
      stopCurrentTts();
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
    }
  }, [voiceState, setCursorModeSync, stopCurrentTts]);

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
            <CursorCompanion
              voiceState={voiceState}
              isNavigating={isNavigating}
              isHolding={isHolding}
              analyserNode={analyserNode}
            />
          </div>

          {voiceState === 'listening' && (
            <div
              className="overlay-waveform"
              style={{ left: companionPos.x + 44, top: companionPos.y + 2 }}
            >
              <Waveform state="listening" bars={10} height={22} />
            </div>
          )}

          {voiceState === 'processing' && (
            <div
              className="processing-spinner"
              style={{ left: companionPos.x + 44, top: companionPos.y + 6 }}
            />
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
