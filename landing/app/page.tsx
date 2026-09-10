import { Mark } from './components/Mark';
import { HeroVideo } from './components/HeroVideo';
import { Win } from './components/Win';
import { Taskbar } from './components/Taskbar';
import { DesktopIcons } from './components/DesktopIcons';
import { HeroClutter } from './components/HeroClutter';
import { Parallax } from './components/Parallax';
import { PointAt } from './components/PointAt';
import { MockListen, MockSee, MockSpeak, MockPoint } from './components/Mockups';
import {
  WinLogo,
  AppleGlyph,
  TextFileIcon,
  FolderIcon,
  InstallerIcon,
  ZipIcon,
} from './components/Icons';

const REPO = 'https://github.com/pango07/flicky';
const RELEASES = `${REPO}/releases/latest`;
const CLICKY = 'https://www.clicky.so/';
const FARZA = 'https://github.com/farzaa';
const JULIO = 'https://github.com/jvaught01';

const STEPS = [
  {
    n: '01',
    t: 'hear you.',
    d: 'hold to talk, or tap to toggle. groq whisper turns what you said into text before you finish letting go.',
    mock: <MockListen />,
  },
  {
    n: '02',
    t: 'see your screen.',
    d: 'a screenshot goes with every question — claude, gpt, or a local model reads it, so you never describe anything twice.',
    mock: <MockSee />,
  },
  {
    n: '03',
    t: 'speak back.',
    d: 'elevenlabs voice, or text-only if you would rather read. the stream window mirrors every word.',
    mock: <MockSpeak />,
  },
  {
    n: '04',
    t: 'point at things.',
    d: 'multi-step answers become numbered walkthroughs, and the blue cursor flies to the exact pixel each time.',
    mock: <MockPoint />,
  },
] as const;

const FEATURES = [
  {
    n: '01',
    file: 'local.txt',
    t: 'local by default',
    d: 'chats and keys are encrypted on your own machine. nothing lives on our servers, because there aren’t any.',
  },
  {
    n: '02',
    file: 'brain.exe',
    t: 'your choice of brain',
    d: 'claude sonnet or opus 4.6, the gpt-5 family, or any local / openai-compatible endpoint — ollama, lm studio, whatever you run.',
  },
  {
    n: '03',
    file: 'memory.log',
    t: 'never runs out of context',
    d: 'long conversations auto-compact into a summary, so a single chat can just keep going all day.',
  },
  {
    n: '04',
    file: 'typing.dll',
    t: 'types for you',
    d: 'opt in and flicky types straight into the focused field — otherwise the answer lands on your clipboard.',
  },
  {
    n: '05',
    file: 'stream.exe',
    t: 'stream window',
    d: 'a floating transparent panel mirrors the live q&a. scroll it, select it, copy straight out of it.',
  },
  {
    n: '06',
    file: 'setup.exe',
    t: 'guided setup',
    d: 'a three-minute wizard tests each key, your shortcut and your mic before it lets you finish.',
  },
] as const;

const DOWNLOADS = [
  {
    file: 'Flicky-Setup-1.2.1.exe',
    os: 'windows',
    detail: 'x64 + arm64 · one installer',
    icon: <InstallerIcon />,
    id: 'dl-windows',
  },
  {
    file: 'Flicky-1.2.1.dmg',
    os: 'mac',
    detail: 'apple silicon or intel',
    icon: <FolderIcon />,
    id: 'dl-mac',
  },
  {
    file: 'Flicky-1.2.1.AppImage',
    os: 'linux',
    detail: 'also .deb',
    icon: <ZipIcon />,
    id: 'dl-linux',
  },
] as const;

const MARQUEE = [
  'works on windows',
  'works on mac',
  'works on linux',
  'local by default',
  'bring your own keys',
  'mit licensed',
];

function MarqueeRun({ k }: { k: string }) {
  return (
    <span className="marq-run">
      {MARQUEE.map((m) => (
        <span key={`${k}-${m}`}>
          {m}
          <i>✦</i>
        </span>
      ))}
    </span>
  );
}

