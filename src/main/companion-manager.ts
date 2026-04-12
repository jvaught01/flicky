import { app, systemPreferences } from 'electron';
import { ClaudeAPI } from './services/claude-api';
import { ElevenLabsTTS } from './services/elevenlabs-tts';
import { createTranscriptionProvider, type TranscriptionProvider } from './services/transcription';
import { captureAllDisplays } from './services/screen-capture';
import { parsePointTags } from './services/element-detector';
import { ContextManager } from './services/context-manager';
import * as settingsStore from './services/settings-store';
import * as keyStore from './services/key-store';
import * as analytics from './services/analytics';
import type {
  VoiceState,
  FlickySettings,
  ClaudeModel,
  GroqTranscriptionModel,
  TranscriptionResult,
  DetectedElement,
  ScreenCapture,
  ApiKeyName,
  ReasoningDepth,
  ReplyTone,
  MemoryStats,
} from '../shared/types';

export interface CompanionCallbacks {
  onVoiceStateChanged: (state: VoiceState) => void;
  onTranscriptUpdate: (result: TranscriptionResult) => void;
  onAiResponseChunk: (chunk: string) => void;
  onAiResponseComplete: (fullText: string) => void;
  onElementDetected: (element: DetectedElement | null) => void;
  onSettingsChanged: (settings: FlickySettings) => void;
  onMemoryStatsChanged: (stats: MemoryStats) => void;
  onStartAudioCapture: () => void;
  onStopAudioCapture: () => void;
  onPlayAudio: (audioBuffer: Buffer) => void;
}

export class CompanionManager {
  private callbacks: CompanionCallbacks;

  private claude: ClaudeAPI;
  private tts: ElevenLabsTTS;
  private context: ContextManager;
  private transcriptionProvider: TranscriptionProvider | null = null;

  private voiceState: VoiceState = 'idle';
  private lastScreenshots: ScreenCapture[] = [];
  private isRecording = false;

