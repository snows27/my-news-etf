import type { AIBriefResponse, NewsStatus, EventRisk } from '@/types/ai';

const ASSET_KEYS = ['SCBSP500E', 'SCBNASDAQ100E', 'SCBWORLDE', 'SCBGOLDE', 'NVDA', 'XAUUSD'];
const VALID_STATUSES: NewsStatus[] = ['SUPPORTING', 'UNCERTAINTY', 'RISK'];
const VALID_RISKS: EventRisk[] = ['LOW', 'MEDIUM', 'HIGH'];

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateAssetSummary(v: unknown, key: string): string | null {
  if (!isObject(v)) return `${key}: not an object`;
  if (!VALID_STATUSES.includes(v.status as NewsStatus)) return `${key}.status invalid`;
  if (!isString(v.summary)) return `${key}.summary not string`;
  if (!isArray(v.keyPoints)) return `${key}.keyPoints not array`;
  return null;
}

function validateNVDA(v: unknown): string | null {
  if (!isObject(v)) return 'NVDA: not an object';
  if (!VALID_STATUSES.includes(v.status as NewsStatus)) return 'NVDA.status invalid';
  if (!isString(v.news)) return 'NVDA.news not string';
  if (!isString(v.mechanism)) return 'NVDA.mechanism not string';
  if (!isString(v.whatToMonitor)) return 'NVDA.whatToMonitor not string';
  return null;
}

function validateXAUUSD(v: unknown): string | null {
  if (!isObject(v)) return 'XAUUSD: not an object';
  if (!VALID_RISKS.includes(v.eventRisk as EventRisk)) return 'XAUUSD.eventRisk invalid';
  if (!isArray(v.events)) return 'XAUUSD.events not array';
  if (!isString(v.volatilityRationale)) return 'XAUUSD.volatilityRationale not string';
  if (typeof v.noSignificantEvents !== 'boolean') return 'XAUUSD.noSignificantEvents not boolean';
  return null;
}

export function validateAIResponse(raw: unknown): { valid: true; data: AIBriefResponse } | { valid: false; error: string } {
  if (!isObject(raw)) return { valid: false, error: 'response is not an object' };

  if (typeof raw.noMaterialNews !== 'boolean') return { valid: false, error: 'noMaterialNews not boolean' };
  if (!isArray(raw.topNews)) return { valid: false, error: 'topNews not array' };
  if (!isObject(raw.assets)) return { valid: false, error: 'assets not object' };
  if (!isArray(raw.upcomingEvents)) return { valid: false, error: 'upcomingEvents not array' };
  if (!isString(raw.bottomLine)) return { valid: false, error: 'bottomLine not string' };

  const assetKeys = ['SCBSP500E', 'SCBNASDAQ100E', 'SCBWORLDE', 'SCBGOLDE'] as const;
  for (const key of assetKeys) {
    const err = validateAssetSummary(raw.assets[key], key);
    if (err) return { valid: false, error: err };
  }

  const nvdaErr = validateNVDA(raw.assets['NVDA']);
  if (nvdaErr) return { valid: false, error: nvdaErr };

  const xauusdErr = validateXAUUSD(raw.assets['XAUUSD']);
  if (xauusdErr) return { valid: false, error: xauusdErr };

  // Validate topNews items
  for (const [i, item] of (raw.topNews as unknown[]).entries()) {
    if (!isObject(item)) return { valid: false, error: `topNews[${i}] not object` };
    if (!isString(item.headline)) return { valid: false, error: `topNews[${i}].headline not string` };
    if (!isString(item.url)) return { valid: false, error: `topNews[${i}].url not string` };
    if (!isArray(item.affectedAssets)) return { valid: false, error: `topNews[${i}].affectedAssets not array` };
    const invalid = (item.affectedAssets as unknown[]).filter((a) => !ASSET_KEYS.includes(a as string));
    if (invalid.length > 0) return { valid: false, error: `topNews[${i}].affectedAssets contains invalid keys: ${invalid}` };
  }

  return { valid: true, data: raw as unknown as AIBriefResponse };
}

export function parseAIResponse(text: string): { valid: true; data: AIBriefResponse } | { valid: false; error: string } {
  // Strategy 1: direct parse
  try {
    return validateAIResponse(JSON.parse(text.trim()));
  } catch { /* continue */ }

  // Strategy 2: strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceStripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  try {
    return validateAIResponse(JSON.parse(fenceStripped));
  } catch { /* continue */ }

  // Strategy 3: extract first { ... } block (handles extra text before/after JSON)
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const extracted = text.slice(firstBrace, lastBrace + 1);
    try {
      return validateAIResponse(JSON.parse(extracted));
    } catch { /* continue */ }
  }

  return { valid: false, error: 'JSON parse failure' };
}