export default function Page() {
  return (
    <>
      <DesktopIcons />
      <main>
        {/* ---------------------------------------------------------- hero */}
        <section className="hero" id="top">
          <div className="stage">
            <Parallax />
            <HeroClutter />

            <div className="hero-copy">
              <p className="eyebrow">windows · mac · linux</p>
              <h1 className="wordmark">flicky</h1>
              <p className="lead">an ai buddy that lives on your desktop.</p>
              <div className="cta">
                <a
                  className="btn primary"
                  id="cta-win"
                  href={RELEASES}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WinLogo className="btn-glyph" />
                  download for windows
                </a>
                <a
                  className="btn ghost"
                  href={RELEASES}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AppleGlyph className="btn-glyph" />
                  download for mac
                </a>
                <a
                  className="btn text"
                  href={RELEASES}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  linux (.AppImage / .deb)
                </a>
              </div>
              <p className="tiny">100% free · open source · bring your own keys</p>
            </div>

            <PointAt target="#cta-win" label="click here!" delay={1200} />
          </div>

          <div className="hero-video">
            <HeroVideo />
          </div>
        </section>

        {/* --------------------------------------------------------- dream */}
        <section className="section dream">
          <span className="kao float-kao a">( ˶ˆ ᗜ ˆ˵ )</span>
          <span className="kao float-kao b">(•_•)</span>
          <Win title="readme.txt" icon={<TextFileIcon />} width="620px" className="notepad center">
            <p>
              the models got really good, and we&apos;re all still typing at them in a chat box
              in a browser tab. that felt backwards.
            </p>
            <p>
              so we put one on your screen instead. it looks at what you&apos;re doing, talks
              back out loud, and points at the thing it&apos;s talking about — no pasting
              screenshots, no describing where the button is.
            </p>
            <p>
              flicky is a from-scratch, cross-platform take on{' '}
              <a href={FARZA} target="_blank" rel="noopener noreferrer">farza</a>&apos;s{' '}
              <a href={CLICKY} target="_blank" rel="noopener noreferrer">clicky</a>, built by{' '}
              <a href={JULIO} target="_blank" rel="noopener noreferrer">julio</a> so the rest of
              us get one too.
            </p>
          </Win>
        </section>

        {/* -------------------------------------------------- how it works */}
        <section className="section how" id="how">
          <h2 className="sec-head">how it works</h2>
          <div className="rows">
            {STEPS.map((s, i) => (
              <div className={`row${i % 2 ? ' flip' : ''}`} key={s.n}>
                <div className="row-win">
                  <Win title={`step-${s.n}`} icon={<Mark />}>
                    {s.mock}
                  </Win>
                </div>
                <div className="row-say">
                  <span className="chip">
                    <Mark className="chip-mark" />
                    flicky
                  </span>
                  <div className="bubble">
                    <h3>
                      <span className="row-n">{s.n}</span> {s.t}
                    </h3>
                    <p>{s.d}</p>
                  </div>
                </div>
                {s.n === '04' ? (
                  <PointAt target=".dialog-title" label="this one!" side="left" />
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------ marquee */}
        <div className="marq" aria-hidden="true">
          <div className="marq-track">
            <MarqueeRun k="a" />
            <MarqueeRun k="b" />
          </div>
        </div>

        {/* ------------------------------------------------------ features */}
        <section className="section" id="features">
          <h2 className="sec-head">what you get</h2>
          <div className="feat-grid">
            {FEATURES.map((f) => (
              <Win key={f.file} title={f.file} icon={<TextFileIcon />} className="feat">
                <span className="feat-n">{f.n}</span>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </Win>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------- get flicky */}
        <section className="section" id="get">
          <div className="getcard">
            <span className="free-tag">free</span>
            <h2>get flicky.</h2>
            <p className="get-sub">
              100% free. every tagged release is built and published on github.
            </p>
            <div className="dl-grid">
              {DOWNLOADS.map((d) => (
                <Win key={d.file} title={d.file} icon={d.icon} className="dl-win">
                  <div className="dl-os">{d.os}</div>
                  <div className="dl-detail">{d.detail}</div>
                  <a
                    className="btn primary sm"
                    id={d.id}
                    href={RELEASES}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    download
                  </a>
                </Win>
              ))}
            </div>
            <p className="get-keys">
              you&apos;ll need keys for anthropic or openai (or none, with a local model), groq
              for speech-to-text, and optionally elevenlabs for a voice. add them in the app —
              they never leave your machine.
            </p>
            <PointAt target="#dl-windows" label="over here!" />
          </div>
        </section>

        {/* ----------------------------------------------------- questions */}
        <section className="section" id="faq">
          <h2 className="sec-head">questions</h2>
          <Win title="questions.txt" icon={<TextFileIcon />} width="760px" className="faq center">
            <details>
              <summary>is it private?</summary>
              <p>
                yes. everything runs locally — your chats stay on your machine and your api keys
                are encrypted at rest. there is no flicky backend for anything to be sent to. the
                only network calls are the ones you configure, straight to the providers you
                picked.
              </p>
            </details>
            <details>
              <summary>what does it cost?</summary>
              <p>
                nothing. flicky is free and mit licensed. you pay your model and voice providers
                directly for what you use — and if you run a local model through ollama or lm
                studio, that part costs nothing at all.
              </p>
            </details>
            <details>
              <summary>does it work on windows?</summary>
              <p>
                yes — that&apos;s the whole point of this project. hold-to-talk, the tray
                behaviour, the mic permission flow and the setup wizard were all built and tested
                on windows, not bolted on afterwards. linux works too.
              </p>
            </details>
            <details>
              <summary>how is this different from clicky?</summary>
              <p>
                <a href={CLICKY} target="_blank" rel="noopener noreferrer">clicky</a> is{' '}
                <a href={FARZA} target="_blank" rel="noopener noreferrer">farza</a>&apos;s
                original macos app and the whole inspiration — he invented this interaction.
                flicky is an independent electron rebuild so windows and linux folks can have it
                too. if you&apos;re on a mac, go use{' '}
                <a href={`${FARZA}/clicky`} target="_blank" rel="noopener noreferrer">clicky</a>.
              </p>
            </details>
            <details>
              <summary>do i need an account?</summary>
              <p>
                no — no sign-up, no server, no telemetry by default. download it, add your own
                keys, done.
              </p>
            </details>
          </Win>
        </section>

        {/* -------------------------------------------------------- credit */}
        <section className="section">
          <Win title="★ credit.md" icon={<TextFileIcon />} width="720px" className="credit center">
            <p className="credit-label">credit where it&apos;s due</p>
            <p>
              Flicky is an independent, cross-platform reimagining of{' '}
              <a href={CLICKY} target="_blank" rel="noopener noreferrer">Clicky</a>{' '}
              by{' '}
              <a href={FARZA} target="_blank" rel="noopener noreferrer">Farza</a>{' '}
              — the original macOS app that invented the hold-a-hotkey, get-a-pointing-cursor
              interaction. Every bit of that vibe is his. Flicky rebuilds the same idea in
              Electron so people on Windows and Linux can try it too.
            </p>
            <p>
              If you liked Flicky, also go star{' '}
              <a href={`${FARZA}/clicky`} target="_blank" rel="noopener noreferrer">
                farzaa/clicky
              </a>.
            </p>
          </Win>
        </section>

        {/* -------------------------------------------------------- footer */}
        <footer>
          <div className="foot-links">
            <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href={`${REPO}/releases`} target="_blank" rel="noopener noreferrer">Releases</a>
            <a href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer">Issues</a>
          </div>
          <div className="foot-note">
            made by{' '}
            <a href={JULIO} target="_blank" rel="noopener noreferrer">Julio</a>
            {' · '}inspired by{' '}
            <a href={FARZA} target="_blank" rel="noopener noreferrer">Farza</a>
            &apos;s clicky · mit licensed
          </div>
          <div className="kao" aria-hidden="true">( ˶ˆ ᗜ ˆ˵ )</div>
        </footer>
      </main>
      <Taskbar />
    </>
  );
}
