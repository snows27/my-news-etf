import type { ScoredArticle } from '@/types/news';
import type { AssetKey } from '@/types/portfolio';
import { ASSETS } from '@/lib/portfolio/definitions';

export interface ImpactMapping {
  article: ScoredArticle;
  assetMappings: {
    asset: AssetKey;
    assetName: string;
    transmissionChains: string[];
    directness: 'DIRECT' | 'INDIRECT';
  }[];
}

function isDirectImpact(title: string, snippet: string, assetKey: string): boolean {
  const text = `${title} ${snippet}`.toLowerCase();
  const directPatterns: Record<string, RegExp[]> = {
    SCBSP500E: [/S&P\s*500|SPX|US equities|US stocks/i],
    SCBNASDAQ100E: [/NASDAQ|nasdaq-100|QQQ|big tech.*stock|tech.*sell.?off/i],
    SCBWORLDE: [/global equit|world stock|international market|emerging market/i],
    SCBGOLDE: [/gold price|gold (rises|falls|drops|surges)|XAU|XAUUSD.*gold/i],
    NVDA: [/NVIDIA|NVDA|nvidia/i],
    XAUUSD: [/XAUUSD|gold.*forex|forex.*gold|spot gold/i],
  };

  const patterns = directPatterns[assetKey] ?? [];
  return patterns.some((p) => p.test(text));
}

export function mapImpacts(articles: ScoredArticle[]): ImpactMapping[] {
  return articles.map((article) => {
    const assetMappings = article.affectedAssets.map((assetKey) => {
      const def = ASSETS.find((a) => a.key === assetKey);
      const directness: 'DIRECT' | 'INDIRECT' = isDirectImpact(article.title, article.snippet, assetKey)
        ? 'DIRECT'
        : 'INDIRECT';
      return {
        asset: assetKey as AssetKey,
        assetName: def?.name ?? assetKey,
        transmissionChains: def?.transmissionChains ?? [],
        directness,
      };
    });

    return { article, assetMappings };
  });
}
