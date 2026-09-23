import type { AIBriefResponse, NewsStatus, EventRisk } from '@/types/ai';
import { formatBangkokDate, nowInBangkok } from '@/lib/utils/timezone';

const DISCORD_LIMIT = 1990; // slightly below 2000 for safety

function statusEmoji(status: NewsStatus): string {
  if (status === 'SUPPORTING') return '🟢';
  if (status === 'UNCERTAINTY') return '🟡';
  return '🔴';
}

function riskEmoji(risk: EventRisk): string {
  if (risk === 'LOW') return '🟢 LOW';
  if (risk === 'MEDIUM') return '🟡 MEDIUM';
  return '🔴 HIGH';
}

function header(date: string, mode: 'ai' | 'fallback'): string {
  const modeNote = mode === 'fallback' ? '\n⚠️ _AI analysis unavailable — rule-based summary_' : '';
  return `📰 **DAILY PORTFOLIO BRIEF**\n📅 ${date} | 🕗 08:00 น. (เวลาไทย)${modeNote}\n━━━━━━━━━━━━━━`;
}

function buildTopNews(data: AIBriefResponse): string {
  if (data.noMaterialNews || data.topNews.length === 0) {
    return `🔥 **TOP NEWS**\nวันนี้ไม่พบข่าวสำคัญที่มีนัยต่อสินทรัพย์ที่ติดตาม`;
  }
  const lines = ['🔥 **TOP NEWS**'];
  for (const [i, item] of data.topNews.entries()) {
    lines.push(
      `\n**${i + 1}. ${item.headline}**`,
      `📌 กระทบ: ${item.affectedAssets.join(', ')}`,
      `📰 ${item.whatHappened}`,
      `💡 เหตุผล: ${item.whyItMatters}`,
      `🔗 กลไก: ${item.transmissionMechanism}`,
      `👁 ติดตาม: ${item.whatToMonitor}`,
      `_${item.source}_`
    );
  }
  return lines.join('\n');
}

function buildSCBSection(data: AIBriefResponse): string {
  const lines = ['🏦 **SCB FUND CLICK**'];
  const funds = [
    { key: 'SCBSP500E', label: 'SCBSP500E' },
    { key: 'SCBNASDAQ100E', label: 'SCBNASDAQ100E' },
    { key: 'SCBWORLDE', label: 'SCBWORLDE' },
    { key: 'SCBGOLDE', label: 'SCBGOLDE' },
  ] as const;

  for (const fund of funds) {
    const asset = data.assets[fund.key];
    lines.push(`\n**${fund.label}** ${statusEmoji(asset.status)}`);
    lines.push(asset.summary);
    if (asset.keyPoints.length > 0) {
      lines.push(...asset.keyPoints.map((p) => `• ${p}`));
    }
  }
  return lines.join('\n');
}

function buildNVDASection(data: AIBriefResponse): string {
  const nvda = data.assets.NVDA;
  return [
    `💻 **NVDA** ${statusEmoji(nvda.status)}`,
    `📰 ${nvda.news}`,
    nvda.mechanism ? `🔗 กลไก: ${nvda.mechanism}` : '',
    nvda.whatToMonitor ? `👁 ติดตาม: ${nvda.whatToMonitor}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildXAUUSDSection(data: AIBriefResponse): string {
  const x = data.assets.XAUUSD;
  const lines = [`🤖 **XAUUSD / EA RISK**`, `⚡ Event Risk: ${riskEmoji(x.eventRisk)}`];

  if (x.noSignificantEvents || x.events.length === 0) {
    lines.push('✅ วันนี้ไม่มี scheduled event ที่มีความเสี่ยงสูงผิดปกติสำหรับ XAUUSD');
  } else {
    for (const evt of x.events) {
      lines.push(`\n• **${evt.description}**`);
      lines.push(`  🕐 ${evt.ictTime}`);
      lines.push(`  ${evt.whyItMatters}`);
    }
  }

  if (x.volatilityRationale) {
    lines.push(`\n📊 ${x.volatilityRationale}`);
  }
  return lines.join('\n');
}

function buildUpcomingSection(data: AIBriefResponse): string {
  if (data.upcomingEvents.length === 0) return '';
  const lines = ['📅 **NEXT 24–48H**'];
  for (const evt of data.upcomingEvents) {
    lines.push(`• ${evt.event} — ${evt.ictTime}`);
    if (evt.relevance) lines.push(`  _${evt.relevance}_`);
  }
  return lines.join('\n');
}

function buildBottomLine(data: AIBriefResponse): string {
  return `📝 **BOTTOM LINE**\n${data.bottomLine}`;
}

function buildSources(data: AIBriefResponse): string {
  if (data.topNews.length === 0) return '';
  const sources = data.topNews
    .filter((n) => n.url)
    .map((n) => `• ${n.source}: <${n.url}>`);
  if (sources.length === 0) return '';
  return `🔗 **SOURCES**\n${sources.join('\n')}`;
}

// Section-aware split: each section is a logical chunk
// We split at section boundaries, never slicing mid-sentence
function splitIntoMessages(sections: string[]): string[] {
  const messages: string[] = [];
  let current = '';

  for (const section of sections) {
    if (!section.trim()) continue;
    const separator = current ? '\n━━━━━━━━━━━━━━\n' : '';
    const candidate = current + separator + section;

    if (candidate.length <= DISCORD_LIMIT) {
      current = candidate;
    } else {
      // Current chunk full — flush it and start new
      if (current) messages.push(current);

      // If the section itself exceeds the limit, split at paragraph/bullet boundaries
      if (section.length > DISCORD_LIMIT) {
        const chunks = splitLargeSection(section);
        for (const chunk of chunks) {
          messages.push(chunk);
        }
        current = '';
      } else {
        current = section;
      }
    }
  }

  if (current) messages.push(current);
  return messages;
}

function splitLargeSection(section: string): string[] {
  const lines = section.split('\n');
  const chunks: string[] = [];
  let current = '';

  for (const line of lines) {
    const candidate = current ? current + '\n' + line : line;
    if (candidate.length <= DISCORD_LIMIT) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      // If even a single line is too long, hard-truncate with notice
      current = line.length > DISCORD_LIMIT ? line.slice(0, DISCORD_LIMIT - 20) + '… [ตัดทอน]' : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function formatBrief(data: AIBriefResponse, mode: 'ai' | 'fallback'): string[] {
  const date = formatBangkokDate(nowInBangkok());

  const sections = [
    header(date, mode),
    buildTopNews(data),
    buildSCBSection(data),
    buildNVDASection(data),
    buildXAUUSDSection(data),
    buildUpcomingSection(data),
    buildBottomLine(data),
    buildSources(data),
  ].filter(Boolean);

  const messages = splitIntoMessages(sections);

  // Final safety check — each message must be under limit
  return messages.map((m) => {
    if (m.length > DISCORD_LIMIT) {
      return m.slice(0, DISCORD_LIMIT - 30) + '\n… [ข้อความถูกตัดทอน]';
    }
    return m;
  });
}

export function formatAllSourcesError(): string[] {
  return [
    `📰 **DAILY PORTFOLIO BRIEF**\n\n⚠️ ไม่สามารถรวบรวมข่าวจากแหล่งข้อมูลที่กำหนดได้ในรอบนี้\nระบบไม่ได้สร้างข่าวหรือสรุปจากข้อมูลที่ไม่สามารถตรวจสอบได้`,
  ];
}
