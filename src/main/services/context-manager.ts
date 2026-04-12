import type { ConversationTurn, MemoryStats } from '../../shared/types';
import { getApiKey } from './key-store';
import * as settingsStore from './settings-store';

/**
 * Token-based conversation memory.
 *
 * - Tracks an approximate running token count for the full conversation.
 * - Keeps the most recent KEEP_RECENT messages verbatim.
 * - When total tokens cross COMPACT_TRIGGER, summarizes everything older
 *   than the recent window into a single rolling summary prepended to
 *   the history, and drops the compacted messages.
 *
 * Token count is approximate — we use a 4 chars/token heuristic for
 * anything that wasn't metered by the API. When a Claude API response
 * reports input/output token usage, prefer that.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const MAX_TOKEN_BUDGET = 250_000;
export const COMPACT_TRIGGER = 200_000;
export const KEEP_RECENT = 10;

function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

interface TrackedTurn extends ConversationTurn {
  tokens: number;
}

export class ContextManager {
  private turns: TrackedTurn[] = [];
  private summary: string | null = null;
  private summaryTokens = 0;
  private lastCompactedAt: number | null = null;
  private summarizedCount = 0;

  /** Returns a copy of the messages we should send to Claude this turn. */
  getMessagesForSend(): ConversationTurn[] {
    const out: ConversationTurn[] = [];
    if (this.summary) {
      out.push({
        role: 'user',
        content: `[summary of earlier conversation]\n${this.summary}`,
      });
      out.push({
        role: 'assistant',
        content: 'got it, picking up from there.',
      });
    }
    for (const t of this.turns) out.push({ role: t.role, content: t.content });
    return out;
  }

  /**
   * Append a user/assistant exchange. Called once per turn after we have
   * the final assistant text. If Claude reported usage we can pass the
   * exact numbers, otherwise we estimate.
   */
  async recordExchange(
    userText: string,
    assistantText: string,
    opts: { inputTokens?: number; outputTokens?: number } = {},
  ): Promise<void> {
    const userTok = opts.inputTokens ?? approxTokens(userText);
    const asstTok = opts.outputTokens ?? approxTokens(assistantText);

    this.turns.push({ role: 'user', content: userText, tokens: userTok });
    this.turns.push({ role: 'assistant', content: assistantText, tokens: asstTok });

    if (this.totalTokens() >= COMPACT_TRIGGER) {
      await this.compact();
    }
  }

  /** Is there anything we could fold into a summary right now? */
  canCompact(): boolean {
    return this.turns.length >= 3;
  }

  totalTokens(): number {
    let sum = this.summaryTokens;
    for (const t of this.turns) sum += t.tokens;
    return sum;
  }

  /**
   * Summarize everything older than the KEEP_RECENT window into a single
   * rolling summary. If we already have a summary, fold it in.
   *
   * When `force` is true (manual "Compact now"), we'll compact even when
   * the conversation is smaller than the recent window — we keep only the
   * most recent exchange (2 turns) verbatim and fold everything else in.
   */
  async compact(force = false): Promise<void> {
    const keep = force ? Math.min(2, this.turns.length) : KEEP_RECENT;
    if (this.turns.length <= keep) return;

    const olderTurns = this.turns.slice(0, this.turns.length - keep);
    const recentTurns = this.turns.slice(this.turns.length - keep);

    const transcript = olderTurns
      .map((t) => `${t.role === 'user' ? 'User' : 'Flicky'}: ${t.content}`)
      .join('\n\n');

    const priorSummaryBlock = this.summary
      ? `Prior summary of earlier conversation:\n${this.summary}\n\nNew exchanges to fold in:\n`
      : '';

    const prompt =
      priorSummaryBlock +
      transcript +
      '\n\nWrite a concise running summary of this conversation so far. Preserve names, decisions, preferences, tasks in progress, and unresolved questions. Drop chit-chat. Use 2–6 short paragraphs, no bullet points.';

    try {
      const summary = await this.summarizeViaActiveProvider(prompt);
      this.summary = this.summary
        ? `${this.summary}\n\n${summary}`.trim()
        : summary;
      this.summaryTokens = approxTokens(this.summary);
      this.summarizedCount += olderTurns.length;
      this.turns = recentTurns;
      this.lastCompactedAt = Date.now();
    } catch (err) {
      console.error('[Flicky] context compact failed:', err);
      if (force) {
        // Manual compaction: surface the error so the UI can show it.
        throw err;
      }
      // Auto-compact fallback: drop the oldest half of non-recent turns
      // verbatim so we at least stay under budget even without a summary.
      const dropCount = Math.ceil(olderTurns.length / 2);
      this.turns = [...olderTurns.slice(dropCount), ...recentTurns];
      this.summarizedCount += dropCount;
      this.lastCompactedAt = Date.now();
    }
  }

  /** Pick whichever provider has a key, preferring the active Mind provider. */
  private async summarizeViaActiveProvider(prompt: string): Promise<string> {
    const mindProvider = settingsStore.get('mindProvider');
    const anthropicKey = getApiKey('anthropic');
    const openaiKey = getApiKey('openai');

    const preferOpenAI = mindProvider === 'openai';
    const tryOrder: Array<'anthropic' | 'openai'> = preferOpenAI
      ? ['openai', 'anthropic']
      : ['anthropic', 'openai'];

    for (const provider of tryOrder) {
      if (provider === 'anthropic' && anthropicKey) {
        return this.summarizeViaClaude(prompt, anthropicKey);
      }
      if (provider === 'openai' && openaiKey) {
        return this.summarizeViaOpenAI(prompt, openaiKey);
      }
    }

    throw new Error('No reasoning provider key configured — add Anthropic or OpenAI in the Mind tab.');
  }

  private async summarizeViaClaude(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      throw new Error(`compact (anthropic) ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    const text = data?.content?.[0]?.text;
    if (!text || typeof text !== 'string') throw new Error('no summary text');
    return text;
  }

  private async summarizeViaOpenAI(prompt: string, apiKey: string): Promise<string> {
    const model = settingsStore.get('selectedOpenAIModel');
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 1024,
      }),
    });
    if (!response.ok) {
      throw new Error(`compact (openai) ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text || typeof text !== 'string') throw new Error('no summary text');
    return text;
  }

  clear(): void {
    this.turns = [];
    this.summary = null;
    this.summaryTokens = 0;
    this.summarizedCount = 0;
    this.lastCompactedAt = null;
  }

  getStats(): MemoryStats {
    return {
      tokens: this.totalTokens(),
      tokenBudget: MAX_TOKEN_BUDGET,
      messageCount: this.turns.length,
      summarizedCount: this.summarizedCount,
      hasSummary: this.summary !== null,
      lastCompactedAt: this.lastCompactedAt,
    };
  }
}
