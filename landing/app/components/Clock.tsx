'use client';

import { useEffect, useState } from 'react';

/**
 * Taskbar tray clock. Renders placeholder dashes until mounted so the
 * static export and the first client render agree.
 */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const date = now
    ? now.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })
    : '--/--/----';

  return (
    <div className="tb-clock" title="it is, in fact, right now">
      <span>{time}</span>
      <span>{date}</span>
    </div>
  );
}
