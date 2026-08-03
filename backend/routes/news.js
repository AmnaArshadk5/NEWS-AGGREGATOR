import express from 'express';
import { mockNews } from '../mockData.js';

const router = express.Router();

// Simple memory cache
const cache = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
  const cached = cache[key];
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

// Helper: filter articles by year
function filterByYear(articles, year) {
  if (!year) return articles;
  const y = parseInt(year, 10);
  return articles.filter(art => {
    const d = art.publishedAt || art.published_at;
    if (!d) return false;
    return new Date(d).getFullYear() === y;
  });
}

// Helper: filter articles by timeframe
function filterByTimeframe(articles, timeframe) {
  if (!timeframe || timeframe === 'all') return articles;
  const now = Date.now();
  let cutoff;
  switch (timeframe) {
    case '24h':
      cutoff = now - 24 * 60 * 60 * 1000;
      break;
    case 'week':
      cutoff = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case 'month':
      cutoff = now - 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      return articles;
  }
  return articles.filter(art => {
    const d = art.publishedAt || art.published_at;
    if (!d) return false;
    return new Date(d).getTime() >= cutoff;
  });
}

// Helper: sort articles
function sortArticles(articles, sortBy) {
  const sorted = [...articles];
  switch (sortBy) {
    case 'oldest':
      sorted.sort((a, b) => new Date(a.publishedAt || a.published_at || 0) - new Date(b.publishedAt || b.published_at || 0));
      break;
    case 'newest':
    default:
      sorted.sort((a, b) => new Date(b.publishedAt || b.published_at || 0) - new Date(a.publishedAt || a.published_at || 0));
      break;
  }
  return sorted;
}

// GET /api/news
router.get('/', async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY;
  const category = (req.query.category || 'general').toLowerCase();
  const q = req.query.q ? req.query.q.trim().toLowerCase() : '';
  const sortBy = req.query.sortBy || 'newest';
  const year = req.query.year || '';
  const timeframe = req.query.timeframe || 'all';

  if (apiKey) {
    try {
      let url = '';
      if (q) {
        // Search mode: use "everything" endpoint which supports sortBy
        const apiSort = sortBy === 'oldest' ? 'publishedAt' : sortBy === 'popularity' ? 'popularity' : 'publishedAt';
        url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=${apiSort}&pageSize=30&apiKey=${apiKey}`;
      } else {
        const categoryParam = category && category !== 'all' ? `&category=${category}` : '';
        url = `https://newsapi.org/v2/top-headlines?country=us${categoryParam}&pageSize=30&apiKey=${apiKey}`;
      }

      const cached = getCachedData(url);
      if (cached) {
        console.log('Serving news from cache:', url);
        let articles = cached;
        articles = filterByYear(articles, year);
        articles = filterByTimeframe(articles, timeframe);
        articles = sortArticles(articles, sortBy);
        return res.json(articles);
      }

      console.log('Fetching news from NewsAPI:', url);
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'ok') {
        let articles = data.articles.map(art => ({
          title: art.title || 'Untitled Article',
          description: art.description || '',
          url: art.url,
          urlToImage: art.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800',
          publishedAt: art.publishedAt,
          source: { name: art.source ? art.source.name : 'Unknown Source' },
          author: art.author || ''
        }));

        setCachedData(url, articles);

        articles = filterByYear(articles, year);
        articles = filterByTimeframe(articles, timeframe);
        articles = sortArticles(articles, sortBy);
        return res.json(articles);
      } else {
        console.warn('NewsAPI error, falling back to mock data:', data.message);
      }
    } catch (err) {
      console.error('Error fetching live news, falling back to mock:', err);
    }
  }

  // Fallback / Mock News Mode
  console.log(`Mock Mode: Category=${category}, Query=${q}, SortBy=${sortBy}, Year=${year}, Timeframe=${timeframe}`);

  let articles = [];

  if (category === 'all' || !category) {
    articles = Object.values(mockNews).flat();
  } else {
    articles = mockNews[category] || mockNews['general'] || [];
  }

  // Filter by search query
  if (q) {
    articles = articles.filter(art =>
      (art.title && art.title.toLowerCase().includes(q)) ||
      (art.description && art.description.toLowerCase().includes(q))
    );
  }

  // Apply year filter
  articles = filterByYear(articles, year);

  // Apply timeframe filter
  articles = filterByTimeframe(articles, timeframe);

  // Apply sorting
  articles = sortArticles(articles, sortBy);

  res.json(articles);
});

export default router;
