import { getApiKey } from './key-store';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export interface TtsOptions {
  voiceId: string;
  /** 0.7–1.2 */
  speed: number;
  /** 0–1 */
  stability: number;
}

/**
 * ElevenLabs Text-to-Speech client.
 * Keys are stored locally via Electron safeStorage.
 */
export class ElevenLabsTTS {
  async synthesize(text: string, options: TtsOptions): Promise<Buffer> {
    const apiKey = getApiKey('elevenlabs');
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured. Add it in the Flicky panel.');
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/${options.voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: clamp(options.stability, 0, 1),
          similarity_boost: 0.75,
          speed: clamp(options.speed, 0.7, 1.2),
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

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
