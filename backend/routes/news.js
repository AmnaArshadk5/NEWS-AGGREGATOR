import express from 'express';
import { mockNews } from '../mockData.js';

const PROXY_BASE = 'http://localhost:5000/api/proxy/image?url=';
const proxyImg = (url) => url ? `${PROXY_BASE}${encodeURIComponent(url)}` : '';

const router = express.Router();

// ── Cache: 5-second TTL to ensure fresh multi-page results ──
const cache = {};
const CACHE_TTL_MS = 5 * 1000;

const NEWSAPI_CATEGORIES = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];

// GNews uses different category names
const GNEWS_CATEGORY_MAP = {
  business: 'business',
  entertainment: 'entertainment',
  general: 'general',
  health: 'health',
  science: 'science',
  sports: 'sports',
  technology: 'technology',
};

function getCached(key) {
  const c = cache[key];
  if (c && Date.now() - c.ts < CACHE_TTL_MS) return c.data;
  return null;
}
function setCache(key, data) {
  cache[key] = { data, ts: Date.now() };
}

// ── Filters & Sort ──
function filterByYear(articles, year) {
  if (!year) return articles;
  const y = parseInt(year, 10);
  return articles.filter(art => {
    const d = art.publishedAt || art.published_at;
    return d && new Date(d).getFullYear() === y;
  });
}

function filterByTimeframe(articles, timeframe) {
  if (!timeframe || timeframe === 'all') return articles;
  const now = Date.now();
  const cuts = { '24h': 864e5, 'week': 6048e5, 'month': 2592e6 };
  const cutoff = cuts[timeframe];
  if (!cutoff) return articles;
  return articles.filter(art => {
    const d = art.publishedAt || art.published_at;
    return d && new Date(d).getTime() >= now - cutoff;
  });
}

function sortArticles(articles, sortBy) {
  const sorted = [...articles];
  sorted.sort((a, b) => {
    const ta = new Date(a.publishedAt || a.published_at || 0).getTime();
    const tb = new Date(b.publishedAt || b.published_at || 0).getTime();
    return sortBy === 'oldest' ? ta - tb : tb - ta;
  });
  return sorted;
}

// ── Normalise article shape ──
function normaliseNewsAPI(art) {
  return {
    title: art.title || 'Untitled',
    description: art.description || '',
    url: art.url || '',
    urlToImage: proxyImg(art.urlToImage || art.image || ''),
    publishedAt: art.publishedAt || '',
    source: { name: art.source?.name || 'Unknown' },
    author: art.author || '',
    content: art.content || '',
  };
}

function normaliseGNews(art) {
  return {
    title: art.title || 'Untitled',
    description: art.description || '',
    url: art.url || '',
    urlToImage: proxyImg(art.image || ''),
    publishedAt: art.publishedAt || '',
    source: { name: art.source?.name || 'Unknown' },
    author: art.source?.name || '',
    content: art.content || '',
  };
}

// ── Try NewsAPI ──
async function fetchFromNewsAPI(apiKey, category, q, apiSort) {
  let url;
  if (q) {
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=${apiSort}&pageSize=30&apiKey=${apiKey}`;
  } else if (NEWSAPI_CATEGORIES.includes(category)) {
    url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=30&apiKey=${apiKey}`;
  } else {
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(category)}&language=en&sortBy=${apiSort}&pageSize=30&apiKey=${apiKey}`;
  }

  const cached = getCached(`newsapi:${url}`);
  if (cached) { console.log('[NewsAPI] Serving from cache'); return cached; }

  console.log('[NewsAPI] Fetching:', url.replace(apiKey, '***'));
  const res = await fetch(url);
  const data = await res.json();

  if (data.status === 'ok' && data.articles?.length) {
    const articles = data.articles.map(normaliseNewsAPI).filter(a => a.url && a.title !== '[Removed]');
    setCache(`newsapi:${url}`, articles);
    return articles;
  }
  console.warn('[NewsAPI] Failed:', data.message || data.status);
  return null;
}

// ── Try GNews ──
async function fetchFromGNews(apiKey, category, q) {
  let url;
  if (q) {
    url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=30&sortby=publishedAt&apikey=${apiKey}`;
  } else {
    const gCat = GNEWS_CATEGORY_MAP[category] || 'general';
    url = `https://gnews.io/api/v4/top-headlines?category=${gCat}&lang=en&max=30&apikey=${apiKey}`;
  }

  const cached = getCached(`gnews:${url}`);
  if (cached) { console.log('[GNews] Serving from cache'); return cached; }

  console.log('[GNews] Fetching:', url.replace(apiKey, '***'));
  const res = await fetch(url);
  const data = await res.json();

  if (data.articles?.length) {
    const articles = data.articles.map(normaliseGNews).filter(a => a.url && a.title);
    setCache(`gnews:${url}`, articles);
    return articles;
  }
  console.warn('[GNews] Failed:', data.errors || data.message || JSON.stringify(data).slice(0, 200));
  return null;
}

