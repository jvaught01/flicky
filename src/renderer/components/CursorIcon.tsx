import { useId } from 'react';

interface CursorIconProps {
  size?: number;
  className?: string;
}

/**
 * The Flicky companion cursor, as a standalone icon.
 * Unique gradient id per instance so multiple instances don't collide.
 */
export function CursorIcon({ size = 40, className }: CursorIconProps) {
  const raw = useId();
  const gradId = `fl-cursor-${raw.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradId} x1="10%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      <polygon
        points="4,4 34,14 14,32"
        fill={`url(#${gradId})`}
        stroke={`url(#${gradId})`}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <polyline
        points="4,4 34,14"
        fill="none"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <polyline
        points="4,4 14,32"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
