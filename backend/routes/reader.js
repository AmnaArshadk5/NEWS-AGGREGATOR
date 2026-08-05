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

// Unwrap Google News RSS URLs to get true target news site URL
async function unwrapTargetUrl(url) {
  if (!url.includes('news.google.com') && !url.includes('goo.gl') && !url.includes('bit.ly')) {
    return url;
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
  return url;
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

  // Serve from cache
  const cached = cache.get(decoded);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const targetUrl = await unwrapTargetUrl(decoded);

    let article = null;
    try {
      article = await extract(targetUrl, {}, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
    } catch (err) {
      console.warn('[Reader] Extraction library warning:', err.message);
    }

    let hostname = 'news';
    try {
      hostname = new URL(targetUrl).hostname.replace('www.', '');
    } catch {}

    // If article extraction succeeded with HTML content
    if (article && article.content && article.content.trim().length > 50) {
      const result = {
        title: article.title || '',
        author: article.author || '',
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

    // Fallback: If scraper was blocked by Cloudflare/Paywall, construct clean readable article layout
    const fallbackTitle = article?.title || 'Full Story Coverage';
    const fallbackDesc = article?.description || 'Full coverage for this news story is available directly from the publisher.';
    const fallbackImage = article?.image ? proxyUrl(article.image) : '';

    const fallbackHtml = `
      <p class="lead-text">${fallbackDesc}</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid var(--border-light);" />
      <p>This article is hosted directly by <strong>${hostname}</strong>. You can read the original full publication on their official website.</p>
      <p>Our intelligent reader has indexed key metadata for this story. Continue scrolling below to update your reading progress meter, or click the button at the bottom to visit ${hostname} directly.</p>
    `;

    const fallbackResult = {
      title: fallbackTitle,
      author: article?.author || 'Editorial Team',
      published: article?.published || '',
      description: fallbackDesc,
      image: fallbackImage,
      content: fallbackHtml,
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
