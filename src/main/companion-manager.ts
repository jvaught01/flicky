import { systemPreferences } from 'electron';
import { ClaudeAPI } from './services/claude-api';
import { ElevenLabsTTS } from './services/elevenlabs-tts';
import { createTranscriptionProvider, type TranscriptionProvider } from './services/transcription';
import { captureAllDisplays } from './services/screen-capture';
import { parsePointTags } from './services/element-detector';
import * as settingsStore from './services/settings-store';
import * as keyStore from './services/key-store';
import * as analytics from './services/analytics';
import type {
  VoiceState,
  FlickySettings,
  ClaudeModel,
  GroqTranscriptionModel,
  ConversationTurn,
  TranscriptionResult,
  DetectedElement,
  ScreenCapture,
  ApiKeyName,
} from '../shared/types';

// Keep last 6 exchanges (12 turns). Older context gets dropped to keep
// the context window lean and avoid confusion from stale screen references.
const MAX_HISTORY = 6;

export interface CompanionCallbacks {
  onVoiceStateChanged: (state: VoiceState) => void;
  onTranscriptUpdate: (result: TranscriptionResult) => void;
  onAiResponseChunk: (chunk: string) => void;
  onAiResponseComplete: (fullText: string) => void;
  onElementDetected: (element: DetectedElement | null) => void;
  onSettingsChanged: (settings: FlickySettings) => void;
  onStartAudioCapture: () => void;
  onStopAudioCapture: () => void;
  onPlayAudio: (audioBuffer: Buffer) => void;
}

export class CompanionManager {
  private callbacks: CompanionCallbacks;

  private claude: ClaudeAPI;
  private tts: ElevenLabsTTS;
  private transcriptionProvider: TranscriptionProvider | null = null;

  private voiceState: VoiceState = 'idle';
  private conversationHistory: ConversationTurn[] = [];
  private lastScreenshots: ScreenCapture[] = [];
  private isRecording = false;

  constructor(callbacks: CompanionCallbacks) {
    this.callbacks = callbacks;
    this.claude = new ClaudeAPI();
    this.tts = new ElevenLabsTTS();

    analytics.initAnalytics('', 'https://us.i.posthog.com');
    analytics.trackAppOpened();
  }

  // ── Settings ─────────────────────────────────────────────────────────

  getSettings(): FlickySettings {
    const stored = settingsStore.getAll();
    return {
      ...stored,
      apiKeyStatus: keyStore.getKeyStatus(),
    };
  }

  setGroqModel(model: GroqTranscriptionModel): void {
    settingsStore.set('groqTranscriptionModel', model);
    this.callbacks.onSettingsChanged(this.getSettings());
  }

  setModel(model: ClaudeModel): void {
    settingsStore.set('selectedModel', model);
    this.callbacks.onSettingsChanged(this.getSettings());
  }

  toggleCursor(enabled: boolean): void {
    settingsStore.set('isClickyCursorEnabled', enabled);
    this.callbacks.onSettingsChanged(this.getSettings());
  }

  completeOnboarding(): void {
    settingsStore.set('onboardingComplete', true);
    this.callbacks.onSettingsChanged(this.getSettings());
  }

  replayOnboarding(): void {
    settingsStore.set('onboardingComplete', false);
    analytics.trackOnboardingReplayed();
    this.callbacks.onSettingsChanged(this.getSettings());
  }

  clearContext(): void {
    this.conversationHistory = [];
  }

  // ── API Key Management ───────────────────────────────────────────────

  setApiKey(name: ApiKeyName, value: string): void {
    keyStore.setApiKey(name, value);
    this.callbacks.onSettingsChanged(this.getSettings());
  }

  deleteApiKey(name: ApiKeyName): void {
    keyStore.deleteApiKey(name);
    this.callbacks.onSettingsChanged(this.getSettings());
  }

  getApiKeyStatus(): Record<ApiKeyName, boolean> {
    return keyStore.getKeyStatus();
  }

  // ── Permissions ──────────────────────────────────────────────────────

  async getPermissions(): Promise<Record<string, boolean>> {
    const perms: Record<string, boolean> = {
      microphone: false,
      screen: false,
    };

    if (process.platform === 'darwin') {
      perms.microphone = systemPreferences.getMediaAccessStatus('microphone') === 'granted';
      perms.screen = systemPreferences.getMediaAccessStatus('screen') === 'granted';
    } else {
      perms.microphone = true;
      perms.screen = true;
    }

    return perms;
  }

