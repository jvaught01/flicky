import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ApiKeyName,
  FlickySettings,
  MindProvider,
  PermissionStatus,
  VoiceState,
} from '../../../shared/types';
import { CursorIcon } from '../CursorIcon';
import { KeyEntry } from './KeyEntry';
import { ShortcutCapture } from './ShortcutCapture';

/**
 * First-run setup. Each step verifies the thing it configures — a key
 * is round-tripped against its provider, the shortcut has to actually
 * fire, the mic has to actually produce level, and the final step runs
 * a real end-to-end turn — so a user who reaches "Done" has a working
 * Flicky, not just a filled-in form.
 */

type StepId =
  | 'welcome'
  | 'permissions'
  | 'mind'
  | 'ear'
  | 'voice'
  | 'shortcut'
  | 'mic'
  | 'try'
  | 'done';

interface StepMeta {
  id: StepId;
  title: string;
}

const platform = window.flicky.platform;
const isMac = platform === 'darwin';
const isWin = platform === 'win32';

const ALL_STEPS: StepMeta[] = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'permissions', title: 'Permissions' },
  { id: 'mind', title: 'Mind' },
  { id: 'ear', title: 'Ear' },
  { id: 'voice', title: 'Voice' },
  { id: 'shortcut', title: 'Shortcut' },
  { id: 'mic', title: 'Mic check' },
  { id: 'try', title: 'Try it' },
  { id: 'done', title: 'Done' },
];

// Linux has no OS-level mic/screen gate we can query; skip the step.
const STEPS = ALL_STEPS.filter((s) => s.id !== 'permissions' || isMac || isWin);

interface OnboardingProps {
  settings: FlickySettings;
  voiceState: VoiceState;
}

export function Onboarding({ settings, voiceState }: OnboardingProps) {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const next = useCallback(() => setIndex((i) => Math.min(STEPS.length - 1, i + 1)), []);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  return (
    <div className="ob">
      <aside className="ob-rail">
        <div className="ob-brand">
          <CursorIcon size={28} />
          <span>Flicky setup</span>
        </div>
        <ol className="ob-rail-steps">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className={`ob-rail-step ${i === index ? 'on' : ''} ${i < index ? 'done' : ''}`}
            >
              <span className="ob-rail-dot">{i < index ? '✓' : i + 1}</span>
              <span>{s.title}</span>
            </li>
          ))}
        </ol>
        <button
          className="ob-skip"
          onClick={() => window.flicky.completeOnboarding()}
          title="You can rerun setup any time from General."
        >
          Skip setup
        </button>
      </aside>

      <main className="ob-main" key={step.id}>
        {step.id === 'welcome' && <WelcomeStep onNext={next} />}
        {step.id === 'permissions' && <PermissionsStep onNext={next} onBack={back} />}
        {step.id === 'mind' && <MindStep settings={settings} onNext={next} onBack={back} />}
        {step.id === 'ear' && <EarStep settings={settings} onNext={next} onBack={back} />}
        {step.id === 'voice' && <VoiceStep settings={settings} onNext={next} onBack={back} />}
        {step.id === 'shortcut' && <ShortcutStep settings={settings} onNext={next} onBack={back} />}
        {step.id === 'mic' && <MicStep onNext={next} onBack={back} />}
        {step.id === 'try' && (
          <TryStep settings={settings} voiceState={voiceState} onNext={next} onBack={back} />
        )}
        {step.id === 'done' && <DoneStep settings={settings} onBack={back} />}
      </main>
    </div>
  );
}

// ── Shared bits ────────────────────────────────────────────────────────

function Keys({ shortcut }: { shortcut: string }) {
  const keys = shortcut.split('+').filter(Boolean);
  return (
    <span className="ob-keys">
      {keys.map((k, i) => (
        <span key={`${k}-${i}`}>
          <kbd>{k}</kbd>
          {i < keys.length - 1 && <span className="plus">+</span>}
        </span>
      ))}
    </span>
  );
}

interface FooterProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextHint?: string;
  secondary?: React.ReactNode;
}

