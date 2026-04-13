// ── ElevenLabs Voices ──────────────────────────────────────────────────

export type VoiceTier = 'premium' | 'standard' | 'paid';

export interface ElevenLabsVoice {
  name: string;
  voiceId: string;
  tier: VoiceTier;
}

export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  // ── Premium — featured, higher-fidelity ElevenLabs voices ──────────
  { name: 'Adam',    voiceId: 'pNInz6obpgDQGcFmaJgB', tier: 'premium' },
  { name: 'Brian',   voiceId: 'nPczCjzI2devNBz1zQrb', tier: 'premium' },
  { name: 'Daniel',  voiceId: 'onwK4e9ZLuTAKqWW03F9', tier: 'premium' },
  { name: 'George',  voiceId: 'JBFqnCBsd6RMkjVDRZzb', tier: 'premium' },
  { name: 'Jessica', voiceId: 'cgSgspJ2msm6clMCkdW9', tier: 'premium' },
  { name: 'Liam',    voiceId: 'TX3LPaxmHKxFdv7VOQHJ', tier: 'premium' },
  { name: 'Matilda', voiceId: 'XrExE9yKIg1WjnnlVkGX', tier: 'premium' },
  { name: 'River',   voiceId: 'SAz9YHcvj6GT2YYXdXww', tier: 'premium' },
  { name: 'Sarah',   voiceId: 'EXAVITQu4vr4xnSDxMaL', tier: 'premium' },

  // ── Standard — broadly available premade voices ─────────────────────
  { name: 'Alice',   voiceId: 'Xb7hH8MSUJpSbSDYk0k2', tier: 'standard' },
  { name: 'Bella',   voiceId: 'hpp4J3VqNfWAUOO0d1Us', tier: 'standard' },
  { name: 'Bill',    voiceId: 'pqHfZKP75CvOlQylNhV4', tier: 'standard' },
  { name: 'Callum',  voiceId: 'N2lVS1w4EtoT3dr4eOWO', tier: 'standard' },
  { name: 'Charlie', voiceId: 'IKne3meq5aSn9XLyUdCD', tier: 'standard' },
  { name: 'Chris',   voiceId: 'iP95p4xoKVk53GoZ742B', tier: 'standard' },
  { name: 'Eric',    voiceId: 'cjVigY5qzO86Huf0OWal', tier: 'standard' },
  { name: 'Harry',   voiceId: 'SOYHLrjzK2X1ezoPC6cr', tier: 'standard' },
  { name: 'Laura',   voiceId: 'FGY2WhTYpPnrIDTdsKH5', tier: 'standard' },
  { name: 'Lily',    voiceId: 'pFZP5JQG7iQjIQuC4Bku', tier: 'standard' },
  { name: 'Roger',   voiceId: 'CwhRBWXzGAHq8TQ4Fs17', tier: 'standard' },
  { name: 'Will',    voiceId: 'bIHbv24MWmeRgasZH58o', tier: 'standard' },

  // ── Paid — additional voices requiring a Creator+ ElevenLabs plan ───
  // Voice IDs sourced from ElevenLabs API documentation; verify against
  // your account's Voice Library if any return a 404/invalid-voice error.
  { name: 'Clyde',   voiceId: '2EiwWnXFnvU5JabPnv8n', tier: 'paid' },
  { name: 'Dave',    voiceId: 'CYw3kZ02Hs0563khs1Fj', tier: 'paid' },
  { name: 'Dorothy', voiceId: 'ThT5KcBeYPX3keUQqHPh', tier: 'paid' },
  { name: 'Drew',    voiceId: '29vD33N1CtxCmqQRPOHJ', tier: 'paid' },
  { name: 'Fin',     voiceId: 'D38z5RcWu1voky8WS1ja', tier: 'paid' },
  { name: 'Freya',   voiceId: 'jsCqWAovK2LkecY7zXl4', tier: 'paid' },
  { name: 'Grace',   voiceId: 'oWAxZDx7w5VEj9dCyTzz', tier: 'paid' },
  { name: 'Nicole',  voiceId: 'piTKgcLEGmPE4e6mEKli', tier: 'paid' },
  { name: 'Patrick', voiceId: 'ODq5zmih8GrVes37Dy9n', tier: 'paid' },
  { name: 'Rachel',  voiceId: '21m00Tcm4TlvDq8ikWAM', tier: 'paid' },
  { name: 'Sam',     voiceId: 'yoZ06aMxZJJ28mfd3POQ', tier: 'paid' },
  { name: 'Serena',  voiceId: 'pMsXgVXv3BLzUgSXRplE', tier: 'paid' },
  { name: 'Thomas',  voiceId: 'GBv7mTt0atIp3Br8iCZE', tier: 'paid' },
];