  constructor(callbacks: CompanionCallbacks) {
    this.callbacks = callbacks;
    this.claude = new ClaudeAPI();
    this.tts = new ElevenLabsTTS();
    this.context = new ContextManager();

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

  setModel(model: ClaudeModel): void {
    settingsStore.set('selectedModel', model);
    this.emitSettings();
  }

  setReasoningDepth(depth: ReasoningDepth): void {
    settingsStore.set('reasoningDepth', depth);
    this.emitSettings();
  }

  setReplyTone(tone: ReplyTone): void {
    settingsStore.set('replyTone', tone);
    this.emitSettings();
  }

  setVoiceId(id: string): void {
    settingsStore.set('voiceId', id);
    this.emitSettings();
  }

  setVoiceSpeed(speed: number): void {
    settingsStore.set('voiceSpeed', speed);
    this.emitSettings();
  }

  setVoiceStability(stability: number): void {
    settingsStore.set('voiceStability', stability);
    this.emitSettings();
  }

  setSpeakReplies(enabled: boolean): void {
    settingsStore.set('speakReplies', enabled);
    this.emitSettings();
  }

  setGroqModel(model: GroqTranscriptionModel): void {
    settingsStore.set('groqTranscriptionModel', model);
    this.emitSettings();
  }

  toggleCursor(enabled: boolean): void {
    settingsStore.set('isClickyCursorEnabled', enabled);
    this.emitSettings();
  }

  setLaunchAtLogin(enabled: boolean): void {
    settingsStore.set('launchAtLogin', enabled);
    try {
      app.setLoginItemSettings({ openAtLogin: enabled });
    } catch (err) {
      console.error('[Flicky] setLoginItemSettings failed:', err);
    }
    this.emitSettings();
  }

  completeOnboarding(): void {
    settingsStore.set('onboardingComplete', true);
    this.emitSettings();
  }

  replayOnboarding(): void {
    settingsStore.set('onboardingComplete', false);
    analytics.trackOnboardingReplayed();
    this.emitSettings();
  }

  // ── Context / Memory ─────────────────────────────────────────────────

  clearContext(): void {
    this.context.clear();
    this.emitMemoryStats();
  }

  async compactContext(): Promise<void> {
    await this.context.compact();
    this.emitMemoryStats();
  }

  getMemoryStats(): MemoryStats {
    return this.context.getStats();
  }

  // ── API Keys ─────────────────────────────────────────────────────────

  setApiKey(name: ApiKeyName, value: string): void {
    keyStore.setApiKey(name, value);
    this.emitSettings();
  }

  deleteApiKey(name: ApiKeyName): void {
    keyStore.deleteApiKey(name);
    this.emitSettings();
  }

  getApiKeyStatus(): Record<ApiKeyName, boolean> {
    return keyStore.getKeyStatus();
  }

  // ── TTS preview ──────────────────────────────────────────────────────

  async playVoicePreview(voiceId: string): Promise<void> {
    try {
      const buf = await this.tts.synthesize(
        "hi, i'm flicky. i'll be using this voice to talk with you.",
        {
          voiceId,
          speed: settingsStore.get('voiceSpeed'),
          stability: settingsStore.get('voiceStability'),
        },
      );
      this.callbacks.onPlayAudio(buf);
    } catch (err) {
      console.error('[Flicky] voice preview failed:', err);
    }
  }

  // ── Permissions ──────────────────────────────────────────────────────

  async getPermissions(): Promise<Record<string, boolean>> {
    const perms: Record<string, boolean> = { microphone: false, screen: false };
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
    if (process.platform === 'darwin' && kind === 'microphone') {
      await systemPreferences.askForMediaAccess('microphone');
    }
  }

  // ── Push-to-Talk Pipeline ────────────────────────────────────────────

  async handlePushToTalk(): Promise<void> {
    if (this.isRecording) await this.stopRecordingAndProcess();
    else await this.startRecording();
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

    this.setVoiceState('processing');
    try {
      this.lastScreenshots = await captureAllDisplays();
    } catch (err) {
      console.error('Screen capture failed:', err);
      this.lastScreenshots = [];
    }

    const settings = settingsStore.getAll();
    this.setVoiceState('responding');

    await this.claude.streamChat(
      result.text,
      this.lastScreenshots,
      this.context.getMessagesForSend(),
      settings.selectedModel,
      {
        reasoningDepth: settings.reasoningDepth,
        replyTone: settings.replyTone,
      },
      {
        onChunk: (chunk) => this.callbacks.onAiResponseChunk(chunk),
        onComplete: async (fullText, usage) => {
          analytics.trackAiResponseReceived(fullText);

          const cleanText = fullText.replace(/\[POINT:[^\]]+\]/g, '').trim();
          this.callbacks.onAiResponseComplete(cleanText);

          await this.context.recordExchange(result.text, cleanText, {
            inputTokens: usage?.inputTokens,
            outputTokens: usage?.outputTokens,
          });
          this.emitMemoryStats();

          const element = parsePointTags(fullText, this.lastScreenshots);
          if (element) {
            this.callbacks.onElementDetected(element);
            analytics.trackElementPointed(element.label);
          }

          if (settings.speakReplies && keyStore.getKeyStatus().elevenlabs) {
            try {
              const audioBuffer = await this.tts.synthesize(cleanText, {
                voiceId: settings.voiceId,
                speed: settings.voiceSpeed,
                stability: settings.voiceStability,
              });
              this.callbacks.onPlayAudio(audioBuffer);
            } catch (err) {
              console.error('TTS error:', err);
              analytics.trackTtsError(String(err));
            }
          }

          this.setVoiceState('idle');
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

  // ── Internal ─────────────────────────────────────────────────────────

  private setVoiceState(state: VoiceState): void {
    this.voiceState = state;
    this.callbacks.onVoiceStateChanged(state);
  }

  private emitSettings(): void {
    this.callbacks.onSettingsChanged(this.getSettings());
  }

  private emitMemoryStats(): void {
    this.callbacks.onMemoryStatsChanged(this.context.getStats());
  }
}
