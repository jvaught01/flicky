import type {
  ConversationTurn,
  ScreenCapture,
  OpenAIModel,
  ReasoningDepth,
  ReplyTone,
} from '../../shared/types';
import { getApiKey } from './key-store';
import { buildSystemPrompt } from './prompts';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/** OpenAI only applies `reasoning_effort` to its reasoning-capable models. */
const REASONING_CAPABLE: Set<OpenAIModel> = new Set<OpenAIModel>(['gpt-5', 'gpt-5-mini']);

const DEPTH_TO_EFFORT: Record<ReasoningDepth, 'low' | 'medium' | 'high' | null> = {
  off: null,
  medium: 'medium',
  deep: 'high',
};

/**
 * Headroom so reasoning tokens don't starve the visible answer.
 * Reasoning-capable models spend silent tokens on the chain-of-thought
 * that count against max_completion_tokens along with output, so we
 * give them more room.
 */
const COMPLETION_TOKENS_REASONING = 4096;
const COMPLETION_TOKENS_STANDARD = 1024;

export interface OpenAIStreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string, usage?: { inputTokens: number; outputTokens: number }) => void;
  onError: (error: Error) => void;
}

export interface OpenAIChatOptions {
  reasoningDepth: ReasoningDepth;
  replyTone: ReplyTone;
}

export class OpenAIAPI {
  async streamChat(
    prompt: string,
    screenshots: ScreenCapture[],
    history: ConversationTurn[],
    model: OpenAIModel,
    options: OpenAIChatOptions,
    callbacks: OpenAIStreamCallbacks,
  ): Promise<void> {
    const apiKey = getApiKey('openai');
    if (!apiKey) {
      callbacks.onError(new Error('OpenAI API key not configured. Add it in the Flicky panel.'));
      return;
    }

    // OpenAI path has no server-side web_search wired yet, so don't
    // claim the capability in the prompt.
    const systemPrompt = buildSystemPrompt(options.replyTone, { hasWebSearch: false });

    const messages: Array<{ role: string; content: unknown }> = [
      { role: 'system', content: systemPrompt },
    ];

    for (const turn of history) {
      messages.push({ role: turn.role, content: turn.content });
    }

    const userContent: Array<Record<string, unknown>> = [];
    for (let i = 0; i < screenshots.length; i++) {
      const sc = screenshots[i];
      userContent.push({
        type: 'text',
        text: `[screen${i}] image is ${sc.imageWidth}x${sc.imageHeight} pixels. top-left is (0,0), bottom-right is (${sc.imageWidth},${sc.imageHeight}). use these pixel coordinates for POINT tags.${sc.isCursorScreen ? ' (this is the active screen — user cursor is here)' : ''}`,
      });
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${sc.dataBase64}` },
      });
    }
    userContent.push({ type: 'text', text: prompt });

    messages.push({ role: 'user', content: userContent });

    const effort = DEPTH_TO_EFFORT[options.reasoningDepth];
    const usesReasoning = REASONING_CAPABLE.has(model) && effort !== null;

    const body: Record<string, unknown> = {
      model,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      // Newer OpenAI models (GPT-5, o-series) require this instead of max_tokens.
      // Reasoning models spend silent thinking tokens against this same budget,
      // so bump it for them to avoid starving the visible answer.
      max_completion_tokens: usesReasoning
        ? COMPLETION_TOKENS_REASONING
        : COMPLETION_TOKENS_STANDARD,
    };

    if (usesReasoning && effort) {
      body.reasoning_effort = effort;
    }

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errText}`);
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
            const chunk = event.choices?.[0]?.delta?.content;
            if (typeof chunk === 'string' && chunk.length > 0) {
              fullText += chunk;
              callbacks.onChunk(chunk);
            }
            if (event.usage) {
              inputTokens = event.usage.prompt_tokens ?? 0;
              outputTokens = event.usage.completion_tokens ?? 0;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      callbacks.onComplete(fullText, { inputTokens, outputTokens });
    } catch (err) {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
