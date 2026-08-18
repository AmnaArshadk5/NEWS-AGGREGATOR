import express from 'express';
import { extract } from '@extractus/article-extractor';

const router = express.Router();

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const PROXY_BASE = 'http://localhost:5000/api/proxy/image?url=';

function proxyUrl(url) {
  if (!url) return '';
  if (url.startsWith(PROXY_BASE) || url.startsWith('data:')) return url;
  return `${PROXY_BASE}${encodeURIComponent(url)}`;
}

function proxyHtmlImages(html) {
  if (!html) return '';
  let cleanHtml = html.replace(/\ssrcset=["']([^"']+)["']/gi, '');
  cleanHtml = cleanHtml.replace(/<img\s+([^>]*?)src=["'](https?:\/\/[^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
    return `<img ${before}src="${proxyUrl(src)}"${after}>`;
  });
  return cleanHtml;
}

// Helper to decode Google News RSS base64 URLs
function decodeGoogleNewsUrl(googleUrl) {
  try {
    const match = googleUrl.match(/articles\/([A-Za-z0-9_-]+)/);
    if (!match) return googleUrl;

    let token = match[1];
    if (token.startsWith('CBMi')) {
      token = token.substring(4);
      let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) base64 += '=';

      const decodedBuf = Buffer.from(base64, 'base64');
      const text = decodedBuf.toString('binary');

      const urlMatch = text.match(/https?:\/\/[^\s\x00-\x1F\x7F-\xFF]+/);
      if (urlMatch) {
        let cleanUrl = urlMatch[0];
        const endIdx = cleanUrl.search(/[^\w\.\-\/\?\=\&\%\:\#]/);
        if (endIdx !== -1) cleanUrl = cleanUrl.substring(0, endIdx);
        return cleanUrl;
      }
    }
  } catch (err) {
    console.warn('[Reader] Base64 decode error:', err.message);
  }
  return googleUrl;
}

// Unwrap Google News RSS URLs to get true target news site URL
async function unwrapTargetUrl(url) {
  const decodedBase = decodeGoogleNewsUrl(url);
  if (!decodedBase.includes('news.google.com') && !decodedBase.includes('goo.gl') && !decodedBase.includes('bit.ly')) {
    return decodedBase;
  }
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(6000),
    });

    const html = await res.text();

    const cwizMatch = html.match(/data-n-a-url=["'](https?:\/\/[^"']+)["']/i);
    if (cwizMatch) return cwizMatch[1];

    const metaMatch = html.match(/content=["']\d+;\s*url=(https?:\/\/[^"']+)["']/i);
    if (metaMatch) return metaMatch[1];

    const aMatch = html.match(/<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>/i);
    if (aMatch && !aMatch[1].includes('google.com')) return aMatch[1];

    if (res.url && !res.url.includes('google.com')) return res.url;
  } catch (err) {
    console.warn('[Reader] Failed to unwrap target URL:', err.message);
  }
  return decodedBase;
}

// Direct Live HTML paragraph scraper fallback
async function scrapeRealArticleHtml(targetUrl) {
  try {
    console.log('[Reader Scraper] Attempting direct live HTML fetch for:', targetUrl);
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const html = await res.text();

    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i) || html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const image = imgMatch ? imgMatch[1] : '';

    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const paragraphs = [];
    let match;
    while ((match = pRegex.exec(html)) !== null) {
      const cleanP = match[1].replace(/<[^>]+>/g, '').trim();
      if (cleanP.length > 40 && !cleanP.toLowerCase().includes('cookie') && !cleanP.toLowerCase().includes('subscribe') && !cleanP.toLowerCase().includes('rights reserved')) {
        paragraphs.push(`<p style="font-size: 1.05rem; line-height: 1.7; margin-bottom: 18px;">${cleanP}</p>`);
      }
    }

    if (paragraphs.length >= 2) {
      return {
        title,
        image: proxyUrl(image),
        content: paragraphs.join('\n'),
      };
    }
  } catch (err) {
    console.warn('[Reader Scraper] Live HTML scrape warning:', err.message);
  }
  return null;
}

// GET /api/reader?url=<encoded-url>
router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.json({ error: 'Missing url parameter' });

  let decoded;
  try {
    decoded = decodeURIComponent(url);
    new URL(decoded);
  } catch {
    return res.json({ error: 'Invalid URL' });
  }

  // Clear stale cached items that had mock text
  const cached = cache.get(decoded);
  if (cached && Date.now() - cached.ts < CACHE_TTL && !cached.data?.isFallback) {
    return res.json(cached.data);
  }

  try {
    const targetUrl = await unwrapTargetUrl(decoded);

    let article = null;
    try {
      article = await extract(targetUrl, {}, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
    } catch (err) {
      console.warn('[Reader] Extraction library warning:', err.message);
    }

    let hostname = 'News Source';
    try {
      hostname = new URL(targetUrl).hostname.replace('www.', '');
    } catch {}

    // 1) Primary: If article extraction succeeded with HTML content
    if (article && article.content && article.content.trim().length > 50) {
      const result = {
        title: article.title || '',
        author: article.author || hostname,
        published: article.published || '',
        description: article.description || '',
        image: proxyUrl(article.image),
        content: proxyHtmlImages(article.content),
        source: hostname,
        url: targetUrl,
        isFallback: false,
      };

      cache.set(decoded, { data: result, ts: Date.now() });
      return res.json(result);
    }

    // 2) Secondary: Direct Live HTML paragraph scraper from publisher website
    const scraped = await scrapeRealArticleHtml(targetUrl);
    if (scraped && scraped.content) {
      const scrapedResult = {
        title: scraped.title || article?.title || 'Live News Story',
        author: hostname,
        published: article?.published || '',
        description: article?.description || '',
        image: scraped.image || proxyUrl(article?.image),
        content: scraped.content,
        source: hostname,
        url: targetUrl,
        isFallback: false,
      };

      cache.set(decoded, { data: scrapedResult, ts: Date.now() });
      return res.json(scrapedResult);
    }

    // 3) Fallback: Render full structured metadata body if site blocks scrapers
    const fallbackTitle = article?.title || 'Live Breaking Story';
    const fallbackDesc = article?.description || 'Full live news story details reported directly by publisher.';
    const fallbackImage = article?.image ? proxyUrl(article.image) : '';

    const fallbackResult = {
      title: fallbackTitle,
      author: `${hostname} Editorial Desk`,
      published: article?.published || '',
      description: fallbackDesc,
      image: fallbackImage,
      content: `<p style="font-size: 1.12rem; line-height: 1.7; margin-bottom: 20px; font-weight: 500;">${fallbackDesc}</p>`,
      source: hostname,
      url: targetUrl,
      isFallback: true,
    };

    cache.set(decoded, { data: fallbackResult, ts: Date.now() });
    return res.json(fallbackResult);

  } catch (err) {
    console.error('[Reader] Route Error:', err.message);
    return res.json({ error: 'Could not fetch or parse the article.' });
  }
});

export default router;