// ── Try NewsData.io ──
const NEWSDATA_CATEGORY_MAP = {
  business: 'business', entertainment: 'entertainment', general: 'top',
  health: 'health', science: 'science', sports: 'sports', technology: 'technology',
};

function normaliseNewsData(art) {
  return {
    title: art.title || 'Untitled',
    description: art.description || art.content?.slice(0, 200) || '',
    url: art.link || '',
    urlToImage: proxyImg(art.image_url || ''),
    publishedAt: art.pubDate || '',
    source: { name: art.source_name || art.source_id || 'Unknown' },
    author: art.creator?.[0] || art.source_name || '',
    content: art.content || '',
  };
}

async function fetchFromNewsData(apiKey, category, q, country) {
  let baseUrl;
  const countryParam = country ? `&country=${country}` : '';

  if (q) {
    baseUrl = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=en${countryParam}`;
  } else if (NEWSDATA_CATEGORY_MAP[category]) {
    baseUrl = `https://newsdata.io/api/1/latest?apikey=${apiKey}&category=${NEWSDATA_CATEGORY_MAP[category]}&language=en${countryParam}`;
  } else {
    baseUrl = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=${encodeURIComponent(category)}&language=en${countryParam}`;
  }

  const cached = getCached(`newsdata:${baseUrl}`);
  if (cached) { console.log('[NewsData] Serving from cache'); return cached; }

  console.log('[NewsData] Fetching page 1:', baseUrl.replace(apiKey, '***'));
  try {
    const res1 = await fetch(baseUrl);
    const data1 = await res1.json();

    if (data1.status === 'success' && data1.results?.length) {
      let articles = data1.results.map(normaliseNewsData).filter(a => a.url && a.title);

      // Fetch page 2 if nextPage token exists to expand articles per category
      if (data1.nextPage) {
        try {
          const page2Url = `${baseUrl}&page=${data1.nextPage}`;
          console.log('[NewsData] Fetching page 2 for more articles...');
          const res2 = await fetch(page2Url);
          const data2 = await res2.json();
          if (data2.status === 'success' && data2.results?.length) {
            const page2Articles = data2.results.map(normaliseNewsData).filter(a => a.url && a.title);
            articles = [...articles, ...page2Articles];
          }
        } catch (p2Err) {
          console.warn('[NewsData] Page 2 fetch error:', p2Err.message);
        }
      }

      setCache(`newsdata:${baseUrl}`, articles);
      return articles;
    }
  } catch (err) {
    console.error('[NewsData] Error:', err.message);
  }
  return null;
}

// ── Mock fallback ──
function getMockArticles(category, q) {
  const all = Object.values(mockNews).flat();
  let articles = [];

  if (!category || category === 'all') {
    articles = [...all];
  } else if (mockNews[category]) {
    articles = [...mockNews[category]];
  } else {
    articles = all.filter(art =>
      art.title?.toLowerCase().includes(category) ||
      art.description?.toLowerCase().includes(category)
    );
    if (articles.length === 0) {
      articles = [...(mockNews['general'] || [])];
    }
  }

  if (q) {
    const qLower = q.toLowerCase();
    articles = articles.filter(art =>
      art.title?.toLowerCase().includes(qLower) ||
      art.description?.toLowerCase().includes(qLower) ||
      art.source?.name?.toLowerCase().includes(qLower) ||
      art.author?.toLowerCase().includes(qLower)
    );
  }

  // Deduplicate by title & url
  const unique = Array.from(new Map(articles.map(item => [item.title + (item.url || ''), item])).values());
  return unique;
}

// ── Direct Live Publisher RSS Feeds Map ──
const DIRECT_FEEDS = {
  technology: [
    { url: 'https://techcrunch.com/feed/', source: 'TechCrunch' },
    { url: 'https://www.wired.com/feed/rss', source: 'Wired' },
    { url: 'http://feeds.arstechnica.com/arstechnica/index', source: 'Ars Technica' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', source: 'The New York Times' },
  ],
  business: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', source: 'The New York Times' },
    { url: 'https://techcrunch.com/category/startups/feed/', source: 'TechCrunch Startups' },
  ],
  science: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml', source: 'The New York Times' },
    { url: 'https://www.wired.com/feed/category/science/latest/rss', source: 'Wired Science' },
  ],
  entertainment: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml', source: 'The New York Times' },
  ],
  health: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml', source: 'The New York Times' },
  ],
  sports: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml', source: 'The New York Times' },
  ],
  food: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/DiningandWine.xml', source: 'The New York Times Dining' },
  ],
  travel: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Travel.xml', source: 'The New York Times Travel' },
  ],
  gaming: [
    { url: 'https://www.polygon.com/rss/index.xml', source: 'Polygon' },
    { url: 'https://feeds.ign.com/ign/all', source: 'IGN' },
  ],
  fashion: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/FashionandStyle.xml', source: 'The New York Times Style' },
  ],
  education: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Education.xml', source: 'The New York Times Education' },
  ],
  crypto: [
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
  ],
  gb: [
    { url: 'http://feeds.bbci.co.uk/news/uk/rss.xml', source: 'BBC News UK' },
    { url: 'https://www.theguardian.com/uk/rss', source: 'The Guardian' },
    { url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', source: 'BBC Tech' },
  ],
  in: [
    { url: 'https://feeds.feedburner.com/ndtvnews-india-news', source: 'NDTV News India' },
    { url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', source: 'Times of India' },
    { url: 'https://feeds.feedburner.com/ndtvnews-technology-news', source: 'NDTV Tech' },
  ],
  ca: [
    { url: 'https://www.cbc.ca/cbbc/rss/lineup/topstories', source: 'CBC News Canada' },
  ],
  au: [
    { url: 'https://www.abc.net.au/news/feed/51120/rss.xml', source: 'ABC News Australia' },
  ],
  us: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', source: 'The New York Times' },
    { url: 'https://feeds.npr.org/1001/rss.xml', source: 'NPR News' },
  ],
  de: [
    { url: 'https://rss.dw.com/xml/rss-de-all', source: 'Deutsche Welle' },
  ],
  fr: [
    { url: 'https://www.lemonde.fr/rss/une.xml', source: 'Le Monde' },
  ],
  jp: [
    { url: 'https://www.japantimes.co.jp/feed', source: 'The Japan Times' },
  ]
};

async function fetchFromDirectPublisherFeeds(category, q, country) {
  let targetFeeds = [];
  const cLower = (country || '').toLowerCase();
  const catLower = (category || 'general').toLowerCase();

  if (cLower && DIRECT_FEEDS[cLower]) {
    targetFeeds = [...DIRECT_FEEDS[cLower]];
  } else if (DIRECT_FEEDS[catLower]) {
    targetFeeds = [...DIRECT_FEEDS[catLower]];
  } else {
    // For custom admin-created categories not explicitly mapped, let Google News RSS handle it dynamically
    return null;
  }

  console.log(`[DirectFeeds] Fetching ${targetFeeds.length} direct feeds for category: ${catLower}, country: ${cLower}`);

  let articles = [];
  for (const feedObj of targetFeeds) {
    try {
      const res = await fetch(feedObj.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const xml = await res.text();

      const itemRegex = /<item>[\s\S]*?<\/item>/g;
      const matches = xml.match(itemRegex) || [];

      for (const itemXml of matches.slice(0, 15)) {
        const titleMatch = itemXml.match(/<title>(.*?)<\/title>/);
        const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
        const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/) || itemXml.match(/<dc:date>(.*?)<\/dc:date>/);
        const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
        const creatorMatch = itemXml.match(/<dc:creator>(.*?)<\/dc:creator>/) || itemXml.match(/<author>(.*?)<\/author>/);
        const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i) || itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);

        if (titleMatch && linkMatch) {
          const rawTitle = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
          let directUrl = linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          if (directUrl.includes('<')) directUrl = directUrl.replace(/<[^>]+>/g, '').trim();

          let realDesc = '';
          if (descMatch) {
            realDesc = descMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
              .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
              .replace(/<[^>]+>/g, '')
              .replace(/\s+/g, ' ')
              .trim();
          }
          if (!realDesc || realDesc.length < 15) {
            realDesc = `Real-time story "${rawTitle}" published by ${feedObj.source}.`;
          }

          const authorName = creatorMatch ? creatorMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : feedObj.source;
          const imageUrl = mediaMatch ? mediaMatch[1] : 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800';

          articles.push({
            title: rawTitle,
            description: realDesc,
            url: directUrl,
            urlToImage: imageUrl,
            publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
            source: { name: feedObj.source },
            author: authorName,
          });
        }
      }
    } catch (err) {
      console.warn(`[DirectFeeds] Error fetching ${feedObj.source}:`, err.message);
    }
  }

  return articles.length > 0 ? articles : null;
}

// ── Live Google News RSS Parser with Country Support ──
async function fetchFromGoogleNewsRSS(category, q, country) {
  try {
    const queryTerm = q || category || 'general';
    const countryCode = country ? country.toUpperCase() : 'US';
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(queryTerm)}&hl=en-${countryCode}&gl=${countryCode}&ceid=${countryCode}:en`;
    console.log(`[GoogleNewsRSS] Fetching live RSS feed for: ${queryTerm} [Country: ${countryCode}]`);

    const res = await fetch(rssUrl);
    if (!res.ok) return null;
    const xml = await res.text();

    const items = [];
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    const matches = xml.match(itemRegex) || [];

    for (const itemXml of matches.slice(0, 30)) {
      const titleMatch = itemXml.match(/<title>(.*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/);
      const sourceUrlMatch = itemXml.match(/<source\s+url=["']([^"']+)["']/i);
      const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);

      if (titleMatch && linkMatch) {
        const sourceName = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Google News';
        const targetPublisherUrl = (sourceUrlMatch && sourceUrlMatch[1].startsWith('http')) ? sourceUrlMatch[1] : linkMatch[1];
        let cleanTitle = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
        if (cleanTitle.endsWith(` - ${sourceName}`)) {
          cleanTitle = cleanTitle.substring(0, cleanTitle.lastIndexOf(` - ${sourceName}`));
        }

        let realDesc = '';
        if (descMatch) {
          realDesc = descMatch[1]
            .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
        if (!realDesc || realDesc.length < 15) {
          realDesc = `Breaking live story on "${cleanTitle}" reported by ${sourceName}. Read full article for complete coverage.`;
        }

        items.push({
          title: cleanTitle,
          description: realDesc,
          url: targetPublisherUrl,
          urlToImage: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800`,
          publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
          source: { name: sourceName },
          author: sourceName
        });
      }
    }
    return items.length > 0 ? items : null;
  } catch (err) {
    console.error('[GoogleNewsRSS] Error:', err.message);
    return null;
  }
}

// ── GET /api/news ──
router.get('/', async (req, res) => {
  const newsApiKey = process.env.NEWS_API_KEY;
  const gNewsApiKey = process.env.GNEWS_API_KEY;

  const category = (req.query.category || 'general').toLowerCase().trim();
  const q = req.query.q ? req.query.q.trim().toLowerCase() : '';
  const sortBy = req.query.sortBy || 'newest';
  const year = req.query.year || '';
  const timeframe = req.query.timeframe || 'all';
  const country = req.query.country || '';
  const apiSort = 'publishedAt';

  const reqCacheKey = `news:${category}:${q}:${sortBy}:${year}:${timeframe}:${country}`;
  const cachedNews = getCached(reqCacheKey);
  if (cachedNews) {
    return res.json(cachedNews);
  }

  let articles = null;

  // 1) Primary: Try Direct Publisher RSS Feeds for 100% direct article URLs and country filtering
  try {
    articles = await fetchFromDirectPublisherFeeds(category, q, country);
  } catch (err) {
    console.error('[DirectFeeds] Error:', err.message);
  }

  // 2) Try NewsAPI if Direct Feeds returned empty
  if ((!articles || articles.length === 0) && newsApiKey) {
    try { articles = await fetchFromNewsAPI(newsApiKey, category, q, apiSort); }
    catch (err) { console.error('[NewsAPI] Error:', err.message); }
  }

  // 3) Try GNews if both failed
  if ((!articles || articles.length === 0) && gNewsApiKey) {
    try { articles = await fetchFromGNews(gNewsApiKey, category, q); }
    catch (err) { console.error('[GNews] Error:', err.message); }
  }

  // 4) Try NewsData.io if all failed
  if ((!articles || articles.length === 0) && process.env.NEWSDATA_API_KEY) {
    try { articles = await fetchFromNewsData(process.env.NEWSDATA_API_KEY, category, q, country); }
    catch (err) { console.error('[NewsData] Error:', err.message); }
  }

  // 5) Try Live Google News RSS Feed with Country support as fallback
  if (!articles || articles.length === 0) {
    try { articles = await fetchFromGoogleNewsRSS(category, q, country); }
    catch (err) { console.error('[GoogleNewsRSS] Exception:', err.message); }
  }

  // 5) Fallback & Padding to guarantee articles per category
  const mockFallback = getMockArticles(category, q);
  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    articles = mockFallback;
  } else if (articles.length < 40) {
    articles = [...articles, ...mockFallback];
  }

  // 6) Strict Deduplication by normalized title to eliminate any repeating duplicate articles
  const seenTitles = new Set();
  articles = articles.filter(item => {
    if (!item || !item.title || item.title === '[Removed]') return false;
    const cleanTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (!cleanTitle || seenTitles.has(cleanTitle)) return false;
    seenTitles.add(cleanTitle);
    return true;
  });

  articles = filterByYear(articles, year);
  articles = filterByTimeframe(articles, timeframe);
  articles = sortArticles(articles, sortBy);

  setCache(reqCacheKey, articles);
  res.json(articles);
});

export default router;
