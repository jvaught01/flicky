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
