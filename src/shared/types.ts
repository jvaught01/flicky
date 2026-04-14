// ── Voice / State Machine ──────────────────────────────────────────────

export type VoiceState = 'idle' | 'listening' | 'processing' | 'responding';

export type BuddyNavigationMode =
  | 'followingCursor'
  | 'navigatingToTarget'
  | 'pointingAtTarget';

// ── Transcription ──────────────────────────────────────────────────────

export type TranscriptionProviderType = 'groq' | 'openai' | 'native';

export type GroqTranscriptionModel =
  | 'whisper-large-v3'
  | 'whisper-large-v3-turbo'
  | 'distil-whisper-large-v3-en';

export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
}

// ── Screen Capture ─────────────────────────────────────────────────────

export interface ScreenCapture {
  dataBase64: string;
  displayId: number;
  imageWidth: number;
  imageHeight: number;
  displayBounds: { x: number; y: number; width: number; height: number };
  isCursorScreen: boolean;
}

// ── Claude API ─────────────────────────────────────────────────────────

export type ClaudeModel = 'claude-sonnet-4-6' | 'claude-opus-4-6';

export type OpenAIModel = 'gpt-5' | 'gpt-5-mini' | 'gpt-4o';

/** Which service backs the Mind (reasoning) capability. */
export type MindProvider = 'anthropic' | 'openai';

/** Extended-thinking budget mapping. */
export type ReasoningDepth = 'off' | 'medium' | 'deep';

/** System-prompt variant. */
export type ReplyTone = 'concise' | 'friendly' | 'detailed';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

// ── Element Pointing ───────────────────────────────────────────────────

export interface DetectedElement {
  x: number;
  y: number;
  label: string;
  screenIndex: number;
}

// ── API Keys ───────────────────────────────────────────────────────────

export type ApiKeyName = 'anthropic' | 'openai' | 'elevenlabs' | 'groq';

export interface ApiKeyStatus {
  anthropic: boolean;
  openai: boolean;
  elevenlabs: boolean;
  groq: boolean;
}

// ── Voice / TTS ────────────────────────────────────────────────────────

/** Built-in voice presets we curate for the voice picker. */
export interface VoicePreset {
  id: string;
  name: string;
  description: string;
  /** Subscription tier required. Defaults to 'standard' when absent. */
  tier?: 'premium' | 'standard' | 'paid';
}

/**
 * ElevenLabs voice catalogue.
 * Standard = premade voices, confirmed free-tier accessible (source: voices.md).
 * Paid     = voice library voices requiring an ElevenLabs paid subscription.
 */
