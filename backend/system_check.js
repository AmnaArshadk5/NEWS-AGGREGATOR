import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const API = 'http://localhost:5000/api';

async function runCheck() {
  console.log('\n=================== 🏥 FULL SYSTEM DIAGNOSTIC CHECK ===================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ❌ [FAIL] ${name} — ${err.message}`);
      failed++;
    }
  };

  // 1. Check PostgreSQL Database Connection
  await test('PostgreSQL Database Connection & Schema', async () => {
    const connectionString = process.env.DATABASE_URL || {
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432', 10),
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      database: process.env.PG_DATABASE || 'news_aggregator',
    };
    const pool = new Pool(typeof connectionString === 'string' ? { connectionString } : connectionString);
    const res = await pool.query('SELECT COUNT(*) FROM users');
    await pool.end();
    if (!res.rows) throw new Error('Database query returned no rows');
  });

  // 2. Check Public Categories API
  await test('Public Categories Endpoint (GET /api/categories)', async () => {
    const res = await fetch(`${API}/categories`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      throw new Error(`Expected non-empty category array, got HTTP ${res.status}`);
    }
  });

  // 3. Check News Aggregation Engine API
  await test('News Engine Endpoint (GET /api/news?category=general)', async () => {
    const res = await fetch(`${API}/news?category=general&sortBy=newest&timeframe=all`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      throw new Error(`Expected articles array, got HTTP ${res.status}`);
    }
  });

  // 4. Check News Search & Country Filter API
  await test('News Search & Country Filter (GET /api/news?q=tech&country=us)', async () => {
    const res = await fetch(`${API}/news?q=tech&country=us`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data)) {
      throw new Error(`Expected array, got HTTP ${res.status}`);
    }
  });

  // 5. Check Auth Registration API
  let testToken = null;
  const testUser = `diag_user_${Date.now()}`;
  await test('Auth Register Endpoint (POST /api/auth/register)', async () => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUser, password: 'password123' })
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.error || `HTTP ${res.status}`);
    testToken = data.token;
  });

  // 6. Check Auth Login API
  await test('Auth Login Endpoint (POST /api/auth/login)', async () => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUser, password: 'password123' })
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.error || `HTTP ${res.status}`);
  });

  // 7. Check Authenticated User Profile API
  await test('Authenticated User Profile (GET /api/auth/me)', async () => {
    const res = await fetch(`${API}/auth/me`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    const data = await res.json();
    if (!res.ok || !data.user) throw new Error(data.error || `HTTP ${res.status}`);
  });

  // 8. Check Bookmarks API
  await test('Bookmarks CRUD (GET & POST /api/bookmarks)', async () => {
    // Add bookmark
    const addRes = await fetch(`${API}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        title: 'Diagnostic Test Story',
        url: `https://example.com/diag-${Date.now()}`,
        description: 'Test story for system diagnostic check',
        urlToImage: 'https://example.com/img.jpg',
        sourceName: 'Diagnostic'
      })
    });
    if (!addRes.ok) throw new Error(`Add bookmark failed with HTTP ${addRes.status}`);

    // Get bookmarks
    const getRes = await fetch(`${API}/bookmarks`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    const bookmarks = await getRes.json();
    if (!getRes.ok || !Array.isArray(bookmarks) || bookmarks.length === 0) {
      throw new Error(`Get bookmarks failed or empty`);
    }
  });

  // 9. Check Reader View Extraction API
  await test('Reader Extraction API (GET /api/reader)', async () => {
    const res = await fetch(`${API}/reader?url=${encodeURIComponent('https://example.com')}`);
    const data = await res.json();
    if (!res.ok || !data.content) throw new Error(`Reader extraction failed`);
  });

  // 10. Check CORS Image Proxy API
  await test('CORS Image Proxy Endpoint (GET /api/proxy/image)', async () => {
    const res = await fetch(`${API}/proxy/image?url=${encodeURIComponent('https://images.unsplash.com/photo-1504711434969-e33886168f5c')}`);
    if (!res.ok && res.status !== 302) throw new Error(`Image proxy HTTP ${res.status}`);
  });

  // 11. Check Swagger API Documentation Endpoint
  await test('Interactive Swagger Docs (GET /api-docs/)', async () => {
    const res = await fetch('http://localhost:5000/api-docs/');
    if (!res.ok) throw new Error(`Swagger UI HTTP ${res.status}`);
  });

  // 12. Check Frontend Dev Server
  await test('Frontend Web App (GET http://localhost:5173/)', async () => {
    const res = await fetch('http://localhost:5173/');
    if (!res.ok) throw new Error(`Frontend HTTP ${res.status}`);
  });

  console.log('\n-------------------------------------------------------------');
  console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} tests.`);
  console.log('=============================================================\n');
}

runCheck();
