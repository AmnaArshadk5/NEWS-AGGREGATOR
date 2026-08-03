import assert from 'assert';

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('Starting API Tests...');
  let token = null;
  const username = `testuser_${Date.now()}`;
  const password = 'password123';

  // 1. Test Register
  console.log('Testing User Registration...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const regData = await regRes.json();
  assert.strictEqual(regRes.status, 201, 'Expected 201 Created');
  assert.ok(regData.token, 'Expected JWT token back');
  assert.strictEqual(regData.user.username, username, 'Username should match');
  console.log('✓ Registration passed');
  
  token = regData.token;

  // 2. Test Login
  console.log('Testing User Login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, 'Expected 200 OK');
  assert.ok(loginData.token, 'Expected JWT token');
  console.log('✓ Login passed');

  // 3. Test Auth Me
  console.log('Testing /auth/me profile endpoint...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  assert.strictEqual(meRes.status, 200, 'Expected 200 OK');
  assert.strictEqual(meData.user.username, username, 'Should return correct username');
  console.log('✓ Profile loading passed');

  // 4. Test News Listing
  console.log('Testing news listing (Mock fallback mode)...');
  const newsRes = await fetch(`${BASE_URL}/news?category=technology`);
  const newsData = await newsRes.json();
  assert.strictEqual(newsRes.status, 200, 'Expected 200 OK');
  assert.ok(Array.isArray(newsData), 'News response should be an array');
  assert.ok(newsData.length > 0, 'News response should contain mock articles');
  console.log(`✓ News retrieval passed (${newsData.length} articles found)`);

  const articleToBookmark = newsData[0];

  // 5. Test Add Bookmark
  console.log('Testing adding a bookmark...');
  const addBRes = await fetch(`${BASE_URL}/bookmarks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: articleToBookmark.title,
      description: articleToBookmark.description,
      url: articleToBookmark.url,
      urlToImage: articleToBookmark.urlToImage,
      publishedAt: articleToBookmark.publishedAt,
      sourceName: articleToBookmark.source.name,
      author: articleToBookmark.author
    })
  });
  const addBData = await addBRes.json();
  assert.strictEqual(addBRes.status, 201, 'Expected 201 Created');
  console.log('✓ Bookmark creation passed');

  // 6. Test Get Bookmarks
  console.log('Testing retrieving bookmarks...');
  const getBRes = await fetch(`${BASE_URL}/bookmarks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const getBData = await getBRes.json();
  assert.strictEqual(getBRes.status, 200, 'Expected 200 OK');
  assert.ok(Array.isArray(getBData), 'Bookmarks response should be an array');
  assert.strictEqual(getBData.length, 1, 'Expected exactly 1 bookmark in list');
  assert.strictEqual(getBData[0].url, articleToBookmark.url, 'URL should match the bookmarked article');
  console.log('✓ Bookmarks retrieval passed');

  // 7. Test Remove Bookmark
  console.log('Testing deleting a bookmark...');
  const delBRes = await fetch(`${BASE_URL}/bookmarks`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ url: articleToBookmark.url })
  });
  assert.strictEqual(delBRes.status, 200, 'Expected 200 OK');
  console.log('✓ Bookmark deletion passed');

  // 8. Test Get Bookmarks (verify empty now)
  const getBEmptyRes = await fetch(`${BASE_URL}/bookmarks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const getBEmptyData = await getBEmptyRes.json();
  assert.strictEqual(getBEmptyData.length, 0, 'Bookmarks list should be empty after deletion');
  console.log('✓ Empty bookmarks check passed');

  console.log('\n======================================');
  console.log('All API tests passed successfully!');
  console.log('======================================');
  
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
