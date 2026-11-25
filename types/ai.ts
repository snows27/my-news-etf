import type { AssetKey } from './portfolio';

export type NewsStatus = 'SUPPORTING' | 'UNCERTAINTY' | 'RISK';

export interface TopNewsItem {
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
  affectedAssets: AssetKey[];
  whatHappened: string;
  whyItMatters: string;
  transmissionMechanism: string;
  whatToMonitor: string;
  materiality: 'HIGH' | 'MEDIUM';
}

export interface AssetSummary {
  status: NewsStatus;
  summary: string;
  keyPoints: string[];
}

export interface NVDASummary {
  status: NewsStatus;
  news: string;
  mechanism: string;
  whatToMonitor: string;
}

export interface UpcomingEvent {
  event: string;
  ictTime: string;
  relevance: string;
}

export interface AIBriefResponse {
  topNews: TopNewsItem[];
  assets: {
    SCBSP500E: AssetSummary;
    SCBNASDAQ100E: AssetSummary;
    SCBWORLDE: AssetSummary;
    SCBGOLDE: AssetSummary;
    NVDA: NVDASummary;
  };
  upcomingEvents: UpcomingEvent[];
  bottomLine: string;
  noMaterialNews: boolean;
}
