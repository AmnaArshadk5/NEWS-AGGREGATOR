import { runQuery, getQuery, allQuery } from './db.js';

// ── USER & AUTH QUERIES ──
export async function findUserByUsername(username) {
  if (!username) return null;
  return await getQuery('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username.trim()]);
}

export async function findUserById(id) {
  if (!id) return null;
  return await getQuery('SELECT id, username, first_name, email, contact_number, role, created_at FROM users WHERE id = ?', [id]);
}

export async function getUserCount() {
  const row = await getQuery('SELECT COUNT(*) as count FROM users');
  return row ? parseInt(row.count, 10) : 0;
}

export async function createUser({ username, passwordHash, firstName = null, email = null, contactNumber = null, role = 'user' }) {
  const result = await runQuery(
    'INSERT INTO users (username, password_hash, password, first_name, email, contact_number, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [username.trim(), passwordHash, passwordHash, firstName, email, contactNumber, role]
  );
  return result;
}

export async function updateUserPassword(userId, passwordHash) {
  return await runQuery(
    'UPDATE users SET password_hash = ?, password = ? WHERE id = ?',
    [passwordHash, passwordHash, userId]
  );
}

export async function getAllUsers() {
  return await allQuery('SELECT id, username, role, first_name, email, contact_number, created_at FROM users ORDER BY id ASC');
}

export async function updateUserRole(userId, role) {
  return await runQuery('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
}

export async function deleteUser(userId) {
  return await runQuery('DELETE FROM users WHERE id = ?', [userId]);
}

// ── CATEGORIES QUERIES ──
export async function getAllCategories() {
  return await allQuery('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
}

export async function getEnabledCategories() {
  return await allQuery('SELECT * FROM categories WHERE enabled = 1 ORDER BY sort_order ASC, name ASC');
}

export async function findCategoryBySlug(slug) {
  return await getQuery('SELECT * FROM categories WHERE LOWER(slug) = LOWER(?)', [slug.trim()]);
}

export async function createCategory(name, slug, sortOrder = 99) {
  return await runQuery(
    'INSERT INTO categories (name, slug, enabled, sort_order) VALUES (?, ?, 1, ?)',
    [name.trim(), slug.trim(), sortOrder]
  );
}

export async function toggleCategoryEnabled(id, enabled) {
  return await runQuery('UPDATE categories SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
}

export async function deleteCategory(id) {
  return await runQuery('DELETE FROM categories WHERE id = ?', [id]);
}

// ── BOOKMARKS QUERIES ──
export async function getUserBookmarks(userId) {
  return await allQuery('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
}

export async function findBookmark(userId, url) {
  return await getQuery('SELECT * FROM bookmarks WHERE user_id = ? AND url = ?', [userId, url]);
}

export async function addBookmark(userId, article) {
  const { title, description, url, urlToImage, publishedAt, source, author } = article;
  const sourceName = source?.name || article.source_name || 'General News';
  const img = urlToImage || article.url_to_image || '';
  const pubAt = publishedAt || article.published_at || new Date().toISOString();
  const auth = author || '';

  return await runQuery(
    'INSERT INTO bookmarks (user_id, title, description, url, url_to_image, published_at, source_name, author) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, title, description || '', url, img, pubAt, sourceName, auth]
  );
}

export async function removeBookmark(userId, url) {
  return await runQuery('DELETE FROM bookmarks WHERE user_id = ? AND url = ?', [userId, url]);
}

// ── CHANNELS & FOLLOW QUERIES ──
export async function getFollowedChannels(userId) {
  const rows = await allQuery('SELECT source_name FROM channel_follows WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(r => r.source_name);
}

export async function findFollowedChannel(userId, sourceName) {
  return await getQuery(
    'SELECT id FROM channel_follows WHERE user_id = ? AND LOWER(source_name) = LOWER(?)',
    [userId, sourceName.trim()]
  );
}

export async function addFollowChannel(userId, sourceName) {
  return await runQuery(
    'INSERT INTO channel_follows (user_id, source_name) VALUES (?, ?)',
    [userId, sourceName.trim()]
  );
}

export async function removeFollowChannel(userId, sourceName) {
  return await runQuery(
    'DELETE FROM channel_follows WHERE user_id = ? AND LOWER(source_name) = LOWER(?)',
    [userId, sourceName.trim()]
  );
}

// ── NOTIFICATIONS QUERIES ──
export async function getUserNotifications(userId) {
  return await allQuery(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
}

export async function getUnreadNotificationCount(userId) {
  const row = await getQuery(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND (is_read = 0 OR is_read = false OR is_read IS NULL)',
    [userId]
  );
  return row ? parseInt(row.count, 10) : 0;
}

export async function createNotification(userId, title, message, sourceName = null, url = null) {
  return await runQuery(
    'INSERT INTO notifications (user_id, title, message, source_name, url) VALUES (?, ?, ?, ?, ?)',
    [userId, title, message, sourceName, url]
  );
}

export async function markAllNotificationsRead(userId) {
  return await runQuery('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
}

export async function deleteNotification(id, userId) {
  return await runQuery('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function clearAllNotifications(userId) {
  return await runQuery('DELETE FROM notifications WHERE user_id = ?', [userId]);
}

export async function registerPushToken(userId, fcmToken, deviceType = 'web') {
  return await runQuery(
    'INSERT INTO push_tokens (user_id, fcm_token, device_type) VALUES (?, ?, ?)',
    [userId, fcmToken, deviceType]
  );
}
