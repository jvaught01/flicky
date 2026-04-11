import type { ConversationTurn, ScreenCapture, ClaudeModel } from '../../shared/types';
import { getApiKey } from './key-store';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const SYSTEM_PROMPT = `you are flicky, a friendly screen-aware ai companion that lives on the user's desktop.

tone: all lowercase, casual, warm, concise. 1-2 sentences unless the user asks you to elaborate.

you can see the user's screen — reference specific things you see. if the user asks about something on screen, describe what you notice.

POINTING AT ELEMENTS:
when you want to show the user something on screen, use the tag: [POINT:x,y:label:screenN]
- x,y are pixel coordinates within the screenshot image (origin is top-left corner, x goes right, y goes down)
- label is a short description of the element you're pointing at
- screenN is which screenshot (screen0 = first image shown, which is the screen the cursor is on)
- be precise: aim for the center of the UI element, button, or text you want to highlight
- always point when showing the user where something is or telling them to click/interact with something

never use abbreviations, lists, or markdown formatting. speak naturally like a friend.`;

export interface ClaudeStreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export class ClaudeAPI {
  async streamChat(
    prompt: string,
    screenshots: ScreenCapture[],
    history: ConversationTurn[],
    model: ClaudeModel,
    callbacks: ClaudeStreamCallbacks,
  ): Promise<void> {
    const apiKey = getApiKey('anthropic');
    if (!apiKey) {
      callbacks.onError(new Error('Anthropic API key not configured. Add it in the Flicky panel.'));
      return;
    }

    // Build message content: images first, then prompt
    const imageContent = screenshots.map((sc) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/jpeg' as const,
        data: sc.dataBase64,
      },
    }));

    const imageLabels = screenshots.map((sc, i) => ({
      type: 'text' as const,
      text: `[screen${i}] image is ${sc.imageWidth}x${sc.imageHeight} pixels. top-left is (0,0), bottom-right is (${sc.imageWidth},${sc.imageHeight}). use these pixel coordinates for POINT tags.${sc.isCursorScreen ? ' (this is the active screen — user cursor is here)' : ''}`,
    }));

    // Interleave labels with images
    const mediaContent: Array<Record<string, unknown>> = [];
    for (let i = 0; i < screenshots.length; i++) {
      mediaContent.push(imageLabels[i]);
      mediaContent.push(imageContent[i]);
    }

    // Build messages array with history
    const messages: Array<{ role: string; content: unknown }> = [];
    for (const turn of history) {
      messages.push({ role: turn.role, content: turn.content });
    }

    // Current user message with screenshots + prompt
    messages.push({
      role: 'user',
      content: [...mediaContent, { type: 'text', text: prompt }],
    });

    const body = JSON.stringify({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
      stream: true,
    });

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              const chunk = event.delta.text;
              fullText += chunk;
              callbacks.onChunk(chunk);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      callbacks.onComplete(fullText);
    } catch (err) {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
