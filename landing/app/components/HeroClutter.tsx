import { Mark } from './Mark';
import { RecycleIcon, ImageFileIcon, JsonFileIcon } from './Icons';

/**
 * The stuff lying around on the desktop behind the wordmark: a sticky
 * note, a toast, a mini replica of the Flicky overlay, a tiny window,
 * some kaomoji and a couple of files. Each drifts a little with the
 * mouse (see Parallax) and is hidden on narrow screens.
 */
export function HeroClutter() {
  return (
    <div className="clutter" aria-hidden="true">
      {/* --- left --- */}
      <div className="cl cl-note">
        <div className="note">
          <div className="note-bar" />
          <div className="note-body">
            hold ctrl+alt+x
            <br />
            and just talk
          </div>
        </div>
      </div>

      <div className="cl cl-kao1 kao">( ^ ω ^ )</div>

      <div className="cl cl-overlay">
        <div className="mini-overlay">
          <span className="mini-halo" />
          <Mark className="mini-mark" />
          <span className="mini-bubble">right here!</span>
        </div>
      </div>

      <div className="cl cl-bin">
        <span className="desk-art"><RecycleIcon /></span>
        <span className="desk-label">recycle bin</span>
      </div>

      <div className="cl cl-file1">
        <span className="desk-art"><ImageFileIcon /></span>
        <span className="desk-label">screenshot.png</span>
      </div>

      {/* --- right --- */}
      <div className="cl cl-toast">
        <div className="toast">
          <Mark className="toast-mark" />
          <div className="toast-txt">
            <strong>Flicky</strong>
            <span>Copied — press Ctrl+V to paste</span>
          </div>
          <span className="toast-time">now</span>
        </div>
      </div>

      <div className="cl cl-walk">
        <div className="mini-win">
          <div className="mini-bar">
            <span>walkthrough</span>
            <span className="mini-x">✕</span>
          </div>
          <div className="mini-body">
            <span className="mini-btn">Continue</span>
            <span className="mini-badge">2/3 · click Continue</span>
          </div>
        </div>
      </div>

      <div className="cl cl-kao2 kao">{'¯\_(ツ)_/¯'}</div>
      <div className="cl cl-kao3 kao">{'{ ^-^ }'}</div>

      <div className="cl cl-file2">
        <span className="desk-art"><JsonFileIcon /></span>
        <span className="desk-label">chat-history.json</span>
      </div>
    </div>
  );
}
