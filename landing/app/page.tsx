import { Mark } from './components/Mark';

const REPO = 'https://github.com/jvaught01/flicky';
const RELEASES = `${REPO}/releases/latest`;

const STEPS = [
  {
    n: '01',
    t: 'Hear you.',
    d: 'Hold a push-to-talk hotkey from anywhere in your OS. Groq Whisper transcribes in real time.',
  },
  {
    n: '02',
    t: "Think about what's on your screen.",
    d: "A screenshot is captured every turn. Claude or GPT reasons about what you're looking at.",
  },
  {
    n: '03',
    t: 'Speak back.',
    d: 'ElevenLabs TTS — your pick of voice, stability, and speed. Ambient, not robotic.',
  },
  {
    n: '04',
    t: 'Point at things.',
    d: 'When Flicky mentions something on screen, a blue pointer flies to the exact spot.',
  },
] as const;

const DOWNLOADS = [
  { os: 'macOS',   sub: 'Universal · Apple silicon + Intel', ext: '.dmg' },
  { os: 'Windows', sub: 'x64 · installer',                   ext: '.exe' },
  { os: 'Linux',   sub: 'AppImage or .deb',                  ext: '' },
] as const;

export default function Page() {
  return (
    <main>
      <header className="top">
        <a className="brand" href="#top">
          <Mark className="brand-mark" />
          <span>Flicky</span>
        </a>
        <nav>
          <a href="#what">what it does</a>
          <a href="#get">get it</a>
          <a href={REPO} target="_blank" rel="noopener noreferrer">source</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Voice AI for your desktop</p>
          <h1>
            Flicky sees your screen.
            <br />
            <span className="accent">And talks back.</span>
          </h1>
          <p className="lead">
            Hold a hotkey. Ask anything about what&apos;s on your screen.
            Flicky answers out loud — and points.
          </p>
          <div className="cta">
            <a className="btn primary" href="#get">Download</a>
            <a className="btn ghost" href={REPO} target="_blank" rel="noopener noreferrer">
              View on GitHub <span className="arr">↗</span>
            </a>
          </div>
          <p className="tiny">Free · MIT licensed · bring your own API keys</p>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ezgif-4d0919e059322ece.gif" alt="Flicky demo" />
          </div>
        </div>
      </section>

      <section className="what" id="what">
        <h2>What it actually does.</h2>
        <div className="what-grid">
          {STEPS.map((s) => (
            <article key={s.n}>
              <div className="step">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rail">
        <div className="rail-col">
          <h3>Local by default.</h3>
          <p>
            Every chat is stored on your machine. Keys are encrypted at rest. Nothing
            lives on our servers — because there aren&apos;t any.
          </p>
        </div>
        <div className="rail-col">
          <h3>Your choice of brain.</h3>
          <p>
            Flip between <span className="mono">Claude Sonnet / Opus 4.6</span> and{' '}
            <span className="mono">GPT-5 / GPT-5 mini / GPT-4o</span> any time. Reasoning
            depth is a slider.
          </p>
        </div>
        <div className="rail-col">
          <h3>Won&apos;t run out of context.</h3>
          <p>
            As conversations get long, Flicky auto-compacts older messages into a summary.
            A single chat can run forever.
          </p>
        </div>
      </section>

      <section className="get" id="get">
        <h2>Get Flicky.</h2>
        <p className="get-lead">
          Downloads are built and signed from every tagged release on GitHub. Pick your
          platform.
        </p>

        <div className="downloads">
          {DOWNLOADS.map((d) => (
            <a key={d.os} className="dl" href={RELEASES} target="_blank" rel="noopener noreferrer">
              <div className="os">{d.os}</div>
              <div className="sub">{d.sub}</div>
              <div className="arr-lg">↓ {d.ext || 'latest'}</div>
            </a>
          ))}
        </div>

        <p className="keys">
          You&apos;ll need your own API keys for the providers you want to use —{' '}
          <span className="mono">Anthropic</span> or <span className="mono">OpenAI</span>,{' '}
          <span className="mono">ElevenLabs</span>, and <span className="mono">Groq</span>.
          Add them in the app. They never leave your machine.
        </p>
      </section>

      <section className="credit">
        <div className="credit-inner">
          <p className="credit-label">Credit where it&apos;s due.</p>
          <p>
            Flicky is an independent, cross-platform reimagining of{' '}
            <a href="https://www.clicky.so/" target="_blank" rel="noopener noreferrer">Clicky</a>{' '}
            by{' '}
            <a href="https://github.com/farzaa" target="_blank" rel="noopener noreferrer">Farza</a>{' '}
            — the original macOS app that invented the hold-a-hotkey, get-a-pointing-cursor
            interaction. Every bit of that vibe is his. Flicky rebuilds the same idea in
            Electron so people on Windows and Linux can try it too.
          </p>
          <p>
            If you liked Flicky, also go star{' '}
            <a href="https://github.com/farzaa/clicky" target="_blank" rel="noopener noreferrer">
              farzaa/clicky
            </a>.
          </p>
        </div>
      </section>

      <footer>
        <div className="foot-brand">
          <Mark className="brand-mark sm" />
          <span>Flicky</span>
        </div>
        <div className="foot-links">
          <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={`${REPO}/releases`} target="_blank" rel="noopener noreferrer">Releases</a>
          <a href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer">Issues</a>
        </div>
        <div className="foot-note">
          Made by{' '}
          <a href="https://github.com/jvaught01" target="_blank" rel="noopener noreferrer">
            Julio
          </a>
          . Inspired by{' '}
          <a href="https://github.com/farzaa" target="_blank" rel="noopener noreferrer">
            Farza
          </a>
          .
        </div>
      </footer>
    </main>
  );
}