function Footer({ onBack, onNext, nextLabel = 'Continue', nextDisabled, nextHint, secondary }: FooterProps) {
  return (
    <div className="ob-footer">
      {onBack ? (
        <button className="btn subtle" onClick={onBack}>← Back</button>
      ) : <span />}
      <div className="ob-footer-right">
        {nextHint && <span className="ob-footer-hint">{nextHint}</span>}
        {secondary}
        {onNext && (
          <button className="btn primary" onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function Status({ kind, children }: { kind: 'ok' | 'warn' | 'err' | 'wait'; children: React.ReactNode }) {
  return (
    <div className={`ob-status ${kind}`}>
      <span className="ob-status-icon">
        {kind === 'ok' ? '✓' : kind === 'warn' ? '!' : kind === 'err' ? '×' : <span className="spinner-sm" />}
      </span>
      <span>{children}</span>
    </div>
  );
}

/**
 * A key that's already in the store. Re-validated live on mount so a
 * key saved last month that has since been revoked (or an account that
 * ran out of credit) is caught here, not on the first real question.
 */
function SavedKey({ name, label, onReplace, extra }: {
  name: ApiKeyName;
  label: string;
  onReplace: () => void;
  extra?: React.ReactNode;
}) {
  const [state, setState] = useState<{ kind: 'wait' } | { kind: 'ok' } | { kind: 'err'; error: string }>({ kind: 'wait' });
  const run = useCallback(async () => {
    setState({ kind: 'wait' });
    const res = await window.flicky.validateStoredApiKey(name);
    setState(res.ok ? { kind: 'ok' } : { kind: 'err', error: res.error ?? 'Validation failed.' });
  }, [name]);
  useEffect(() => { void run(); }, [run]);

  return (
    <>
      <div className="ob-card-title">{label}</div>
      {state.kind === 'wait' && <Status kind="wait">testing the saved key against the provider…</Status>}
      {state.kind === 'ok' && <Status kind="ok">connected — the provider accepted this key</Status>}
      {state.kind === 'err' && <Status kind="err">{state.error}</Status>}
      <div className="actions">
        <button className="btn xs" onClick={() => void run()} disabled={state.kind === 'wait'}>Test again</button>
        <button className="btn xs subtle" onClick={onReplace}>Replace key</button>
        {extra}
      </div>
    </>
  );
}

// ── 1. Welcome ─────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div className="ob-hero-icon"><CursorIcon size={64} /></div>
      <h1 className="ob-h1">Hi, I&apos;m Flicky<em>.</em></h1>
      <p className="ob-lead">
        A voice assistant that can see your screen. Hold a shortcut, ask a question, and a
        little blue cursor flies over to point at whatever I&apos;m talking about.
      </p>
      <ul className="ob-bullets">
        <li>
          <b>Hold, talk, release.</b> No wake word, no window to click into — it works from
          any app.
        </li>
        <li>
          <b>I see what you see.</b> A screenshot of your current screen goes with every
          question so I can answer &ldquo;what does this error mean?&rdquo; or &ldquo;where&apos;s
          the export button?&rdquo;
        </li>
        <li>
          <b>Bring your own keys.</b> You connect your own accounts for reasoning,
          transcription and voice. Keys are encrypted on this machine and only ever sent to
          the provider they belong to.
        </li>
      </ul>
      <p className="ob-fine">
        Setup takes about three minutes. Each step checks itself, so when you reach the end
        everything actually works.
      </p>
      <Footer onNext={onNext} nextLabel="Let's set up →" />
    </>
  );
}

// ── 2. Permissions ─────────────────────────────────────────────────────

function PermissionsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [perms, setPerms] = useState<PermissionStatus | null>(null);

  // Poll while on this step — the user is flipping toggles in an OS
  // settings window, and we want the row to go green the moment it
  // takes without them having to click anything here.
  useEffect(() => {
    let alive = true;
    const tick = () => window.flicky.getPermissions().then((p) => { if (alive) setPerms(p); });
    void tick();
    const t = setInterval(tick, 1500);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const micOk = perms?.microphone ?? false;
  const micBlocked = perms?.microphoneStatus === 'denied' || perms?.microphoneStatus === 'restricted';
  const screenOk = isMac ? (perms?.screen ?? false) : true;
  const allOk = micOk && screenOk;

  return (
    <>
      <h1 className="ob-h1">Let me hear and see<em>.</em></h1>
      <p className="ob-lead">
        {isWin
          ? 'Windows blocks desktop apps from the microphone until you allow it. Flicky can\'t hear you otherwise — this is the most common reason it seems to do nothing.'
          : 'macOS asks per app. Grant these once and you\'re set.'}
      </p>

      <div className="ob-card">
        <div className="ob-perm-row">
          <div>
            <div className="ob-perm-title">Microphone</div>
            <div className="ob-perm-sub">
              {isWin
                ? 'Settings → Privacy & security → Microphone → turn on “Microphone access” and “Let desktop apps access your microphone”.'
                : 'System Settings → Privacy & Security → Microphone → enable Flicky.'}
            </div>
          </div>
          <div className="ob-perm-right">
            {perms === null ? (
              <Status kind="wait">checking</Status>
            ) : micOk ? (
              <Status kind="ok">allowed</Status>
            ) : (
              <Status kind={micBlocked ? 'err' : 'warn'}>{micBlocked ? 'blocked' : 'not granted'}</Status>
            )}
            {!micOk && (
              <button className="btn xs" onClick={() => window.flicky.requestPermission('microphone')}>
                {isWin ? 'Open Windows settings' : 'Grant'}
              </button>
            )}
          </div>
        </div>

        {isMac && (
          <div className="ob-perm-row">
            <div>
              <div className="ob-perm-title">Screen Recording</div>
              <div className="ob-perm-sub">
                So Flicky can take the screenshot that goes with each question. macOS
                requires a quit &amp; reopen after granting this one.
              </div>
            </div>
            <div className="ob-perm-right">
              {perms === null ? (
                <Status kind="wait">checking</Status>
              ) : screenOk ? (
                <Status kind="ok">allowed</Status>
              ) : (
                <Status kind="warn">not granted</Status>
              )}
              {!screenOk && (
                <button className="btn xs" onClick={() => window.flicky.requestPermission('screen')}>
                  Grant
                </button>
              )}
            </div>
          </div>
        )}

        {isWin && (
          <div className="ob-perm-row">
            <div>
              <div className="ob-perm-title">Screen capture</div>
              <div className="ob-perm-sub">No permission needed on Windows.</div>
            </div>
            <div className="ob-perm-right"><Status kind="ok">ready</Status></div>
          </div>
        )}
      </div>

      <Footer
        onBack={onBack}
        onNext={onNext}
        nextDisabled={false}
        nextHint={allOk ? undefined : 'You can continue, but the mic check later will fail until this is allowed.'}
      />
    </>
  );
}

// ── 3. Mind ────────────────────────────────────────────────────────────

const PROVIDERS: Array<{ id: MindProvider; label: string; sub: string; logo: string; cls: string }> = [
  { id: 'anthropic', label: 'Anthropic', sub: 'Claude Sonnet / Opus · built-in web search', logo: 'A', cls: '' },
  { id: 'openai', label: 'OpenAI', sub: 'GPT-5 · GPT-4o', logo: 'Ai', cls: 'openai' },
  { id: 'ollama', label: 'Local', sub: 'Ollama · LM Studio · any OpenAI-compatible endpoint', logo: '⬡', cls: 'local' },
];

function MindStep({ settings, onNext, onBack }: { settings: FlickySettings; onNext: () => void; onBack: () => void }) {
  const provider = settings.mindProvider;
  const keyName = provider === 'openai' ? 'openai' : 'anthropic';
  const hasKey = provider === 'openai' ? settings.apiKeyStatus.openai : settings.apiKeyStatus.anthropic;
  const hasLocal = (settings.localConnections ?? []).some((c) => c.enabled);
  const ready = provider === 'ollama' ? true : hasKey;
  const [replacing, setReplacing] = useState(false);

  return (
    <>
      <h1 className="ob-h1">Pick a brain<em>.</em></h1>
      <p className="ob-lead">
        The model that reads your screen and answers. Paste an API key and I&apos;ll make a
        test call to confirm it works before saving it.
      </p>

      <div className="ob-choice">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            className={`ob-choice-item ${provider === p.id ? 'on' : ''}`}
            onClick={() => window.flicky.setMindProvider(p.id)}
          >
            <div className={`provider-logo ${p.cls}`}>{p.logo}</div>
            <div>
              <div className="ob-choice-title">{p.label}</div>
              <div className="ob-choice-sub">{p.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="ob-card">
        {provider === 'ollama' ? (
          <>
            <div className="ob-card-title">Local endpoint</div>
            <p className="ob-card-text">
              {hasLocal
                ? 'A local connection is already enabled.'
                : 'No local connection yet. Finish setup, then add one under Mind → Local (URL, optional bearer token, and the model to use). Until then, questions will fail with “no enabled local connection”.'}
            </p>
          </>
        ) : hasKey && !replacing ? (
          <SavedKey
            name={keyName}
            label={`${provider === 'openai' ? 'OpenAI' : 'Anthropic'} key`}
            onReplace={() => setReplacing(true)}
          />
        ) : (
          <>
            <div className="ob-card-title">{provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key</div>
            <p className="ob-card-text">
              Get one from{' '}
              <button
                className="link"
                onClick={() => window.flicky.openExternal(
                  provider === 'openai' ? 'https://platform.openai.com/api-keys' : 'https://console.anthropic.com/settings/keys',
                )}
              >
                {provider === 'openai' ? 'platform.openai.com' : 'console.anthropic.com'} →
              </button>
            </p>
            <KeyEntry
              name={keyName}
              placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
              onSaved={() => setReplacing(false)}
              onCancel={hasKey ? () => setReplacing(false) : undefined}
            />
          </>
        )}
      </div>

      <Footer
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!ready}
        nextHint={ready ? undefined : 'Add a working key to continue.'}
      />
    </>
  );
}

// ── 4. Ear ─────────────────────────────────────────────────────────────

function EarStep({ settings, onNext, onBack }: { settings: FlickySettings; onNext: () => void; onBack: () => void }) {
  const hasKey = settings.apiKeyStatus.groq;
  const [replacing, setReplacing] = useState(false);
  return (
    <>
      <h1 className="ob-h1">Give me ears<em>.</em></h1>
      <p className="ob-lead">
        Your voice is transcribed by Groq&apos;s Whisper — it&apos;s fast, accurate, and has a
        generous free tier.
      </p>
      <div className="ob-card">
        {hasKey && !replacing ? (
          <SavedKey name="groq" label="Groq key" onReplace={() => setReplacing(true)} />
        ) : (
          <>
            <div className="ob-card-title">Groq API key</div>
            <p className="ob-card-text">
              Get one from{' '}
              <button className="link" onClick={() => window.flicky.openExternal('https://console.groq.com/keys')}>
                console.groq.com →
              </button>
            </p>
            <KeyEntry
              name="groq"
              placeholder="gsk_..."
              onSaved={() => setReplacing(false)}
              onCancel={hasKey ? () => setReplacing(false) : undefined}
            />
          </>
        )}
      </div>
      <Footer
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!hasKey}
        nextHint={hasKey ? undefined : 'Required — without it I can’t hear you.'}
      />
    </>
  );
}

// ── 5. Voice ───────────────────────────────────────────────────────────

function VoiceStep({ settings, onNext, onBack }: { settings: FlickySettings; onNext: () => void; onBack: () => void }) {
  const hasKey = settings.apiKeyStatus.elevenlabs;
  const [replacing, setReplacing] = useState(false);
  const skip = () => {
    window.flicky.setSpeakReplies(false);
    onNext();
  };
  return (
    <>
      <h1 className="ob-h1">Give me a voice<em>.</em></h1>
      <p className="ob-lead">
        Optional. With an ElevenLabs key I&apos;ll speak my answers out loud. Without one,
        replies show up as text in the panel and the stream window.
      </p>
      <div className="ob-card">
        {hasKey && !replacing ? (
          <SavedKey
            name="elevenlabs"
            label="ElevenLabs key"
            onReplace={() => setReplacing(true)}
            extra={
              <button className="btn xs" onClick={() => window.flicky.playVoicePreview(settings.voiceId)}>
                ▶ Preview voice
              </button>
            }
          />
        ) : (
          <>
            <div className="ob-card-title">ElevenLabs API key</div>
            <p className="ob-card-text">
              Get one from{' '}
              <button className="link" onClick={() => window.flicky.openExternal('https://elevenlabs.io/app/settings/api-keys')}>
                elevenlabs.io →
              </button>
            </p>
            <KeyEntry
              name="elevenlabs"
              placeholder="xi-..."
              onSaved={() => { window.flicky.setSpeakReplies(true); setReplacing(false); }}
              onCancel={hasKey ? () => setReplacing(false) : undefined}
            />
          </>
        )}
      </div>
      <Footer
        onBack={onBack}
        onNext={hasKey ? onNext : undefined}
        secondary={
          !hasKey && (
            <button className="btn" onClick={skip}>Skip — text only</button>
          )
        }
      />
    </>
  );
}

// ── 6. Shortcut ────────────────────────────────────────────────────────

function ShortcutStep({ settings, onNext, onBack }: { settings: FlickySettings; onNext: () => void; onBack: () => void }) {
  const [editing, setEditing] = useState(false);
  const [fired, setFired] = useState(false);
  const [flash, setFlash] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);
  const pendingRef = useRef<string | null>(null);
  const shortcut = settings.pushToTalkShortcut;

  // While on this step the accelerator only reports itself — it doesn't
  // open the mic — so the user can mash it freely.
  useEffect(() => {
    window.flicky.startPttTest();
    return () => window.flicky.stopPttTest();
  }, []);

  useEffect(() => {
    let flashTimer: ReturnType<typeof setTimeout> | null = null;
    const unsub = window.flicky.onPttShortcutFired(() => {
      setFired(true);
      setFlash(true);
      if (flashTimer) clearTimeout(flashTimer);
      flashTimer = setTimeout(() => setFlash(false), 180);
    });
    return () => { unsub(); if (flashTimer) clearTimeout(flashTimer); };
  }, []);

  // The main process rolls back to the previous binding if the OS
  // refuses the new one (usually because another app owns it). Detect
  // that by watching whether the setting actually changed.
  useEffect(() => {
    const wanted = pendingRef.current;
    if (!wanted) return;
    if (shortcut === wanted) {
      pendingRef.current = null;
      setBindError(null);
      setFired(false);
    }
  }, [shortcut]);

  const onSave = (accel: string) => {
    pendingRef.current = accel;
    setEditing(false);
    window.flicky.setPushToTalkShortcut(accel);
    // Settings echo back synchronously-ish; if they haven't changed
    // shortly after, the register call failed.
    setTimeout(() => {
      if (pendingRef.current === accel) {
        pendingRef.current = null;
        setBindError(`Couldn't bind ${accel} — another app probably owns it. Pick a different combo.`);
      }
    }, 600);
  };

  return (
    <>
      <h1 className="ob-h1">Test your shortcut<em>.</em></h1>
      <p className="ob-lead">
        This is the only thing you need to remember. Press it now — from this window or any
        other — and the badge should light up.
      </p>

      <div className={`ob-card ob-shortcut ${flash ? 'flash' : ''} ${fired ? 'fired' : ''}`}>
        {editing ? (
          <ShortcutCapture onSave={onSave} onCancel={() => setEditing(false)} />
        ) : (
          <>
            <div className="ob-shortcut-keys"><Keys shortcut={shortcut} /></div>
            <div className="ob-shortcut-state">
              {fired ? (
                <Status kind="ok">it works — I received the shortcut</Status>
              ) : (
                <Status kind="wait">waiting for you to press it…</Status>
              )}
            </div>
            <div className="actions" style={{ justifyContent: 'center' }}>
              <button className="btn xs subtle" onClick={() => setEditing(true)}>Change shortcut</button>
            </div>
          </>
        )}
        {bindError && <Status kind="err">{bindError}</Status>}
      </div>

      <div className="ob-card">
        <div className="ob-card-title">Trigger style</div>
        <p className="ob-card-text">
          {isMac
            ? 'On macOS the shortcut is tap-to-start, tap-again-to-send — Electron can’t observe key release there.'
            : 'Hold to talk and release to send (default), or tap once to start and again to send.'}
        </p>
        {!isMac && (
          <div className="seg" style={{ maxWidth: 280 }}>
            <button className={settings.pttMode === 'hold' ? 'on' : ''} onClick={() => window.flicky.setPttMode('hold')}>Hold</button>
            <button className={settings.pttMode === 'toggle' ? 'on' : ''} onClick={() => window.flicky.setPttMode('toggle')}>Toggle</button>
          </div>
        )}
      </div>

      <Footer
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!fired}
        nextHint={fired ? undefined : 'Press the shortcut once to continue.'}
      />
    </>
  );
}

// ── 7. Mic check ───────────────────────────────────────────────────────

const METER_BARS = 24;

function MicStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [heard, setHeard] = useState(false);
  const decayRef = useRef<number | null>(null);

  useEffect(() => {
    window.flicky.startMicTest();
    const unsubLevel = window.flicky.onMicLevel((l) => {
      setLevel(l);
      setPeak((p) => Math.max(p, l));
      // ~RMS 0.05: clearly above room noise, easily hit by normal speech.
      if (l > 0.2) setHeard(true);
      setError(null);
    });
    const unsubErr = window.flicky.onMicError((m) => setError(m));
    // Smooth fall-off so the meter doesn't stutter between reports.
    const decay = () => {
      setLevel((l) => (l > 0.01 ? l * 0.85 : 0));
      decayRef.current = requestAnimationFrame(decay);
    };
    decayRef.current = requestAnimationFrame(decay);
    return () => {
      window.flicky.stopMicTest();
      unsubLevel();
      unsubErr();
      if (decayRef.current) cancelAnimationFrame(decayRef.current);
    };
  }, []);

  const lit = Math.round(level * METER_BARS);

  return (
    <>
      <h1 className="ob-h1">Say something<em>.</em></h1>
      <p className="ob-lead">
        The mic is live. Talk at a normal volume and the bars should jump. This uses the same
        capture path as push-to-talk, so if it works here it works for real.
      </p>

      <div className="ob-card">
        <div className="ob-meter" aria-label="microphone level">
          {Array.from({ length: METER_BARS }).map((_, i) => (
            <span
              key={i}
              className={`ob-meter-bar ${i < lit ? 'lit' : ''} ${i > METER_BARS * 0.8 ? 'hot' : ''}`}
            />
          ))}
        </div>
        <div className="ob-meter-state">
          {error ? (
            <Status kind="err">{error}</Status>
          ) : heard ? (
            <Status kind="ok">I can hear you</Status>
          ) : peak > 0 ? (
            <Status kind="warn">receiving audio but it&apos;s very quiet — move closer or raise your input volume</Status>
          ) : (
            <Status kind="wait">listening… say &ldquo;hi Flicky&rdquo;</Status>
          )}
        </div>
        {error && isWin && (
          <div className="actions">
            <button className="btn xs" onClick={() => window.flicky.requestPermission('microphone')}>
              Open Windows microphone settings
            </button>
            <button className="btn xs subtle" onClick={() => { window.flicky.stopMicTest(); setTimeout(() => window.flicky.startMicTest(), 100); setError(null); }}>
              Retry
            </button>
          </div>
        )}
        {error && isMac && (
          <div className="actions">
            <button className="btn xs" onClick={() => window.flicky.requestPermission('microphone')}>
              Open System Settings
            </button>
          </div>
        )}
      </div>

      <Footer
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!heard}
        nextHint={heard ? undefined : 'Continue unlocks once the meter registers your voice.'}
        secondary={!heard && <button className="btn subtle" onClick={onNext}>Skip anyway</button>}
      />
    </>
  );
}

