import { Mark } from './Mark';
import { SpeakerGlyph } from './Icons';

const BARS = Array.from({ length: 14 }, (_, i) => i);

/** 01 — hold to talk: a live waveform and the hotkey. */
export function MockListen() {
  return (
    <div className="mock mock-listen">
      <div className="wave">
        {BARS.map((i) => (
          <i key={i} style={{ animationDelay: `${(i % 7) * 0.11}s` }} />
        ))}
      </div>
      <div className="kbd-row">
        <kbd>Ctrl</kbd>
        <span>+</span>
        <kbd>Alt</kbd>
        <span>+</span>
        <kbd>X</kbd>
        <span className="mock-note">listening…</span>
      </div>
    </div>
  );
}

/** 02 — a screenshot goes with every question. */
export function MockSee() {
  return (
    <div className="mock mock-see">
      <div className="fake-browser">
        <div className="fake-url"><span /></div>
        <div className="skel">
          <i style={{ width: '78%' }} />
          <i style={{ width: '92%' }} />
          <i style={{ width: '60%' }} />
          <i style={{ width: '84%' }} />
          <i style={{ width: '44%' }} />
        </div>
      </div>
      <div className="shot-toast">
        <span className="shot-dot" />
        screenshot captured
      </div>
    </div>
  );
}

/** 03 — the floating stream window mirrors the live Q&A. */
export function MockSpeak() {
  return (
    <div className="mock mock-speak">
      <div className="stream">
        <div className="stream-head">
          <SpeakerGlyph />
          <span>stream</span>
        </div>
        <p className="stream-you"><b>you:</b> what am i looking at?</p>
        <p className="stream-fl">
          <b>flicky:</b> that&apos;s the vercel deploy log — the red line is a missing env var.
        </p>
      </div>
    </div>
  );
}

/** 04 — the cursor parks on the thing you should click. */
export function MockPoint() {
  return (
    <div className="mock mock-point">
      <div className="dialog">
        <div className="dialog-title">Settings</div>
        <div className="dialog-row">
          <span className="dlg-btn">Cancel</span>
          <span className="dlg-btn primary">Save</span>
          <span className="dlg-btn">Apply</span>
        </div>
      </div>
      <div className="mini-overlay pinned">
        <span className="mini-halo" />
        <Mark className="mini-mark" />
        <span className="mini-bubble">1/2 · click Save</span>
      </div>
    </div>
  );
}