export const VOICE_PRESETS: VoicePreset[] = [
  // ── Standard — premade, free tier ────────────────────────────────────────
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',    description: 'dominant · firm · en-US',              tier: 'standard' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice',   description: 'clear · engaging · en-US',             tier: 'standard' },
  { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella',   description: 'professional · bright · warm · en-US', tier: 'standard' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill',    description: 'wise · mature · balanced · en-US',     tier: 'standard' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian',   description: 'deep · resonant · comforting · en-US', tier: 'standard' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum',  description: 'husky · trickster · en-US',            tier: 'standard' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'deep · confident · energetic · en-US', tier: 'standard' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris',   description: 'charming · down-to-earth · en-US',     tier: 'standard' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',  description: 'steady · broadcaster · en-US',         tier: 'standard' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric',    description: 'smooth · trustworthy · en-US',         tier: 'standard' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George',  description: 'warm · captivating · en-US',           tier: 'standard' },
  { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Harry',   description: 'fierce · warrior · en-US',             tier: 'standard' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: 'playful · bright · warm · en-US',      tier: 'standard' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura',   description: 'enthusiastic · quirky · en-US',        tier: 'standard' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam',    description: 'energetic · social · en-US',           tier: 'standard' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily',    description: 'velvety · actress · en-US',            tier: 'standard' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'knowledgeable · professional · en-US', tier: 'standard' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River',   description: 'relaxed · neutral · en-US',            tier: 'standard' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger',   description: 'laid-back · casual · resonant · en-US',tier: 'standard' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',   description: 'mature · reassuring · confident · en-US', tier: 'standard' },
  { id: 'bIHbv24MWmeRgasZH58o', name: 'Will',    description: 'relaxed · optimist · en-US',           tier: 'standard' },
  // ── Paid — voice library, ElevenLabs subscription required ───────────────
  { id: 'Fahco4VZzobUeiPqni1S', name: 'Tom',     description: 'custom · en-US',                       tier: 'paid' },
  { id: 'pMsXgVXv3BLzUgSXRplE', name: 'Serena',  description: 'warm · conversational · en-US',        tier: 'paid' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh',    description: 'young · narrative · en-US',            tier: 'paid' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam',     description: 'raspy · narrative · en-US',            tier: 'paid' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli',    description: 'emotional · young · en-US',            tier: 'paid' },
];

// ── Chat History ───────────────────────────────────────────────────────

export interface ChatEntry {
  id: string;
  timestamp: number;
  userText: string;
  assistantText: string;
}

// ── Memory / Context ───────────────────────────────────────────────────

export interface MemoryStats {
  /** Approximate total tokens currently held in context. */
  tokens: number;
  /** Soft cap that triggers auto-compaction. */
  tokenBudget: number;
  /** Full messages held verbatim. */
  messageCount: number;
  /** Messages that have been summarized into the rolling summary. */
  summarizedCount: number;
  /** Whether a rolling summary is currently prepended to context. */
  hasSummary: boolean;
  /** Unix ms of last auto/manual compaction, or null. */
  lastCompactedAt: number | null;
}

// ── Settings ───────────────────────────────────────────────────────────

export interface FlickySettings {
  // Mind
  mindProvider: MindProvider;
  selectedModel: ClaudeModel;
  selectedOpenAIModel: OpenAIModel;
  reasoningDepth: ReasoningDepth;
  replyTone: ReplyTone;

  // Voice (TTS)
  voiceId: string;
  voiceSpeed: number;    // 0.7 – 1.2 (ElevenLabs accepted range)
  voiceStability: number; // 0 – 1
  speakReplies: boolean;

  // Ear (transcription)
  groqTranscriptionModel: GroqTranscriptionModel;
  transcriptionProvider: TranscriptionProviderType;

  // General
  isClickyCursorEnabled: boolean;
  launchAtLogin: boolean;
  pushToTalkShortcut: string;

  // Lifecycle
  onboardingComplete: boolean;
  apiKeyStatus: ApiKeyStatus;
}

export const DEFAULT_SETTINGS: FlickySettings = {
  mindProvider: 'anthropic',
  selectedModel: 'claude-sonnet-4-6',
  selectedOpenAIModel: 'gpt-5',
  reasoningDepth: 'off',
  replyTone: 'friendly',

  voiceId: 'cgSgspJ2msm6clMCkdW9',
  voiceSpeed: 1.0,
  voiceStability: 0.5,
  speakReplies: true,

  groqTranscriptionModel: 'whisper-large-v3-turbo',
  transcriptionProvider: 'groq',

  isClickyCursorEnabled: true,
  launchAtLogin: false,
  pushToTalkShortcut: 'Ctrl+Alt+X',

  onboardingComplete: false,
  apiKeyStatus: { anthropic: false, openai: false, elevenlabs: false, groq: false },
};

// ── IPC Channels ───────────────────────────────────────────────────────

export const IPC = {
  // Main → Renderer
  VOICE_STATE_CHANGED: 'voice-state-changed',
  TRANSCRIPT_UPDATE: 'transcript-update',
  AI_RESPONSE_CHUNK: 'ai-response-chunk',
  AI_RESPONSE_COMPLETE: 'ai-response-complete',
  ELEMENT_DETECTED: 'element-detected',
  CURSOR_POSITION: 'cursor-position',
  SETTINGS_CHANGED: 'settings-changed',
  PERMISSION_STATUS: 'permission-status',
  MEMORY_STATS: 'memory-stats',
  CHAT_ENTRY_ADDED: 'chat-entry-added',

  // Renderer → Main
  PUSH_TO_TALK_START: 'push-to-talk-start',
  PUSH_TO_TALK_STOP: 'push-to-talk-stop',
  SET_MODEL: 'set-model',
  SET_OPENAI_MODEL: 'set-openai-model',
  SET_MIND_PROVIDER: 'set-mind-provider',
  SET_REASONING_DEPTH: 'set-reasoning-depth',
  SET_REPLY_TONE: 'set-reply-tone',
  SET_VOICE_ID: 'set-voice-id',
  SET_VOICE_SPEED: 'set-voice-speed',
  SET_VOICE_STABILITY: 'set-voice-stability',
  SET_SPEAK_REPLIES: 'set-speak-replies',
  SET_GROQ_MODEL: 'set-groq-model',
  TOGGLE_CURSOR: 'toggle-cursor',
  SET_LAUNCH_AT_LOGIN: 'set-launch-at-login',
  SET_PUSH_TO_TALK_SHORTCUT: 'set-push-to-talk-shortcut',
  SUSPEND_PUSH_TO_TALK_SHORTCUT: 'suspend-push-to-talk-shortcut',
  RESUME_PUSH_TO_TALK_SHORTCUT: 'resume-push-to-talk-shortcut',
  GET_SETTINGS: 'get-settings',
  GET_PERMISSIONS: 'get-permissions',
  REQUEST_PERMISSION: 'request-permission',
  OPEN_EXTERNAL: 'open-external',
  QUIT_APP: 'quit-app',
  REPLAY_ONBOARDING: 'replay-onboarding',
  COMPLETE_ONBOARDING: 'complete-onboarding',
  CLEAR_CONTEXT: 'clear-context',
  COMPACT_CONTEXT: 'compact-context',
  GET_MEMORY_STATS: 'get-memory-stats',
  GET_CHAT_HISTORY: 'get-chat-history',
  CLEAR_CHAT_HISTORY: 'clear-chat-history',
  EXPORT_CHAT_PDF: 'export-chat-pdf',
  PLAY_VOICE_PREVIEW: 'play-voice-preview',

  // API Key Management
  SET_API_KEY: 'set-api-key',
  DELETE_API_KEY: 'delete-api-key',
  GET_API_KEY_STATUS: 'get-api-key-status',
} as const;
