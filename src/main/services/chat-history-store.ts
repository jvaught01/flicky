import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { writeFileAtomic } from './fs-util';
import type { ChatEntry } from '../../shared/types';

/**
 * Persistent, local-only chat log. Every exchange (user question +
 * assistant reply) is appended here. Nothing ever leaves the machine.
 *
 * - In-memory cache populated lazily on first read; all subsequent
 *   reads/writes touch the cache, not the file.
 * - Writes are debounced and flushed atomically (write-tmp → rename).
 * - Bounded at MAX_ENTRIES so the file can't grow without limit.
 */

const MAX_ENTRIES = 1000;
const FLUSH_DELAY_MS = 400;

let cache: ChatEntry[] | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function getFilePath(): string {
  return path.join(app.getPath('userData'), 'flicky-chat-history.json');
}

function readFromDisk(): ChatEntry[] {
  try {
    const raw = fs.readFileSync(getFilePath(), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ensureCache(): ChatEntry[] {
  if (cache === null) cache = readFromDisk();
  return cache;
}

function flushNow(): void {
  if (cache === null) return;
  try {
    writeFileAtomic(getFilePath(), JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error('[Flicky] chat history flush failed:', err);
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushNow();
  }, FLUSH_DELAY_MS);
}

export function getAll(): ChatEntry[] {
  return [...ensureCache()];
}

export function append(entry: Omit<ChatEntry, 'id' | 'timestamp'>): ChatEntry {
  const full: ChatEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    ...entry,
  };
  const arr = ensureCache();
  arr.push(full);
  if (arr.length > MAX_ENTRIES) arr.splice(0, arr.length - MAX_ENTRIES);
  scheduleFlush();
  return full;
}

export function clear(): void {
  cache = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flushNow();
}

/** Synchronous flush — call on app will-quit to avoid losing pending writes. */
export function flushSync(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flushNow();
}
