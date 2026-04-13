import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { writeFileAtomic } from './fs-util';
import type {
  ClaudeModel,
  OpenAIModel,
  MindProvider,
  GroqTranscriptionModel,
  TranscriptionProviderType,
  ReasoningDepth,
  ReplyTone,
} from '../../shared/types';

/**
 * Simple JSON-file settings store.
 * Avoids the ESM-only `electron-store` v10 compatibility issues.
 */

export interface StoredSettings {
  mindProvider: MindProvider;
  selectedModel: ClaudeModel;
  selectedOpenAIModel: OpenAIModel;
  reasoningDepth: ReasoningDepth;
  replyTone: ReplyTone;

  voiceId: string;
  voiceSpeed: number;
  voiceStability: number;
  speakReplies: boolean;

  groqTranscriptionModel: GroqTranscriptionModel;
  transcriptionProvider: TranscriptionProviderType;

  isClickyCursorEnabled: boolean;
  launchAtLogin: boolean;
  pushToTalkShortcut: string;

  onboardingComplete: boolean;
}

const DEFAULTS: StoredSettings = {
  mindProvider: 'anthropic',
  selectedModel: 'claude-sonnet-4-6',
  selectedOpenAIModel: 'gpt-5',
  reasoningDepth: 'off',
  replyTone: 'friendly',

  voiceId: 'pMsXgVXv3BLzUgSXRplE',
  voiceSpeed: 1.0,
  voiceStability: 0.5,
  speakReplies: true,

  groqTranscriptionModel: 'whisper-large-v3-turbo',
  transcriptionProvider: 'groq',

  isClickyCursorEnabled: true,
  launchAtLogin: false,
  pushToTalkShortcut: 'Ctrl+Alt+X',

  onboardingComplete: false,
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
  writeFileAtomic(getFilePath(), JSON.stringify(data, null, 2));
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
