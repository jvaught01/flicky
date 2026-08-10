import { safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { writeFileAtomic } from './fs-util';

/**
 * Secure API key storage using Electron's safeStorage API when available.
 *
 * Keys are encrypted at rest using the OS-level credential store:
 *  - macOS: Keychain
 *  - Windows: DPAPI (Data Protection API)
 *  - Linux: libsecret / kwallet
 *
 * On Linux without a secret service (e.g. minimal Hyprland/Sway), safeStorage
 * is unavailable; keys are not encrypted and are readable by anything that
 * can read the file. Values are still base64-encoded and tagged so the format
 * is unambiguous on read.
 *
 * The blobs are persisted in a JSON file in the app's userData directory.
 */

const KEY_NAMES = ['anthropic', 'openai', 'elevenlabs', 'groq'] as const;
export type NamedApiKey = (typeof KEY_NAMES)[number];
export type ApiKeyName = NamedApiKey | string;

const ENC_PREFIX = 'enc:';
const PLAIN_PREFIX = 'plain:';

interface KeyFile {
  encryptedKeys: Record<string, string>; // tagged base64 blobs
}

function getKeyFilePath(): string {
  return path.join(app.getPath('userData'), 'flicky-keys.json');
}

function readKeyFile(): KeyFile {
  try {
    const raw = fs.readFileSync(getKeyFilePath(), 'utf-8');
    return JSON.parse(raw) as KeyFile;
  } catch {
    return { encryptedKeys: {} };
  }
}

function writeKeyFile(data: KeyFile): void {
  writeFileAtomic(getKeyFilePath(), JSON.stringify(data, null, 2));
}

export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}

export function setApiKey(name: ApiKeyName, plaintext: string): void {
  const data = readKeyFile();

  if (!plaintext) {
    delete data.encryptedKeys[name];
    writeKeyFile(data);
    return;
  }

  data.encryptedKeys[name] = safeStorage.isEncryptionAvailable()
    ? `${ENC_PREFIX}${safeStorage.encryptString(plaintext).toString('base64')}`
    : `${PLAIN_PREFIX}${Buffer.from(plaintext).toString('base64')}`;
  writeKeyFile(data);
}

export function getApiKey(name: ApiKeyName): string | null {
  const data = readKeyFile();
  const blob = data.encryptedKeys[name];
  if (!blob) return null;

  if (blob.startsWith(ENC_PREFIX)) {
    try {
      return safeStorage.decryptString(Buffer.from(blob.slice(ENC_PREFIX.length), 'base64'));
    } catch {
      return null;
    }
  }

  if (blob.startsWith(PLAIN_PREFIX)) {
    try {
      return Buffer.from(blob.slice(PLAIN_PREFIX.length), 'base64').toString('utf-8');
    } catch {
      return null;
    }
  }

  // Legacy untagged blobs (pre-tag format).
  if (safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(blob, 'base64'));
    } catch {
      // Fall through: blob may be plain base64 from a no-encryption env.
    }
  }

  try {
    return Buffer.from(blob, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

export function hasApiKey(name: ApiKeyName): boolean {
  const data = readKeyFile();
  return !!data.encryptedKeys[name];
}

export function deleteApiKey(name: ApiKeyName): void {
  const data = readKeyFile();
  delete data.encryptedKeys[name];
  writeKeyFile(data);
}

export function getKeyStatus(): Record<NamedApiKey, boolean> {
  return {
    anthropic: hasApiKey('anthropic'),
    openai: hasApiKey('openai'),
    elevenlabs: hasApiKey('elevenlabs'),
    groq: hasApiKey('groq'),
  };
}
