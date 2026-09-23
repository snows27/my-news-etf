import type { RawArticle, ScoredArticle, Materiality } from '@/types/news';
import type { AssetKey } from '@/types/portfolio';
import { ASSETS } from './definitions';
import { createHash } from 'crypto';

// Source quality tiers
const HIGH_QUALITY_SOURCES = [
  'reuters', 'bloomberg', 'financial times', 'ft.com', 'wsj', 'wall street journal',
  'cnbc', 'federal reserve', 'federalreserve.gov', 'sec.gov', 'treasury.gov',
  'nvidia', 'tsmc', 'marketwatch',
];

const MEDIUM_QUALITY_SOURCES = [
  'apnews', 'ap news', 'bbc', 'nyt', 'new york times', 'forbes', 'fortune',
  'barrons', 'seeking alpha', 'yahoo finance', 'investopedia',
];

// High-impact event patterns
const HIGH_IMPACT_PATTERNS = [
  /FOMC|federal open market committee/i,
  /rate (decision|hike|cut|pause)/i,
  /CPI|consumer price index|inflation (report|data|print)/i,
  /PCE|personal consumption expenditure/i,
  /NFP|nonfarm payroll|non-farm payroll/i,
  /NVIDIA.{0,50}(earnings|guidance|revenue|beats|misses)/i,
  /NVIDIA.{0,50}(china|export|ban|restriction)/i,
  /US.China.{0,50}(chip|semiconductor|AI|export|ban|tariff)/i,
  /export control.{0,50}(chip|semiconductor|AI)/i,
  /Fed (speech|chair|powell|decision|minutes)/i,
  /GDP (growth|contraction|miss|beat)/i,
  /geopolitical.{0,50}(escalation|crisis|conflict)/i,
  /major tariff|trade war escalat/i,
  /central bank.{0,50}(rate|decision|surprise)/i,
];

const LOW_IMPACT_PATTERNS = [
  /rose \d+(\.\d+)?%|fell \d+(\.\d+)?%|up \d+(\.\d+)?%|down \d+(\.\d+)?%/i,
  /analyst (upgrades|downgrades|target)/i,
  /price target/i,
  /minor (move|pullback|dip|bounce)/i,
  /premarket|after-hours trading/i,
];

function sourceQualityScore(source: string): number {
  const s = source.toLowerCase();
  if (HIGH_QUALITY_SOURCES.some((q) => s.includes(q))) return 30;
  if (MEDIUM_QUALITY_SOURCES.some((q) => s.includes(q))) return 15;
  return 5;
}

function eventImportanceScore(title: string, snippet: string): number {
  const text = `${title} ${snippet}`;
  if (HIGH_IMPACT_PATTERNS.some((p) => p.test(text))) return 40;
  if (LOW_IMPACT_PATTERNS.some((p) => p.test(text))) return -10;
  return 0;
}

function keywordRelevanceScore(title: string, snippet: string, keywords: string[]): number {
  const text = `${title} ${snippet}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) {
      score += title.toLowerCase().includes(kw.toLowerCase()) ? 15 : 5;
    }
  }
  return Math.min(score, 40);
}

function recencyScore(publishedAt: Date): number {
  const hoursAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 4) return 20;
  if (hoursAgo <= 12) return 10;
  if (hoursAgo <= 24) return 0;
  return -10;
}

function findAffectedAssets(title: string, snippet: string): AssetKey[] {
  const text = `${title} ${snippet}`.toLowerCase();
  const affected: AssetKey[] = [];
  for (const asset of ASSETS) {
    const match = asset.keywords.some((kw) => text.includes(kw.toLowerCase()));
    if (match) affected.push(asset.key);
  }
  return [...new Set(affected)];
}

function determineMateriality(score: number): Materiality {
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

export function scoreArticle(article: RawArticle): ScoredArticle {
  const allKeywords = ASSETS.flatMap((a) => a.keywords);
  const kwScore = keywordRelevanceScore(article.title, article.snippet, allKeywords);
  const srcScore = sourceQualityScore(article.source);
  const evtScore = eventImportanceScore(article.title, article.snippet);
  const recScore = recencyScore(article.publishedAt);

  const total = kwScore + srcScore + evtScore + recScore;
  const materiality = determineMateriality(total);
  const affectedAssets = findAffectedAssets(article.title, article.snippet);

  const hash = createHash('sha256')
    .update(`${article.url}|${article.title.toLowerCase().trim()}`)
    .digest('hex');

  return { ...article, materiality, materialityScore: total, affectedAssets, hash };
}

export function filterAndScore(articles: RawArticle[]): ScoredArticle[] {
  return articles
    .map(scoreArticle)
    .filter((a) => a.materiality !== 'LOW' && a.affectedAssets.length > 0)
    .sort((a, b) => b.materialityScore - a.materialityScore);
}
