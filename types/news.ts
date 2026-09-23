export type Materiality = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RawArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  snippet: string;
}

export interface ScoredArticle extends RawArticle {
  materiality: Materiality;
  materialityScore: number;
  affectedAssets: string[];
  hash: string;
}
