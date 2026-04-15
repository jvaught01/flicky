interface MarkProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The Flicky triangle, as an inline SVG. Uses a shared gradient id
 * because the landing page only renders it a handful of times and
 * collision isn't a concern.
 */
export function Mark({ className, style }: MarkProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fl-brand" x1="10%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <polygon
        points="4,4 34,14 14,32"
        fill="url(#fl-brand)"
        stroke="url(#fl-brand)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
