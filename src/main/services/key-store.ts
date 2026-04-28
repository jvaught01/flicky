import { safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { writeFileAtomic } from './fs-util';

/**
 * Secure API key storage using Electron's safeStorage API.
 *
 * Keys are encrypted at rest using the OS-level credential store:
 *  - macOS: Keychain
 *  - Windows: DPAPI (Data Protection API)
 *  - Linux: libsecret / kwallet
 *
 * The encrypted blobs are persisted in a JSON file in the app's userData
 * directory. Even if someone reads that file, the values are opaque
 * ciphertext that can only be decrypted by the current OS user.
 */

const KEY_NAMES = ['anthropic', 'openai', 'elevenlabs', 'groq'] as const;
export type NamedApiKey = (typeof KEY_NAMES)[number];
export type ApiKeyName = NamedApiKey | string;

interface KeyFile {
  encryptedKeys: Record<string, string>; // base64-encoded ciphertext
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

  const encrypted = safeStorage.encryptString(plaintext);
  data.encryptedKeys[name] = encrypted.toString('base64');
  writeKeyFile(data);
}

export function getApiKey(name: ApiKeyName): string | null {
  const data = readKeyFile();
  const blob = data.encryptedKeys[name];
  if (!blob) return null;

  try {
    const buffer = Buffer.from(blob, 'base64');
    return safeStorage.decryptString(buffer);
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
