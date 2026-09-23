export interface EnvConfig {
  discordWebhookUrl: string;
  cronSecret: string;
  anthropicApiKey: string | null;
  anthropicModel: string;
  newsApiKey: string | null;
  maxAiArticles: number;
  maxSnippetChars: number;
  maxTotalInputChars: number;
  maxOutputTokens: number;
  aiTimeoutMs: number;
}

let _config: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (_config) return _config;

  const missing: string[] = [];

  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!discordWebhookUrl) missing.push('DISCORD_WEBHOOK_URL');
  if (!cronSecret) missing.push('CRON_SECRET');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  _config = {
    discordWebhookUrl: discordWebhookUrl!,
    cronSecret: cronSecret!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? null,
    anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    newsApiKey: process.env.NEWS_API_KEY ?? null,
    maxAiArticles: parseInt(process.env.MAX_AI_ARTICLES ?? '5', 10),
    maxSnippetChars: parseInt(process.env.MAX_SNIPPET_CHARS ?? '600', 10),
    maxTotalInputChars: parseInt(process.env.MAX_TOTAL_INPUT_CHARS ?? '15000', 10),
    maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS ?? '4000', 10),
    aiTimeoutMs: parseInt(process.env.AI_TIMEOUT_MS ?? '120000', 10),
  };

  return _config;
}

export function resetEnvCache(): void {
  _config = null;
}
