export interface NewsSource {
  name: string;
  url: string;
  priority: 'HIGH' | 'MEDIUM';
  optional?: boolean;
}

// Production RSS sources — no API key required
export const RSS_SOURCES: NewsSource[] = [
  // US Economic / Federal Reserve
  { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml', priority: 'HIGH' },
  { name: 'US Treasury', url: 'https://home.treasury.gov/system/files/index-feeds/treasury_press_releases.xml', priority: 'HIGH' },

  // Financial News
  { name: 'CNBC Finance', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', priority: 'HIGH' },
  { name: 'CNBC Economy', url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html', priority: 'HIGH' },
  { name: 'CNBC Technology', url: 'https://www.cnbc.com/id/19854910/device/rss/rss.html', priority: 'HIGH' },
  { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', priority: 'HIGH' },
  { name: 'Reuters Technology', url: 'https://feeds.reuters.com/reuters/technologyNews', priority: 'HIGH' },
  { name: 'MarketWatch Top Stories', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', priority: 'HIGH' },

  // SEC / Regulatory
  { name: 'SEC Press Releases', url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=8-K&dateb=&owner=include&count=10&search_text=&output=atom', priority: 'MEDIUM' },

  // NVIDIA Official
  { name: 'NVIDIA News', url: 'https://nvidianews.nvidia.com/feeds/latest', priority: 'HIGH' },
  { name: 'NVIDIA Investor Relations', url: 'https://investor.nvidia.com/rss/news_releases.aspx?item=rss', priority: 'HIGH' },

  // General financial
  { name: 'Yahoo Finance - World Markets', url: 'https://finance.yahoo.com/rss/topstories', priority: 'MEDIUM' },
  { name: 'Investing.com Gold', url: 'https://www.investing.com/rss/news_1.rss', priority: 'MEDIUM' },
  { name: 'Kitco Gold News', url: 'https://www.kitco.com/rss/News-Commentaries/', priority: 'MEDIUM' },
];

// Optional — development/testing only. NOT required for production.
export const NEWSAPI_SOURCE_NAME = 'NewsAPI (optional)';
