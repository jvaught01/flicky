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

/** Jessica — premade, free-tier, warm & conversational. */
const DEFAULT_VOICE_ID = 'cgSgspJ2msm6clMCkdW9';

/**
 * Voice IDs that are no longer valid free-tier voices (old deprecated IDs or
 * library voices requiring a paid ElevenLabs subscription). Any persisted
 * setting using one of these will be migrated to DEFAULT_VOICE_ID on startup.
 */
const LEGACY_VOICE_IDS = new Set([
  'pMsXgVXv3BLzUgSXRplE', // Serena  — library voice
  'Fahco4VZzobUeiPqni1S', // Tom     — library voice
  '21m00Tcm4TlvDq8ikWAM', // Rachel  — deprecated premade ID
  'AZnzlk1XvdvUeBnXmlld', // Domi    — deprecated premade ID
  'ErXwobaYiN019PkySvjV', // Antoni  — deprecated premade ID
  'VR6AewLTigWG4xSOukaG', // Arnold  — deprecated premade ID
  'TxGEqnHWrfWFTfGW9XjX', // Josh   — library voice
  'yoZ06aMxZJJ28mfd3POQ', // Sam    — library voice
  'MF3mGyEYCl7XYWbV9V6O', // Elli   — deprecated/library
  'TX3LPaxmHKxFdv7VOFE1', // Liam   — wrong voice ID
]);

const DEFAULTS: StoredSettings = {
  mindProvider: 'anthropic',
  selectedModel: 'claude-sonnet-4-6',
  selectedOpenAIModel: 'gpt-5',
  reasoningDepth: 'off',
  replyTone: 'friendly',

  voiceId: DEFAULT_VOICE_ID,
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
  let data: StoredSettings;
  try {
    const raw = fs.readFileSync(getFilePath(), 'utf-8');
    data = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    data = { ...DEFAULTS };
  }
  // Migrate stale/library voice IDs that 402 on free-tier accounts.
  if (LEGACY_VOICE_IDS.has(data.voiceId)) {
    data.voiceId = DEFAULT_VOICE_ID;
    write(data);
  }
  return data;
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
