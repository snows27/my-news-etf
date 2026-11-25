import Anthropic from '@anthropic-ai/sdk';
import type { ImpactMapping } from '@/lib/impact/engine';
import type { AIBriefResponse } from '@/types/ai';
import { getEnv } from '@/lib/utils/env';
import { getModelId } from './config';
import { buildPrompt } from './prompt';
import { parseAIResponse } from './schema';
import { repairMixedScriptWords } from './textRepair';
import { logger } from '@/lib/utils/logger';

type AnalysisResult =
  | { success: true; data: AIBriefResponse; mode: 'haiku' }
  | { success: false; error: string; mode: 'fallback' };

const TRANSIENT_ERRORS = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'fetch failed', 'network'];

function isTransient(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return TRANSIENT_ERRORS.some((e) => msg.toLowerCase().includes(e.toLowerCase()));
}

async function callClaude(prompt: string): Promise<string> {
  const env = getEnv();
  if (!env.anthropicApiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey: env.anthropicApiKey });
  const modelId = getModelId();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);

  try {
    const message = await client.messages.create(
      {
        model: modelId,
        max_tokens: env.maxOutputTokens,
        // Low effort keeps thinking short: this is a once-a-day summary that must
        // finish well inside the 60s Vercel Hobby function limit.
        output_config: { effort: 'low' },
        messages: [{ role: 'user', content: prompt }],
      },
      { signal: controller.signal }
    );

    if (message.stop_reason === 'refusal') throw new Error('Claude declined the request (refusal)');
    if (message.stop_reason === 'max_tokens') {
      throw new Error('Claude response truncated (max_tokens) — raise MAX_OUTPUT_TOKENS');
    }

    // Newer models return thinking blocks before the answer, so find the text block
    // rather than assuming it is content[0].
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    if (!text) throw new Error('No text in Claude response');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function enforceInputLimits(mappings: ImpactMapping[]): ImpactMapping[] {
  const { maxAiArticles, maxTotalInputChars, maxSnippetChars } = getEnv();

  // Sort by materiality score descending, take top N
  const sorted = [...mappings].sort(
    (a, b) => b.article.materialityScore - a.article.materialityScore
  );
  const limited = sorted.slice(0, maxAiArticles);

  // Truncate snippets and enforce total input size
  let totalChars = 0;
  const result: ImpactMapping[] = [];

  for (const m of limited) {
    const truncatedSnippet = m.article.snippet.slice(0, maxSnippetChars);
    const articleChars = m.article.title.length + truncatedSnippet.length;

    if (totalChars + articleChars > maxTotalInputChars) {
      logger.info('[ai] total input limit reached, stopping at article', { count: result.length });
      break;
    }

    totalChars += articleChars;
    result.push({
      ...m,
      article: { ...m.article, snippet: truncatedSnippet },
    });
  }

  return result;
}

export async function analyzeNews(mappings: ImpactMapping[]): Promise<AnalysisResult> {
  if (mappings.length === 0) {
    logger.info('[ai] no articles to analyze — skipping Claude call');
    return { success: false, error: 'no articles', mode: 'fallback' };
  }

  const limitedMappings = enforceInputLimits(mappings);
  logger.info('[ai] articles sent to Claude', { count: limitedMappings.length, model: getModelId() });

  const prompt = buildPrompt(limitedMappings);

  // Attempt with one retry for transient failures
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const text = await callClaude(prompt);
      logger.info('[ai] raw response preview', { chars: text.length, preview: text.slice(0, 200) });
      const result = parseAIResponse(text);

      if (!result.valid) {
        logger.warn('[ai] schema validation failed', { error: result.error });
        return { success: false, error: `schema validation: ${result.error}`, mode: 'fallback' };
      }

      logger.info('[ai] response: valid JSON', { model: getModelId() });

      const sourceTexts = limitedMappings.map((m) => `${m.article.title} ${m.article.snippet}`);
      const { data, fixes } = repairMixedScriptWords(result.data, sourceTexts);
      if (fixes.length > 0) logger.info('[ai] repaired mixed-script words', { fixes });

      return { success: true, data, mode: 'haiku' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const transient = isTransient(err);

      if (attempt === 1 && transient) {
        logger.warn('[ai] transient failure on attempt 1 — retrying once', { error: msg });
        continue;
      }

      // Non-transient or second attempt failed
      logger.warn('[ai] failure — switching to rule-based fallback', { attempt, error: msg });
      return { success: false, error: msg, mode: 'fallback' };
    }
  }

  // Should not reach here, but TypeScript needs a return
  return { success: false, error: 'exhausted retries', mode: 'fallback' };
}
