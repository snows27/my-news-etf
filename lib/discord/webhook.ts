import { getEnv } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';
import type { SendResult } from '@/types/discord';

async function sendSingleMessage(webhookUrl: string, content: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Discord returned ${res.status}: ${body.slice(0, 200)}`);
  }
}

export async function sendToDiscord(messages: string[]): Promise<SendResult> {
  const { discordWebhookUrl } = getEnv();
  let sent = 0;

  for (const [i, content] of messages.entries()) {
    try {
      await sendSingleMessage(discordWebhookUrl, content);
      sent++;
      logger.info('[discord] message sent', { index: i + 1, total: messages.length });

      // Small delay between messages to avoid rate limits
      if (i < messages.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('[discord] send failed', { index: i + 1, error: msg });
      return { success: false, messagesSent: sent, error: `Message ${i + 1} failed` };
    }
  }

  return { success: true, messagesSent: sent };
}