// ── 8. Try it ──────────────────────────────────────────────────────────

function TryStep({ settings, voiceState, onNext, onBack }: {
  settings: FlickySettings; voiceState: VoiceState; onNext: () => void; onBack: () => void;
}) {
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const unsubs = [
      window.flicky.onTranscriptUpdate((r) => { setTranscript(r.text); setError(null); }),
      window.flicky.onAiResponseChunk((c) => setReply((r) => r + c)),
      window.flicky.onAiResponseComplete((t) => { setReply(t); setCompleted(true); }),
      window.flicky.onAiError((m) => setError(m)),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // Reset the transcript/reply when a fresh turn begins.
  useEffect(() => {
    if (voiceState === 'listening') {
      setTranscript('');
      setReply('');
      setError(null);
    }
  }, [voiceState]);

  const verb = settings.pttMode === 'toggle' || isMac ? 'Tap' : 'Hold';
  const stateLabel = useMemo(() => {
    switch (voiceState) {
      case 'listening': return 'listening…';
      case 'processing': return 'thinking…';
      case 'responding': return 'speaking…';
      default: return completed ? 'done' : 'ready';
    }
  }, [voiceState, completed]);

  return (
    <>
      <h1 className="ob-h1">Ask me something<em>.</em></h1>
      <p className="ob-lead">
        A real turn, end to end. {verb} <Keys shortcut={settings.pushToTalkShortcut} /> and say
        something like <i>&ldquo;Hi Flicky, what am I looking at?&rdquo;</i>
        {verb === 'Hold' ? ' — then let go.' : ' — then tap again.'}
      </p>

      <div className="ob-card ob-try">
        <div className={`ob-try-state st-${voiceState}`}>
          <span className="dot" /> {stateLabel}
        </div>
        <div className="ob-try-row">
          <div className="ob-try-label">You said</div>
          <div className={`ob-try-text ${transcript ? '' : 'empty'}`}>{transcript || '—'}</div>
        </div>
        <div className="ob-try-row">
          <div className="ob-try-label">Flicky</div>
          <div className={`ob-try-text ${reply ? '' : 'empty'}`}>{reply || '—'}</div>
        </div>
        {error && <Status kind="err">{error}</Status>}
        {completed && !error && <Status kind="ok">that&apos;s the whole loop — you&apos;re set</Status>}
      </div>

      <Footer
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!completed}
        nextHint={completed ? undefined : 'Continue unlocks after one successful answer.'}
        secondary={!completed && <button className="btn subtle" onClick={onNext}>Skip</button>}
      />
    </>
  );
}

