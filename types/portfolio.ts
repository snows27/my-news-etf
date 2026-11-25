export type AssetKey =
  | 'SCBSP500E'
  | 'SCBNASDAQ100E'
  | 'SCBWORLDE'
  | 'SCBGOLDE'
  | 'NVDA';

export type Platform = 'SCB_FUND_CLICK' | 'WEBULL';

export interface AssetDefinition {
  key: AssetKey;
  platform: Platform;
  name: string;
  keywords: string[];
  transmissionChains: string[];
}
