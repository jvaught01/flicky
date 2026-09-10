/* Small inline SVG glyph set for the Windows-desktop landing page.
   Everything is currentColor so the taskbar / window chrome can tint
   them from CSS variables. */

type P = { className?: string };

export function WinLogo({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="1" y="1" width="8" height="8" rx="1.4" fill="currentColor" />
      <rect x="11" y="1" width="8" height="8" rx="1.4" fill="currentColor" />
      <rect x="1" y="11" width="8" height="8" rx="1.4" fill="currentColor" />
      <rect x="11" y="11" width="8" height="8" rx="1.4" fill="currentColor" />
    </svg>
  );
}

export function AppleGlyph({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.4zM14.2 5.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z" />
    </svg>
  );
}

export function GitHubGlyph({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 1.8a10.2 10.2 0 0 0-3.2 19.9c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.2 10.2 0 0 0 12 1.8z" />
    </svg>
  );
}

export function DownloadGlyph({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </svg>
  );
}

export function WifiGlyph({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2.6 8.9a14.5 14.5 0 0 1 18.8 0" />
      <path d="M5.8 12.4a9.7 9.7 0 0 1 12.4 0" />
      <path d="M9 15.9a5 5 0 0 1 6 0" />
      <circle cx="12" cy="19.2" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SpeakerGlyph({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.3h3.2L12 5.4v13.2l-4.8-3.9H4z" />
      <path d="M15.6 9.6a3.6 3.6 0 0 1 0 4.8" />
      <path d="M18.1 7a7.2 7.2 0 0 1 0 10" />
    </svg>
  );
}

export function FolderIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M4 12.5A2.5 2.5 0 0 1 6.5 10h11l4 4.5H41.5A2.5 2.5 0 0 1 44 17v20a2.5 2.5 0 0 1-2.5 2.5h-35A2.5 2.5 0 0 1 4 37z" fill="#e8b23a" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16h35A2.5 2.5 0 0 1 44 18.5V37a2.5 2.5 0 0 1-2.5 2.5h-35A2.5 2.5 0 0 1 4 37z" fill="#ffd166" />
    </svg>
  );
}

export function TextFileIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 5h19l9 9v29a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="#fff" stroke="#b9c0cc" strokeWidth="1.4" />
      <path d="M29 5l9 9h-9z" fill="#dbe2ec" />
      <g stroke="#7f8a9c" strokeWidth="1.6" strokeLinecap="round">
        <path d="M14 21h20M14 26h20M14 31h14" />
      </g>
    </svg>
  );
}

export function ZipIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 5h19l9 9v29a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="#eef1f6" stroke="#b9c0cc" strokeWidth="1.4" />
      <path d="M29 5l9 9h-9z" fill="#d3dae6" />
      <rect x="20" y="5" width="8" height="4" fill="#8fa3bf" />
      <rect x="20" y="9" width="8" height="4" fill="#c7d2e2" />
      <rect x="20" y="13" width="8" height="4" fill="#8fa3bf" />
      <rect x="19" y="18" width="10" height="12" rx="1.6" fill="#5b7ba8" />
      <rect x="22.5" y="22" width="3" height="5" rx="1" fill="#eef1f6" />
    </svg>
  );
}

export function InstallerIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="6" y="8" width="36" height="32" rx="3" fill="#2f6fe4" />
      <rect x="6" y="8" width="36" height="8" rx="3" fill="#1f55bd" />
      <path d="M24 20v10M19 26l5 5 5-5" fill="none" stroke="#fff" strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 35h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function RecycleIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M12 14h24l-2.2 26.2a2 2 0 0 1-2 1.8H16.2a2 2 0 0 1-2-1.8z" fill="#c9d6e6" opacity=".75" />
      <path d="M12 14h24l-2.2 26.2a2 2 0 0 1-2 1.8H16.2a2 2 0 0 1-2-1.8z" fill="none" stroke="#7b8ba3" strokeWidth="1.6" />
      <g stroke="#7b8ba3" strokeWidth="1.6" strokeLinecap="round">
        <path d="M19 20.5v15M24 20.5v15M29 20.5v15" />
      </g>
      <rect x="9" y="9.5" width="30" height="4.6" rx="2.3" fill="#93a3ba" />
      <path d="M19.5 9.5V7.4a1.6 1.6 0 0 1 1.6-1.6h5.8a1.6 1.6 0 0 1 1.6 1.6v2.1" fill="none" stroke="#93a3ba" strokeWidth="2" />
    </svg>
  );
}

export function ImageFileIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 5h19l9 9v29a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="#fff" stroke="#b9c0cc" strokeWidth="1.4" />
      <path d="M29 5l9 9h-9z" fill="#dbe2ec" />
      <rect x="13" y="20" width="22" height="15" rx="1.6" fill="#cfe6ff" />
      <circle cx="19" cy="25" r="2.2" fill="#f5c451" />
      <path d="m14 33 6-6 4.5 4.5L28 28l6 5z" fill="#5aa469" />
    </svg>
  );
}

export function JsonFileIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 5h19l9 9v29a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="#fff" stroke="#b9c0cc" strokeWidth="1.4" />
      <path d="M29 5l9 9h-9z" fill="#dbe2ec" />
      <text x="24" y="34" textAnchor="middle" fontSize="13" fontFamily="monospace" fill="#5b7ba8">{'{}'}</text>
    </svg>
  );
}
