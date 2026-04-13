import type {
  ConversationTurn,
  ScreenCapture,
  ClaudeModel,
  ReasoningDepth,
  ReplyTone,
} from '../../shared/types';
import { getApiKey } from './key-store';
import { buildSystemPrompt } from './prompts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

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
  /** Aborting mid-stream is treated as a graceful interrupt, not an error. */
  signal?: AbortSignal;
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

    const systemPrompt = buildSystemPrompt(options.replyTone, { hasWebSearch: true });

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
        signal: options.signal,
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
      // Aborts are expected when the user interrupts with a new turn —
      // treat them as graceful, not as errors.
      if (err instanceof Error && (err.name === 'AbortError' || options.signal?.aborted)) {
        return;
      }
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
