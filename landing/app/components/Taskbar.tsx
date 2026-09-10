'use client';

import { Mark } from './Mark';
import { Clock } from './Clock';
import { ThemeToggle } from './ThemeToggle';
import { WinLogo, GitHubGlyph, DownloadGlyph, WifiGlyph, SpeakerGlyph } from './Icons';

const REPO = 'https://github.com/pango07/flicky';
const RELEASES = `${REPO}/releases/latest`;

/**
 * The page nav, disguised as a Windows 11 taskbar pinned to the bottom
 * of the viewport. Centre cluster = launcher icons, right cluster = the
 * system tray (theme toggle, fake wifi/volume, live clock).
 */
export function Taskbar() {
  return (
    <div className="taskbar" role="navigation" aria-label="Main">
      <div className="tb-center">
        <a className="tb-btn" href="#top" title="start">
          <WinLogo className="tb-glyph" />
        </a>
        <a className="tb-btn running" href="#top" title="flicky.exe — running">
          <Mark className="tb-mark" />
        </a>
        <a
          className="tb-btn"
          href={REPO}
          target="_blank"
          rel="noopener noreferrer"
          title="source on github"
        >
          <GitHubGlyph className="tb-glyph" />
        </a>
        <a
          className="tb-btn"
          href={RELEASES}
          target="_blank"
          rel="noopener noreferrer"
          title="releases"
        >
          <DownloadGlyph className="tb-glyph" />
        </a>
      </div>

      <div className="tb-tray">
        <ThemeToggle />
        <span className="tb-tray-glyph" title="connected (probably)" aria-hidden="true">
          <WifiGlyph />
        </span>
        <span className="tb-tray-glyph" title="volume" aria-hidden="true">
          <SpeakerGlyph />
        </span>
        <Clock />
      </div>
    </div>
  );
}
