import Parser from 'rss-parser';
import type { RawArticle } from '@/types/news';
import { RSS_SOURCES } from './sources';
import { logger } from '@/lib/utils/logger';
import { isWithinHours } from '@/lib/utils/timezone';

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [['media:content', 'mediaContent'], ['content:encoded', 'contentEncoded']],
  },
});

interface FetchResult {
  articles: RawArticle[];
  failedSources: string[];
  successfulSources: string[];
}

async function fetchSingleSource(source: { name: string; url: string }): Promise<RawArticle[]> {
  const feed = await parser.parseURL(source.url);
  const articles: RawArticle[] = [];

  for (const item of feed.items ?? []) {
    const title = item.title?.trim();
    const url = item.link?.trim() ?? item.guid?.trim();
    if (!title || !url) continue;

    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
    if (!isWithinHours(pubDate, 36)) continue;

    const itemAny = item as unknown as Record<string, string | undefined>;
    const snippet = (
      item.contentSnippet ??
      item.summary ??
      itemAny['contentEncoded'] ??
      ''
    ).replace(/<[^>]+>/g, '').trim().slice(0, 500);

    articles.push({
      title,
      url,
      source: source.name,
      publishedAt: pubDate,
      snippet,
    });
  }

  return articles;
}

// Optional NewsAPI integration — not required for production
async function fetchNewsApi(apiKey: string): Promise<RawArticle[]> {
  const queries = [
    'NVIDIA earnings OR NVDA OR AI chips OR semiconductor export',
    'Federal Reserve OR FOMC OR CPI OR PCE OR NFP OR gold',
    'S&P 500 OR NASDAQ OR US economy OR inflation',
  ];

  const articles: RawArticle[] = [];
  const baseUrl = 'https://newsapi.org/v2/everything';
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  for (const q of queries) {
    const url = `${baseUrl}?q=${encodeURIComponent(q)}&from=${yesterday}&sortBy=relevancy&pageSize=10&language=en&apiKey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = (await res.json()) as { articles?: { title: string; url: string; source: { name: string }; publishedAt: string; description?: string }[] };
    for (const art of data.articles ?? []) {
      if (!art.title || !art.url) continue;
      articles.push({
        title: art.title,
        url: art.url,
        source: `NewsAPI/${art.source?.name ?? 'unknown'}`,
        publishedAt: new Date(art.publishedAt),
        snippet: art.description ?? '',
      });
    }
  }

  return articles;
}

export async function fetchAllNews(newsApiKey: string | null = null): Promise<FetchResult> {
  const failedSources: string[] = [];
  const successfulSources: string[] = [];
  const allArticles: RawArticle[] = [];

  // Fetch each RSS source independently — one failure must not stop others
  const tasks = RSS_SOURCES.map(async (source) => {
    try {
      const articles = await fetchSingleSource(source);
      return { source: source.name, articles, error: null };
    } catch (err) {
      return {
        source: source.name,
        articles: [] as RawArticle[],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  const results = await Promise.allSettled(tasks);

  for (const result of results) {
    if (result.status === 'rejected') {
      // Promise.allSettled shouldn't reject since we catch internally, but handle anyway
      logger.warn('[news] unexpected fetch rejection', { error: String(result.reason) });
      continue;
    }
    const { source, articles, error } = result.value;
    if (error) {
      logger.warn('[news] source failed', { source, error });
      failedSources.push(source);
    } else {
      logger.info(`[news] source ok`, { source, count: articles.length });
      successfulSources.push(source);
      allArticles.push(...articles);
    }
  }

  // Optional NewsAPI — development/testing supplement
  if (newsApiKey) {
    try {
      const newsApiArticles = await fetchNewsApi(newsApiKey);
      logger.info('[news] newsapi ok', { count: newsApiArticles.length });
      allArticles.push(...newsApiArticles);
    } catch (err) {
      logger.warn('[news] newsapi failed (optional)', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  logger.info('[news] articles fetched', { total: allArticles.length, failedSources: failedSources.length });
  return { articles: allArticles, failedSources, successfulSources };
}