  async requestPermission(kind: string): Promise<void> {
    if (process.platform === 'darwin') {
      if (kind === 'microphone') {
        await systemPreferences.askForMediaAccess('microphone');
      }
    }
  }

  // ── Push-to-Talk Pipeline ────────────────────────────────────────────

  async handlePushToTalk(): Promise<void> {
    if (this.isRecording) {
      await this.stopRecordingAndProcess();
    } else {
      await this.startRecording();
    }
  }

  async startPushToTalk(): Promise<void> {
    if (this.isRecording) return;
    await this.startRecording();
  }

  async stopPushToTalk(): Promise<void> {
    if (!this.isRecording) return;
    await this.stopRecordingAndProcess();
  }

  private async startRecording(): Promise<void> {
    this.isRecording = true;
    this.setVoiceState('listening');
    analytics.trackPushToTalkStarted();

    const provider = settingsStore.get('transcriptionProvider');
    this.transcriptionProvider = createTranscriptionProvider(provider);

    this.transcriptionProvider.onPartialTranscript = (text) => {
      this.callbacks.onTranscriptUpdate({ text, isFinal: false });
    };

    try {
      await this.transcriptionProvider.start();
      this.callbacks.onStartAudioCapture();
    } catch (err) {
      console.error('Failed to start transcription:', err);
      this.setVoiceState('idle');
      this.isRecording = false;
    }
  }

  private async stopRecordingAndProcess(): Promise<void> {
    this.isRecording = false;
    this.callbacks.onStopAudioCapture();
    analytics.trackPushToTalkReleased();

    if (!this.transcriptionProvider) {
      this.setVoiceState('idle');
      return;
    }

    const result = await this.transcriptionProvider.stop();
    this.transcriptionProvider = null;

    if (!result.text.trim()) {
      this.setVoiceState('idle');
      return;
    }

    this.callbacks.onTranscriptUpdate(result);
    analytics.trackUserMessageSent(result.text);

    // Capture screenshots
    this.setVoiceState('processing');
    try {
      this.lastScreenshots = await captureAllDisplays();
    } catch (err) {
      console.error('Screen capture failed:', err);
      this.lastScreenshots = [];
    }

    // Send to Claude
    const model = settingsStore.get('selectedModel');
    this.setVoiceState('responding');

    await this.claude.streamChat(
      result.text,
      this.lastScreenshots,
      this.conversationHistory,
      model,
      {
        onChunk: (chunk) => {
          this.callbacks.onAiResponseChunk(chunk);
        },
        onComplete: async (fullText) => {
          analytics.trackAiResponseReceived(fullText);

          const cleanText = fullText.replace(/\[POINT:[^\]]+\]/g, '').trim();
          this.callbacks.onAiResponseComplete(cleanText);

          // Update conversation history
          this.conversationHistory.push(
            { role: 'user', content: result.text },
            { role: 'assistant', content: cleanText },
          );
          if (this.conversationHistory.length > MAX_HISTORY * 2) {
            this.conversationHistory = this.conversationHistory.slice(-MAX_HISTORY * 2);
          }

          // Detect element pointing
          const element = parsePointTags(fullText, this.lastScreenshots);
          if (element) {
            this.callbacks.onElementDetected(element);
            analytics.trackElementPointed(element.label);
          }

          // Text-to-speech
          try {
            const audioBuffer = await this.tts.synthesize(cleanText);
            this.callbacks.onPlayAudio(audioBuffer);
          } catch (err) {
            console.error('TTS error:', err);
            analytics.trackTtsError(String(err));
          }

          this.setVoiceState('idle');
          // Delay clearing the element so the cursor holds at the target
          // while the user reads the response / listens to TTS
          setTimeout(() => this.callbacks.onElementDetected(null), 6000);
        },
        onError: (err) => {
          console.error('Claude API error:', err);
          analytics.trackResponseError(err.message);
          this.setVoiceState('idle');
        },
      },
    );
  }

  handleAudioChunk(buffer: Buffer): void {
    this.transcriptionProvider?.sendAudio(buffer);
  }

  private setVoiceState(state: VoiceState): void {
    this.voiceState = state;
    this.callbacks.onVoiceStateChanged(state);
  }
}