// ── Voice / State Machine ──────────────────────────────────────────────

export type VoiceState = 'idle' | 'listening' | 'processing' | 'responding';

export type BuddyNavigationMode =
  | 'followingCursor'
  | 'navigatingToTarget'
  | 'pointingAtTarget';

// ── Transcription ──────────────────────────────────────────────────────

export type TranscriptionProviderType = 'groq' | 'openai' | 'native';

export type GroqTranscriptionModel = 'whisper-large-v3' | 'whisper-large-v3-turbo';

export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
}

// ── Screen Capture ─────────────────────────────────────────────────────

export interface ScreenCapture {
  /** Base-64 encoded JPEG */
  dataBase64: string;
  /** Which display this came from */
  displayId: number;
  /** Pixel dimensions of the captured image */
  imageWidth: number;
  imageHeight: number;
  /** Display bounds in OS coordinates */
  displayBounds: { x: number; y: number; width: number; height: number };
  /** Whether the mouse cursor is on this display */
  isCursorScreen: boolean;
}

// ── Claude API ─────────────────────────────────────────────────────────

export type ClaudeModel = 'claude-sonnet-4-6' | 'claude-opus-4-6';

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

export type ApiKeyName = 'anthropic' | 'elevenlabs' | 'groq';

export interface ApiKeyStatus {
  anthropic: boolean;
  elevenlabs: boolean;
  groq: boolean;
}

// ── Settings ───────────────────────────────────────────────────────────

export interface FlickySettings {
  selectedModel: ClaudeModel;
  groqTranscriptionModel: GroqTranscriptionModel;
  isClickyCursorEnabled: boolean;
  transcriptionProvider: TranscriptionProviderType;
  onboardingComplete: boolean;
  apiKeyStatus: ApiKeyStatus;
  selectedVoiceId: string;
}

export const DEFAULT_SETTINGS: FlickySettings = {
  selectedModel: 'claude-sonnet-4-6',
  groqTranscriptionModel: 'whisper-large-v3-turbo',
  isClickyCursorEnabled: true,
  transcriptionProvider: 'groq',
  onboardingComplete: false,
  apiKeyStatus: { anthropic: false, elevenlabs: false, groq: false },
  selectedVoiceId: 'cgSgspJ2msm6clMCkdW9',
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

  // Renderer → Main
  PUSH_TO_TALK_START: 'push-to-talk-start',
  PUSH_TO_TALK_STOP: 'push-to-talk-stop',
  SET_MODEL: 'set-model',
  TOGGLE_CURSOR: 'toggle-cursor',
  GET_SETTINGS: 'get-settings',
  GET_PERMISSIONS: 'get-permissions',
  REQUEST_PERMISSION: 'request-permission',
  OPEN_EXTERNAL: 'open-external',
  QUIT_APP: 'quit-app',
  REPLAY_ONBOARDING: 'replay-onboarding',
  COMPLETE_ONBOARDING: 'complete-onboarding',
  SET_GROQ_MODEL: 'set-groq-model',
  CLEAR_CONTEXT: 'clear-context',

  // API Key Management (Renderer → Main)
  SET_API_KEY: 'set-api-key',
  DELETE_API_KEY: 'delete-api-key',
  GET_API_KEY_STATUS: 'get-api-key-status',
  TEST_TTS: 'test-tts',
  SET_VOICE: 'set-voice',
} as const;
