import type {
  ConversationTurn,
  ScreenCapture,
  ClaudeModel,
  ReasoningDepth,
  ReplyTone,
} from '../../shared/types';
import { getApiKey } from './key-store';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const BASE_PROMPT = `you are flicky, a friendly screen-aware ai companion that lives on the user's desktop.

you can see the user's screen — reference specific things you see. if the user asks about something on screen, describe what you notice.

TOOLS:
you have access to web_search. use it when the user asks about something that needs fresh or current info (news, prices, docs, today's weather, recent releases, etc.). don't use it for things you already know confidently or for simple on-screen questions. when you do search, quietly incorporate the findings into your spoken answer — don't read out URLs.

POINTING AT ELEMENTS:
when you want to show the user something on screen, use the tag: [POINT:x,y:label:screenN]
- x,y are pixel coordinates within the screenshot image (origin is top-left corner, x goes right, y goes down)
- label is a short description of the element you're pointing at
- screenN is which screenshot (screen0 = first image shown, which is the screen the cursor is on)
- be precise: aim for the center of the UI element, button, or text you want to highlight
- always point when showing the user where something is or telling them to click/interact with something

never use markdown formatting. speak naturally like a friend.`;

const TONE_STYLES: Record<ReplyTone, string> = {
  concise:
    'tone: all lowercase, direct, minimal. respond in 1 short sentence unless the user explicitly asks for more. no pleasantries.',
  friendly:
    'tone: all lowercase, casual, warm, concise. 1-2 sentences unless the user asks you to elaborate. never use abbreviations or lists.',
  detailed:
    'tone: lowercase, warm, and thorough. explain your reasoning briefly when it helps. up to 4 sentences; expand further if the user asks.',
};

/** Claude extended-thinking budget tokens for each depth setting. */
const THINKING_BUDGETS: Record<ReasoningDepth, number> = {
  off: 0,
  medium: 4000,
  deep: 16000,
};

export interface ClaudeStreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string, usage?: { inputTokens: number; outputTokens: number }) => void;
  onError: (error: Error) => void;
}

export interface ClaudeChatOptions {
  reasoningDepth: ReasoningDepth;
  replyTone: ReplyTone;
}

export class ClaudeAPI {
  async streamChat(
    prompt: string,
    screenshots: ScreenCapture[],
    history: ConversationTurn[],
    model: ClaudeModel,
    options: ClaudeChatOptions,
    callbacks: ClaudeStreamCallbacks,
  ): Promise<void> {
    const apiKey = getApiKey('anthropic');
    if (!apiKey) {
      callbacks.onError(new Error('Anthropic API key not configured. Add it in the Flicky panel.'));
      return;
    }

    const systemPrompt = `${BASE_PROMPT}\n\n${TONE_STYLES[options.replyTone]}`;

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

    const mediaContent: Array<Record<string, unknown>> = [];
    for (let i = 0; i < screenshots.length; i++) {
      mediaContent.push(imageLabels[i]);
      mediaContent.push(imageContent[i]);
    }

    const messages: Array<{ role: string; content: unknown }> = [];
    for (const turn of history) {
      messages.push({ role: turn.role, content: turn.content });
    }
    messages.push({
      role: 'user',
      content: [...mediaContent, { type: 'text', text: prompt }],
    });

    const thinkingBudget = THINKING_BUDGETS[options.reasoningDepth];
    const requestBody: Record<string, unknown> = {
      model,
      max_tokens: thinkingBudget > 0 ? thinkingBudget + 1024 : 1024,
      system: systemPrompt,
      messages,
      stream: true,
      // Let Flicky reach the web when it needs fresh info. Server-side
      // tool — Claude decides when to search and we just stream the
      // final answer.
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3,
        },
      ],
    };

    if (thinkingBudget > 0) {
      requestBody.thinking = {
        type: 'enabled',
        budget_tokens: thinkingBudget,
      };
    }

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          'anthropic-beta': 'web-search-2025-03-05',
        },
        body: JSON.stringify(requestBody),
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
      let inputTokens = 0;
      let outputTokens = 0;

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
            } else if (event.type === 'message_start' && event.message?.usage) {
              inputTokens = event.message.usage.input_tokens ?? 0;
            } else if (event.type === 'message_delta' && event.usage?.output_tokens) {
              outputTokens = event.usage.output_tokens;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      callbacks.onComplete(fullText, { inputTokens, outputTokens });
    } catch (err) {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
