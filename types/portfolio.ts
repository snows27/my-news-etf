export type AssetKey =
  | 'SCBSP500E'
  | 'SCBNASDAQ100E'
  | 'SCBWORLDE'
  | 'SCBGOLDE'
  | 'NVDA'
  | 'XAUUSD';

export type Platform = 'SCB_FUND_CLICK' | 'WEBULL' | 'EA_BOT';

export interface AssetDefinition {
  key: AssetKey;
  platform: Platform;
  name: string;
  keywords: string[];
  transmissionChains: string[];
}
