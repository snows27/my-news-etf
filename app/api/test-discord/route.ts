import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { sendToDiscord } from '@/lib/discord/webhook';
import { getEnv } from '@/lib/utils/env';
import { formatBangkokDate, nowInBangkok } from '@/lib/utils/timezone';
import { logger } from '@/lib/utils/logger';
import { DEFAULT_HAIKU_MODEL } from '@/lib/ai/config';

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

  if (!env.cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!verifyCronSecret(request)) {
    logger.warn('[test-discord] unauthorized request rejected');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const date = formatBangkokDate(nowInBangkok());
  const model = env.anthropicModel ?? DEFAULT_HAIKU_MODEL;

  const testMessage = [
    `📰 **DAILY PORTFOLIO BRIEF — TEST**`,
    `📅 ${date} | 🕗 08:00 ICT`,
    `━━━━━━━━━━━━━━`,
    `✅ Discord webhook connection successful`,
    `🤖 AI Model: \`${model}\``,
    `🔧 Environment: ${process.env.NODE_ENV ?? 'unknown'}`,
    ``,
    `_This is a test message from portfolio-news-bot._`,
    `_No real news data was fetched for this test._`,
  ].join('\n');

  try {
    const result = await sendToDiscord([testMessage]);
    if (result.success) {
      logger.info('[test-discord] test message sent successfully');
      return NextResponse.json({ status: 'ok', messagesSent: result.messagesSent });
    } else {
      logger.error('[test-discord] send failed', { error: result.error });
      return NextResponse.json({ status: 'error', error: 'Discord send failed' }, { status: 500 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[test-discord] error', { error: msg });
    return NextResponse.json({ status: 'error', error: 'Internal error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
