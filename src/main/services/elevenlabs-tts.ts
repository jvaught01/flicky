import { getApiKey } from './key-store';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

/**
 * ElevenLabs Text-to-Speech client.
 *
 * Calls the ElevenLabs API directly using the locally stored API key.
 * Keys are encrypted at rest via Electron safeStorage and never leave the machine.
 */
export class ElevenLabsTTS {
  private voiceId: string;

  constructor(voiceId = 'cgSgspJ2msm6clMCkdW9') {
    this.voiceId = voiceId;
  }

  setVoiceId(id: string): void {
    this.voiceId = id;
  }

  async synthesize(text: string): Promise<Buffer> {
    const apiKey = getApiKey('elevenlabs');
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured. Add it in the Flicky panel.');
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/${this.voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs TTS error ${response.status}: ${errText}`);
    }

    const arrayBuf = await response.arrayBuffer();
    return Buffer.from(arrayBuf);
  }
}
