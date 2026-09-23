import type { ImpactMapping } from '@/lib/impact/engine';
import { getEnv } from '@/lib/utils/env';

function truncateSnippet(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '…';
}

export function buildPrompt(mappings: ImpactMapping[]): string {
  const { maxSnippetChars } = getEnv();

  const articlesJson = mappings.map((m, i) => ({
    id: i + 1,
    title: m.article.title,
    source: m.article.source,
    url: m.article.url,
    publishedAt: m.article.publishedAt.toISOString(),
    snippet: truncateSnippet(m.article.snippet, maxSnippetChars),
    materiality: m.article.materiality,
    affectedAssets: m.article.affectedAssets,
    transmissionChains: m.assetMappings.flatMap((am) => am.transmissionChains),
  }));

  return `You are a financial news summarizer. Your role is to summarize financial news for a personal portfolio monitoring system. You do NOT give investment advice.

PORTFOLIO:
- SCBSP500E: SCB S&P500 Fund (US large-cap equities)
- SCBNASDAQ100E: SCB Nasdaq-100 Fund (Nasdaq, AI, technology)
- SCBWORLDE: SCB World Equity Fund (global equities)
- SCBGOLDE: SCB Gold Fund (gold exposure)
- NVDA: NVIDIA stock (Webull, separate from SCB funds)
- XAUUSD: Gold/USD EA trading bots (event/volatility risk monitoring only, separate from investment)

RULES:
1. Use ONLY facts from input articles. Never invent.
2. All text in Thai.
3. NEVER output: Buy, Sell, Hold, Entry, Exit, Price target.
4. Status SUPPORTING/UNCERTAINTY/RISK = news environment only.
5. XAUUSD LOW/MEDIUM/HIGH = volatility risk only, NOT direction.
6. Use hedged language: "อาจส่งผลผ่าน..." "ตลาดมักติดตาม..."

STRICT OUTPUT LIMITS (tokens are expensive — stay within):
- topNews: MAX 3 items
- headline: max 60 chars
- whatHappened: max 80 chars
- whyItMatters: max 80 chars
- transmissionMechanism: max 80 chars
- whatToMonitor: max 60 chars
- asset summary: max 80 chars
- keyPoints: EMPTY ARRAY [] always
- NVDA news/mechanism/whatToMonitor: max 80 chars each
- volatilityRationale: max 80 chars
- upcomingEvents: MAX 2 items, event+relevance max 60 chars each
- bottomLine: MAX 1 sentence, max 100 chars
- noMaterialNews: false

ARTICLES (${articlesJson.length} items):
${JSON.stringify(articlesJson, null, 2)}

Respond with ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "topNews": [
    {
      "headline": "string (Thai)",
      "source": "string",
      "url": "string",
      "publishedAt": "ISO8601 from supplied metadata",
      "affectedAssets": ["array of asset keys from: SCBSP500E, SCBNASDAQ100E, SCBWORLDE, SCBGOLDE, NVDA, XAUUSD"],
      "whatHappened": "string (Thai, facts from source only)",
      "whyItMatters": "string (Thai, hedged language)",
      "transmissionMechanism": "string (Thai, hedged language)",
      "whatToMonitor": "string (Thai)",
      "materiality": "HIGH or MEDIUM"
    }
  ],
  "assets": {
    "SCBSP500E": { "status": "SUPPORTING or UNCERTAINTY or RISK", "summary": "string (Thai)", "keyPoints": ["array of Thai strings"] },
    "SCBNASDAQ100E": { "status": "SUPPORTING or UNCERTAINTY or RISK", "summary": "string (Thai)", "keyPoints": ["array of Thai strings"] },
    "SCBWORLDE": { "status": "SUPPORTING or UNCERTAINTY or RISK", "summary": "string (Thai)", "keyPoints": ["array of Thai strings"] },
    "SCBGOLDE": { "status": "SUPPORTING or UNCERTAINTY or RISK", "summary": "string (Thai)", "keyPoints": ["array of Thai strings"] },
    "NVDA": { "status": "SUPPORTING or UNCERTAINTY or RISK", "news": "string (Thai)", "mechanism": "string (Thai, hedged)", "whatToMonitor": "string (Thai)" },
    "XAUUSD": { "eventRisk": "LOW or MEDIUM or HIGH", "events": [{ "description": "string (Thai)", "ictTime": "HH:MM ICT or ยืนยันเวลาไม่ได้", "whyItMatters": "string (Thai)" }], "volatilityRationale": "string (Thai)", "noSignificantEvents": boolean }
  },
  "upcomingEvents": [
    { "event": "string (Thai)", "ictTime": "string (HH:MM ICT or ยืนยันเวลาไม่ได้)", "relevance": "string (Thai)" }
  ],
  "bottomLine": "string (Thai, 3-5 sentences, no trading advice)",
  "noMaterialNews": false
}`;
}

export function buildNoNewsPrompt(): string {
  return JSON.stringify({
    topNews: [],
    assets: {
      SCBSP500E: { status: 'UNCERTAINTY', summary: 'วันนี้ไม่พบข่าวสำคัญที่มีนัยต่อสินทรัพย์ที่ติดตาม', keyPoints: [] },
      SCBNASDAQ100E: { status: 'UNCERTAINTY', summary: 'วันนี้ไม่พบข่าวสำคัญที่มีนัยต่อสินทรัพย์ที่ติดตาม', keyPoints: [] },
      SCBWORLDE: { status: 'UNCERTAINTY', summary: 'วันนี้ไม่พบข่าวสำคัญที่มีนัยต่อสินทรัพย์ที่ติดตาม', keyPoints: [] },
      SCBGOLDE: { status: 'UNCERTAINTY', summary: 'วันนี้ไม่พบข่าวสำคัญที่มีนัยต่อสินทรัพย์ที่ติดตาม', keyPoints: [] },
      NVDA: { status: 'UNCERTAINTY', news: 'วันนี้ไม่พบข่าวสำคัญเกี่ยวกับ NVDA', mechanism: '', whatToMonitor: '' },
      XAUUSD: { eventRisk: 'LOW', events: [], volatilityRationale: 'วันนี้ไม่พบ scheduled event ที่มีนัยสำคัญ', noSignificantEvents: true },
    },
    upcomingEvents: [],
    bottomLine: 'วันนี้ไม่พบข่าวสำคัญที่มีนัยต่อสินทรัพย์ที่ติดตาม',
    noMaterialNews: true,
  });
}
