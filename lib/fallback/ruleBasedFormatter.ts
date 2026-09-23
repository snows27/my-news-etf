import type { AIBriefResponse, AssetSummary, NVDASummary, XAUUSDRisk } from '@/types/ai';
import type { ScoredArticle } from '@/types/news';
import type { AssetKey } from '@/types/portfolio';

function makeAssetSummary(articles: ScoredArticle[], assetKey: AssetKey): AssetSummary {
  const relevant = articles.filter((a) => a.affectedAssets.includes(assetKey));
  if (relevant.length === 0) {
    return { status: 'UNCERTAINTY', summary: 'ไม่พบข่าวสำคัญที่เกี่ยวข้องในรอบนี้', keyPoints: [] };
  }
  const status = relevant.some((a) => a.materiality === 'HIGH') ? 'RISK' : 'UNCERTAINTY';
  const keyPoints = relevant.slice(0, 3).map((a) => `${a.source}: ${a.title}`);
  return { status, summary: `พบข่าวที่เกี่ยวข้อง ${relevant.length} รายการ`, keyPoints };
}

export function buildFallbackResponse(articles: ScoredArticle[]): AIBriefResponse {
  const topNews = articles.slice(0, 5).map((a) => ({
    headline: a.title,
    source: a.source,
    url: a.url,
    publishedAt: a.publishedAt.toISOString(),
    affectedAssets: a.affectedAssets as AssetKey[],
    whatHappened: a.snippet || a.title,
    whyItMatters: 'ข้อมูลยังไม่เพียงพอจากแหล่งข่าวที่ตรวจสอบ',
    transmissionMechanism: 'ไม่สามารถวิเคราะห์กลไกได้ในโหมด fallback',
    whatToMonitor: 'ติดตามแหล่งข่าวต้นทางโดยตรง',
    materiality: a.materiality as 'HIGH' | 'MEDIUM',
  }));

  const xauusdArticles = articles.filter((a) => a.affectedAssets.includes('XAUUSD'));
  const hasHighXAU = xauusdArticles.some((a) => a.materiality === 'HIGH');
  const xauusd: XAUUSDRisk = {
    eventRisk: hasHighXAU ? 'MEDIUM' : 'LOW',
    events: [],
    volatilityRationale: hasHighXAU
      ? 'พบข่าวที่อาจส่งผลต่อ XAUUSD — ไม่สามารถวิเคราะห์รายละเอียดในโหมด fallback'
      : 'ไม่พบ event ที่มีนัยสำคัญในรอบนี้',
    noSignificantEvents: !hasHighXAU,
  };

  const nvdaArticles = articles.filter((a) => a.affectedAssets.includes('NVDA'));
  const nvda: NVDASummary = {
    status: nvdaArticles.length > 0 ? 'UNCERTAINTY' : 'UNCERTAINTY',
    news: nvdaArticles.length > 0 ? `พบข่าวที่เกี่ยวข้อง ${nvdaArticles.length} รายการ` : 'ไม่พบข่าวสำคัญเกี่ยวกับ NVDA',
    mechanism: 'ไม่สามารถวิเคราะห์กลไกได้ในโหมด fallback',
    whatToMonitor: 'ติดตามแหล่งข่าวต้นทางโดยตรง',
  };

  return {
    topNews,
    assets: {
      SCBSP500E: makeAssetSummary(articles, 'SCBSP500E'),
      SCBNASDAQ100E: makeAssetSummary(articles, 'SCBNASDAQ100E'),
      SCBWORLDE: makeAssetSummary(articles, 'SCBWORLDE'),
      SCBGOLDE: makeAssetSummary(articles, 'SCBGOLDE'),
      NVDA: nvda,
      XAUUSD: xauusd,
    },
    upcomingEvents: [],
    bottomLine: 'ระบบอยู่ในโหมด fallback เนื่องจาก AI analysis ไม่สามารถใช้งานได้ในรอบนี้ ข้อมูลที่แสดงเป็นการสรุปจากพาดหัวข่าวเท่านั้น กรุณาตรวจสอบแหล่งข่าวต้นทางโดยตรง',
    noMaterialNews: articles.length === 0,
  };
}
