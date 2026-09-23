import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { fetchAllNews } from '@/lib/news/fetcher';
import { deduplicate } from '@/lib/news/deduplicator';
import { filterAndScore } from '@/lib/portfolio/filtering';
import { mapImpacts } from '@/lib/impact/engine';
import { analyzeNews } from '@/lib/ai/analyzer';
import { buildFallbackResponse } from '@/lib/fallback/ruleBasedFormatter';
import { formatBrief, formatAllSourcesError } from '@/lib/discord/formatter';
import { sendToDiscord } from '@/lib/discord/webhook';
import { getEnv } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';

function verifyCronSecret(request: NextRequest): boolean {
  const env = getEnv();
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  const provided = match[1];
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(env.cronSecret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const env = getEnv();

  // Fail closed — reject all requests if CRON_SECRET is missing or invalid
  if (!env.cronSecret) {
    logger.error('[cron] CRON_SECRET not configured — rejecting all requests');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!verifyCronSecret(request)) {
    logger.warn('[cron] unauthorized request rejected');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[run] started');

  try {
    // 1. Fetch news from all RSS sources (each fails independently)
    const { articles: raw, failedSources, successfulSources } = await fetchAllNews(env.newsApiKey);
    logger.info('[news] articles fetched', { total: raw.length, failed: failedSources.length });

    // 2. All sources failed
    if (successfulSources.length === 0) {
      logger.error('[run] all sources failed — sending error notice to Discord');
      const messages = formatAllSourcesError();
      await sendToDiscord(messages);
      return NextResponse.json({ status: 'error', reason: 'all sources failed' }, { status: 200 });
    }

    // 3. Deduplicate
    const deduped = deduplicate(raw);
    logger.info('[news] after dedup', { count: deduped.length });

    // 4. Relevance + materiality filter
    const scored = filterAndScore(deduped);
    logger.info('[news] after filter', { count: scored.length });

    // 5. Impact mapping
    const mapped = mapImpacts(scored);

    // 6. AI analysis (or fallback)
    let briefData;
    let mode: 'ai' | 'fallback';

    const aiResult = await analyzeNews(mapped);
    if (aiResult.success) {
      briefData = aiResult.data;
      mode = 'ai';
      logger.info('[ai] mode: haiku');
    } else {
      logger.info('[ai] mode: fallback', { reason: aiResult.error });
      briefData = buildFallbackResponse(scored);
      mode = 'fallback';
    }

    // 7. Format + send
    const messages = formatBrief(briefData, mode);
    const result = await sendToDiscord(messages);

    logger.info('[discord] send', { success: result.success, messages: result.messagesSent });
    logger.info('[run] completed');

    return NextResponse.json({
      status: 'ok',
      aiMode: mode,
      articlesFetched: raw.length,
      articlesFiltered: scored.length,
      messagesSent: result.messagesSent,
      failedSources,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[run] unhandled error', { error: msg });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Hobby max is 60s
