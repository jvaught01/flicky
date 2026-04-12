import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import type { ChatEntry } from '../../shared/types';

/**
 * Persistent, local-only chat log. Every exchange (user question +
 * assistant reply) is appended here as a single entry. Nothing ever
 * leaves the machine.
 *
 * File format: one JSON array of ChatEntry objects. Kept bounded at
 * MAX_ENTRIES so the file can't grow unbounded.
 */

const MAX_ENTRIES = 1000;

function getFilePath(): string {
  return path.join(app.getPath('userData'), 'flicky-chat-history.json');
}

function read(): ChatEntry[] {
  try {
    const raw = fs.readFileSync(getFilePath(), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: ChatEntry[]): void {
  fs.writeFileSync(getFilePath(), JSON.stringify(entries, null, 2), 'utf-8');
}

export function getAll(): ChatEntry[] {
  return read();
}

export function append(entry: Omit<ChatEntry, 'id' | 'timestamp'>): ChatEntry {
  const full: ChatEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    ...entry,
  };
  const entries = read();
  entries.push(full);
  // Trim from the front if we exceed the cap.
  const trimmed = entries.length > MAX_ENTRIES ? entries.slice(-MAX_ENTRIES) : entries;
  write(trimmed);
  return full;
}

export function clear(): void {
  write([]);
}
