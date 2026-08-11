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

  let articles = null;

  // 1) Try NewsAPI
  if (newsApiKey) {
    try { articles = await fetchFromNewsAPI(newsApiKey, category, q, apiSort); }
    catch (err) { console.error('[NewsAPI] Error:', err.message); }
  }

  // 2) Try GNews if NewsAPI failed
  if (!articles && gNewsApiKey) {
    try { articles = await fetchFromGNews(gNewsApiKey, category, q); }
    catch (err) { console.error('[GNews] Error:', err.message); }
  }

  // 3) Try NewsData.io if both failed
  if (!articles && process.env.NEWSDATA_API_KEY) {
    try { articles = await fetchFromNewsData(process.env.NEWSDATA_API_KEY, category, q, country); }
    catch (err) { console.error('[NewsData] Error:', err.message); }
  }

  // 4) Fallback & Padding to guarantee articles per category
  const mockFallback = getMockArticles(category, q);
  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    articles = mockFallback;
  } else if (articles.length < 40) {
    articles = [...articles, ...mockFallback];
  }

  // 5) Strict Deduplication by normalized base title to eliminate any repeating duplicate articles
  const seenTitles = new Set();
  articles = articles.filter(item => {
    if (!item || !item.title || item.title === '[Removed]') return false;
    const cleanTitle = item.title.split(':')[0].toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (!cleanTitle || seenTitles.has(cleanTitle)) return false;
    seenTitles.add(cleanTitle);
    return true;
  });

  articles = filterByYear(articles, year);
  articles = filterByTimeframe(articles, timeframe);
  articles = sortArticles(articles, sortBy);

  res.json(articles);
});

export default router;
