import type { ReactNode } from 'react';

interface WinProps {
  title: string;
  icon?: ReactNode;
  /** Any max-width CSS value, e.g. "620px". */
  width?: string;
  className?: string;
  /** Removes the body padding — for video / edge-to-edge content. */
  flush?: boolean;
  children: ReactNode;
}

/**
 * A Windows 11 style window frame. Title bar carries a small icon and
 * the title on the left, and minimise / maximise / close glyphs on the
 * right (the close one turns red on hover, like the real thing).
 * Purely decorative — the controls are spans, not buttons.
 */
export function Win({ title, icon, width, className, flush, children }: WinProps) {
  return (
    <div
      className={`win${className ? ` ${className}` : ''}`}
      style={width ? { maxWidth: width } : undefined}
    >
      <div className="win-bar">
        {icon ? <span className="win-ico" aria-hidden="true">{icon}</span> : null}
        <span className="win-title">{title}</span>
        <span className="win-ctrls" aria-hidden="true">
          <span className="win-ctrl">
            <svg viewBox="0 0 10 10"><path d="M0 5h10" /></svg>
          </span>
          <span className="win-ctrl">
            <svg viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" /></svg>
          </span>
          <span className="win-ctrl close">
            <svg viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" /></svg>
          </span>
        </span>
      </div>
      <div className={`win-body${flush ? ' flush' : ''}`}>{children}</div>
    </div>
  );
}
