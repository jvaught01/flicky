import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import type { ClaudeModel, GroqTranscriptionModel, TranscriptionProviderType } from '../../shared/types';

/**
 * Simple JSON-file settings store.
 * Avoids the ESM-only `electron-store` v10 compatibility issues.
 */

export interface StoredSettings {
  selectedModel: ClaudeModel;
  groqTranscriptionModel: GroqTranscriptionModel;
  isClickyCursorEnabled: boolean;
  transcriptionProvider: TranscriptionProviderType;
  onboardingComplete: boolean;
  selectedVoiceId: string;
}

const DEFAULTS: StoredSettings = {
  selectedModel: 'claude-sonnet-4-6',
  groqTranscriptionModel: 'whisper-large-v3-turbo',
  isClickyCursorEnabled: true,
  transcriptionProvider: 'groq',
  onboardingComplete: false,
  selectedVoiceId: 'cgSgspJ2msm6clMCkdW9',
};

function getFilePath(): string {
  return path.join(app.getPath('userData'), 'flicky-settings.json');
}

function read(): StoredSettings {
  try {
    const raw = fs.readFileSync(getFilePath(), 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(data: StoredSettings): void {
  fs.writeFileSync(getFilePath(), JSON.stringify(data, null, 2), 'utf-8');
}

export function get<K extends keyof StoredSettings>(key: K): StoredSettings[K] {
  return read()[key];
}

export function set<K extends keyof StoredSettings>(key: K, value: StoredSettings[K]): void {
  const data = read();
  data[key] = value;
  write(data);
}

export function getAll(): StoredSettings {
  return read();
}
