import { Mark } from './Mark';
import { FolderIcon, InstallerIcon, TextFileIcon, ZipIcon } from './Icons';

const REPO = 'https://github.com/pango07/flicky';

/**
 * The desktop icon column, top-left, exactly where Windows puts them.
 * Doubles as the section nav on wide screens; hidden under 1100px
 * because the taskbar is enough there.
 */
export function DesktopIcons() {
  return (
    <div className="desk-icons" aria-hidden="false">
      <a className="desk-icon" href="#top">
        <span className="desk-art"><Mark className="desk-mark" /></span>
        <span className="desk-label">flicky.exe</span>
      </a>
      <a className="desk-icon" href="#how">
        <span className="desk-art"><FolderIcon /></span>
        <span className="desk-label">how it works</span>
      </a>
      <a className="desk-icon" href="#features">
        <span className="desk-art"><FolderIcon /></span>
        <span className="desk-label">features</span>
      </a>
      <a className="desk-icon" href="#get">
        <span className="desk-art"><InstallerIcon /></span>
        <span className="desk-label">get flicky</span>
      </a>
      <a className="desk-icon" href="#faq">
        <span className="desk-art"><TextFileIcon /></span>
        <span className="desk-label">questions</span>
      </a>
      <a className="desk-icon" href={REPO} target="_blank" rel="noopener noreferrer">
        <span className="desk-art"><ZipIcon /></span>
        <span className="desk-label">source.zip</span>
      </a>
    </div>
  );
}
