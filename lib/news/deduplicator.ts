import { createHash } from 'crypto';
import type { RawArticle } from '@/types/news';

function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/[?#].*$/, '')
    .replace(/\/$/, '');
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleHash(title: string): string {
  return createHash('sha256').update(normalizeTitle(title)).digest('hex');
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(' '));
  const setB = new Set(b.split(' '));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

const SIMILARITY_THRESHOLD = 0.75;

export function deduplicate(articles: RawArticle[]): RawArticle[] {
  const seenUrls = new Set<string>();
  const seenHashes = new Set<string>();
  const seenNormalizedTitles: string[] = [];
  const result: RawArticle[] = [];

  for (const article of articles) {
    const normUrl = normalizeUrl(article.url);
    const hash = titleHash(article.title);
    const normTitle = normalizeTitle(article.title);

    if (seenUrls.has(normUrl)) continue;
    if (seenHashes.has(hash)) continue;

    // Near-duplicate check via title similarity
    const isNearDup = seenNormalizedTitles.some(
      (t) => jaccardSimilarity(t, normTitle) >= SIMILARITY_THRESHOLD
    );
    if (isNearDup) continue;

    seenUrls.add(normUrl);
    seenHashes.add(hash);
    seenNormalizedTitles.push(normTitle);
    result.push(article);
  }

  return result;
}