// ── 9. Done ────────────────────────────────────────────────────────────

function DoneStep({ settings, onBack }: { settings: FlickySettings; onBack: () => void }) {
  const mind = settings.mindProvider === 'openai' ? 'OpenAI' : settings.mindProvider === 'ollama' ? 'Local model' : 'Anthropic';
  return (
    <>
      <div className="ob-hero-icon"><CursorIcon size={64} /></div>
      <h1 className="ob-h1">You&apos;re all set<em>.</em></h1>
      <p className="ob-lead">
        Flicky lives in your system tray. Close this window and it keeps running; hold{' '}
        <Keys shortcut={settings.pushToTalkShortcut} /> from anywhere.
      </p>
      <ul className="ob-bullets">
        <li><b>Mind:</b> {mind}</li>
        <li><b>Ear:</b> Groq Whisper</li>
        <li><b>Voice:</b> {settings.speakReplies && settings.apiKeyStatus.elevenlabs ? 'ElevenLabs' : 'text only'}</li>
        <li><b>Shortcut:</b> <Keys shortcut={settings.pushToTalkShortcut} /> ({settings.pttMode === 'toggle' || isMac ? 'tap to toggle' : 'hold to talk'})</li>
      </ul>
      <p className="ob-fine">
        Everything here can be changed later from the panel, and you can rerun this setup
        from General → &ldquo;Run setup again&rdquo;.
      </p>
      <Footer onBack={onBack} onNext={() => window.flicky.completeOnboarding()} nextLabel="Start using Flicky →" />
    </>
  );
}
