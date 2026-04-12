import { useEffect, useState } from 'react';

interface ShortcutCaptureProps {
  onSave: (accelerator: string) => void;
  onCancel: () => void;
}

const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'OS', 'ContextMenu']);

/** Normalize a KeyboardEvent.key value into Electron's accelerator key syntax. */
function normalizeKey(key: string): string | null {
  if (MODIFIER_KEYS.has(key)) return null;
  if (key === ' ') return 'Space';
  if (key === 'Escape') return null;
  if (key === 'Enter' || key === 'Return') return 'Return';
  if (key === 'ArrowUp') return 'Up';
  if (key === 'ArrowDown') return 'Down';
  if (key === 'ArrowLeft') return 'Left';
  if (key === 'ArrowRight') return 'Right';
  if (key === 'Tab') return 'Tab';
  if (key === 'Backspace') return 'Backspace';
  if (key === 'Delete') return 'Delete';
  if (key.length === 1) return key.toUpperCase();
  // F1..F24, Home, End, etc come through as-is in Pascal case.
  return key;
}

/**
 * Full-screen-ish key-capture panel. Pressing a combo commits it.
 * Esc cancels. Requires at least one modifier + one real key.
 */
export function ShortcutCapture({ onSave, onCancel }: ShortcutCaptureProps) {
  const [preview, setPreview] = useState<string[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Meta');

      const mainKey = normalizeKey(e.key);
      if (!mainKey) {
        setPreview(parts);
        return;
      }

      parts.push(mainKey);
      setPreview(parts);

      const hasModifier = e.ctrlKey || e.altKey || e.shiftKey || e.metaKey;
      if (hasModifier) onSave(parts.join('+'));
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onSave, onCancel]);

  return (
    <div className="shortcut-edit capture">
      <div className="keys">
        {preview.length ? (
          preview.map((p, i) => <kbd key={`${p}-${i}`}>{p}</kbd>)
        ) : (
          <span className="dim">press keys…</span>
        )}
      </div>
      <span className="rec" onClick={onCancel}>cancel</span>
    </div>
  );
}
