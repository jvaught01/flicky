import { useEffect, useState } from 'react';

interface ShortcutCaptureProps {
  onSave: (accelerator: string) => void;
  onCancel: () => void;
}

const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'OS', 'ContextMenu']);

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
  return key;
}

/**
 * Listens for a key combo. The existing global shortcut is suspended
 * while this is mounted so that the currently-registered accelerator
 * doesn't swallow the keys we want to capture.
 *
 * A combo preview builds as the user holds modifiers and presses a
 * non-modifier key. Save commits; Cancel reverts.
 */
export function ShortcutCapture({ onSave, onCancel }: ShortcutCaptureProps) {
  const [preview, setPreview] = useState<string[]>([]);
  const [hasValid, setHasValid] = useState(false);

  // Suspend the global shortcut while capturing so keys reach the renderer.
  useEffect(() => {
    window.flicky.suspendPushToTalkShortcut();
    return () => {
      window.flicky.resumePushToTalkShortcut();
    };
  }, []);

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
        setHasValid(false);
        return;
      }

      parts.push(mainKey);
      const hasModifier = e.ctrlKey || e.altKey || e.shiftKey || e.metaKey;
      setPreview(parts);
      setHasValid(hasModifier);
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onCancel]);

  const accelerator = preview.join('+');

  const handleSave = () => {
    if (hasValid && accelerator) onSave(accelerator);
  };

  return (
    <div className="shortcut-edit capture">
      <div className="keys">
        {preview.length ? (
          preview.map((p, i) => <kbd key={`${p}-${i}`}>{p}</kbd>)
        ) : (
          <span className="dim">press keys…</span>
        )}
      </div>
      <button
        className="capture-save"
        onClick={handleSave}
        disabled={!hasValid}
        title={hasValid ? `Save ${accelerator}` : 'Press a modifier + key'}
      >
        Save
      </button>
      <button className="capture-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
