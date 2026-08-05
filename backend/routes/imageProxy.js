import express from 'express';

const router = express.Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];
const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800';

const imgCache = new Map();
const IMG_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// GET /api/proxy/image?url=<encoded-url>
router.get('/image', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.redirect(302, FALLBACK_IMAGE_URL);
  }

  let decoded;
  try {
    decoded = decodeURIComponent(url);
    new URL(decoded);
  } catch {
    return res.redirect(302, FALLBACK_IMAGE_URL);
  }

  // Serve from cache if available
  const cached = imgCache.get(decoded);
  if (cached && Date.now() - cached.ts < IMG_CACHE_TTL) {
    res.set('Content-Type', cached.contentType);
    res.set('Cache-Control', 'public, max-age=1800');
    res.set('Access-Control-Allow-Origin', '*');
    return res.send(cached.buffer);
  }

  try {
    const response = await fetch(decoded, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      // Third-party server returned non-200 (e.g. 403 / 404). Redirect to fallback image seamlessly with 302
      return res.redirect(302, FALLBACK_IMAGE_URL);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const isImage = ALLOWED_TYPES.some(t => contentType.startsWith(t));
    if (!isImage) {
      return res.redirect(302, FALLBACK_IMAGE_URL);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    imgCache.set(decoded, { buffer, contentType, ts: Date.now() });

    if (imgCache.size > 200) {
      const now = Date.now();
      for (const [key, val] of imgCache.entries()) {
        if (now - val.ts > IMG_CACHE_TTL) imgCache.delete(key);
      }
    }

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=1800');
    res.set('Access-Control-Allow-Origin', '*');
    return res.send(buffer);

  } catch (err) {
    console.warn('[ImageProxy] Gracefully redirecting failed image:', decoded.slice(0, 70), '-', err.message);
    return res.redirect(302, FALLBACK_IMAGE_URL);
  }
});

export default router;
