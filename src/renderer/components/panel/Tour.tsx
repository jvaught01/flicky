interface TourProps {
  shortcut: string;
  onNavigate: (tab: 'chats' | 'mind' | 'voice' | 'ear' | 'general') => void;
}

export function Tour({ shortcut, onNavigate }: TourProps) {
  const keys = shortcut.split('+').filter(Boolean);

  return (
    <section className="tour">
      <header className="tour-head">
        <div>
          <h2 className="tour-heading">How Flicky works</h2>
          <p className="tour-sub">Four things to know. Takes about thirty seconds.</p>
        </div>
      </header>

      <ol className="tour-steps">
        <li className="tour-step">
          <div className="tour-num">01</div>
          <div className="tour-body">
            <h3>Hold the shortcut, ask anything.</h3>
            <p>
              Hold{' '}
              {keys.map((k, i) => (
                <span key={`${k}-${i}`}>
                  <kbd>{k}</kbd>
                  {i < keys.length - 1 && <span className="plus">+</span>}
                </span>
              ))}{' '}
              from anywhere and speak. Release when you're done — Flicky takes it from there.
            </p>
          </div>
        </li>

        <li className="tour-step">
          <div className="tour-num">02</div>
          <div className="tour-body">
            <h3>Flicky sees your screen.</h3>
            <p>
              Ask about what's in front of you — "what does this error mean," "where's the
              checkout button," "summarize this article." A screenshot is captured with every
              turn so Flicky can reference specific things on-screen.
            </p>
          </div>
        </li>

        <li className="tour-step">
          <div className="tour-num">03</div>
          <div className="tour-body">
            <h3>The blue cursor points things out.</h3>
            <p>
              When Flicky wants to show you where something is, a small blue pointer flies to
              that exact spot on the screen and hovers there while the answer plays.
            </p>
          </div>
        </li>

        <li className="tour-step">
          <div className="tour-num">04</div>
          <div className="tour-body">
            <h3>Everything stays local.</h3>
            <p>
              Chats, keys, and settings are stored on your machine — never uploaded to our
              servers.{' '}
              <button className="link" onClick={() => onNavigate('chats')}>
                Open Chats →
              </button>
            </p>
          </div>
        </li>
      </ol>
    </section>
  );
}
