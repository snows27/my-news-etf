import type { AssetDefinition } from '@/types/portfolio';

export const ASSETS: AssetDefinition[] = [
  {
    key: 'SCBSP500E',
    platform: 'SCB_FUND_CLICK',
    name: 'SCB S&P500 Equity',
    keywords: [
      'S&P 500', 'S&P500', 'SPX', 'US equities', 'US stocks', 'Federal Reserve', 'Fed',
      'US economy', 'US GDP', 'US interest rates', 'US large-cap', 'Wall Street',
      'US CPI', 'US inflation', 'FOMC', 'US labor market', 'US earnings',
      // US macro releases
      'Core CPI', 'PCE', 'Core PCE', 'NFP', 'nonfarm payrolls', 'jobless claims', 'unemployment',
      'ISM', 'PMI', 'Treasury yields', '10-year yield', 'Fed minutes', 'Fed speech',
      'rate cut', 'rate hike', 'tariff', 'trade war',
    ],
    transmissionChains: [
      'Fed → interest rates → Treasury yields → US equities',
      'CPI → inflation expectations → Fed policy → S&P500',
      'US-China tariffs → corporate earnings → S&P500',
    ],
  },
  {
    key: 'SCBNASDAQ100E',
    platform: 'SCB_FUND_CLICK',
    name: 'SCB Nasdaq-100 Equity',
    keywords: [
      'Nasdaq', 'NASDAQ', 'QQQ', 'technology stocks', 'Big Tech', 'AI',
      'artificial intelligence', 'semiconductor', 'NVDA', 'NVIDIA', 'AMD', 'AVGO', 'Broadcom',
      'TSM', 'TSMC', 'Apple', 'Microsoft', 'Alphabet', 'Google', 'Meta', 'Amazon',
      'data center', 'cloud computing', 'interest rates tech', 'hyperscaler',
      'AI chip', 'GPU', 'US-China tech', 'export controls', 'chip ban',
    ],
    transmissionChains: [
      'AI demand surge → semiconductor stocks → Nasdaq-100',
      'US-China export controls → NVDA revenue → Nasdaq-100',
      'Fed rate cuts → growth stocks → Nasdaq-100',
      'Hyperscaler capex → AI chip demand → Nasdaq-100',
    ],
  },
  {
    key: 'SCBWORLDE',
    platform: 'SCB_FUND_CLICK',
    name: 'SCB World Equity',
    keywords: [
      'global equities', 'world stocks', 'international markets', 'European markets',
      'Japan stocks', 'Nikkei', 'China stocks', 'Shanghai', 'Hang Seng',
      'emerging markets', 'global macro', 'global economy', 'IMF', 'World Bank',
      'ECB', 'BOJ', 'Bank of Japan', 'PBOC', 'global trade', 'geopolitical risk',
      'dollar index', 'DXY', 'global growth', 'recession',
    ],
    transmissionChains: [
      'Global macro deterioration → broad equity sell-off → World fund',
      'China economic data → emerging markets → World equities',
      'USD strength → international returns for USD-based funds',
    ],
  },
  {
    key: 'SCBGOLDE',
    platform: 'SCB_FUND_CLICK',
    name: 'SCB Gold Equity',
    keywords: [
      'gold', 'XAUUSD', 'XAU', 'gold price', 'Fed', 'Federal Reserve',
      'US dollar', 'DXY', 'Treasury yields', 'inflation', 'CPI', 'PCE',
      'real interest rates', 'geopolitical', 'safe haven', 'central bank gold',
      'gold demand', 'gold reserves', 'gold ETF', 'GLD',
    ],
    transmissionChains: [
      'Fed rate cut → real yields fall → USD weakens → Gold rises',
      'Geopolitical crisis → safe-haven demand → Gold',
      'Central bank gold buying → demand increase → Gold price',
    ],
  },
  {
    key: 'NVDA',
    platform: 'WEBULL',
    name: 'NVIDIA Corporation',
    keywords: [
      'NVIDIA', 'NVDA', 'Nvidia', 'AI chip', 'GPU', 'H100', 'H200', 'Blackwell',
      'data center', 'AI accelerator', 'hyperscaler', 'cloud AI', 'inference',
      'training compute', 'CUDA', 'semiconductor', 'chip export', 'China export ban',
      'US-China chip', 'export controls', 'AI demand', 'TSMC', 'CoWoS', 'HBM',
      'AMD', 'Broadcom', 'earnings', 'guidance', 'revenue forecast',
      'rare earth', 'critical minerals', 'supply chain',
    ],
    transmissionChains: [
      'US-China export controls → NVDA China revenue → earnings → stock',
      'Hyperscaler AI capex increase → NVDA data center demand → revenue',
      'TSMC capacity expansion → NVDA chip supply → revenue growth',
    ],
  },
];

export function getAssetByKey(key: string): AssetDefinition | undefined {
  return ASSETS.find((a) => a.key === key);
}

export const ALL_KEYWORDS: string[] = [...new Set(ASSETS.flatMap((a) => a.keywords))];
