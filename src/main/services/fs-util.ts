import * as fs from 'fs';
import * as path from 'path';

/**
 * Crash-safe write: dump to a sibling temp file, fsync, then rename
 * atomically over the target. A crash partway through leaves either
 * the old file intact or the new file complete — never a half-written
 * file. Important for the key store especially: corruption there
 * wipes the user's saved API keys.
 */
export function writeFileAtomic(filePath: string, data: string): void {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmp = path.join(dir, `.${base}.tmp.${process.pid}.${Date.now()}`);

  try {
    const fd = fs.openSync(tmp, 'w');
    try {
      fs.writeSync(fd, data, 0, 'utf-8');
      // Flush to disk before renaming so a post-rename crash doesn't
      // leave us with a renamed-but-empty file on some platforms.
      try { fs.fsyncSync(fd); } catch { /* not all filesystems support fsync */ }
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmp, filePath);
  } catch (err) {
    // Best-effort cleanup of the temp file if rename failed.
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw err;
  }
}
