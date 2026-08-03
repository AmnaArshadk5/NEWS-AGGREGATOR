import express from 'express';
import { runQuery, allQuery } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/bookmarks - Get all bookmarks for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookmarks = await allQuery(
      'SELECT id, title, description, url, url_to_image, published_at, source_name, author FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(bookmarks);
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    res.status(500).json({ error: 'Internal server error fetching bookmarks' });
  }
});

// POST /api/bookmarks - Add a new bookmark
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { title, description, url, urlToImage, publishedAt, sourceName, author } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required to bookmark an article' });
  }

  try {
    // We use INSERT OR IGNORE to handle double-bookmarking idempotently
    const sql = `
      INSERT OR IGNORE INTO bookmarks 
      (user_id, title, description, url, url_to_image, published_at, source_name, author)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      userId,
      title,
      description || '',
      url,
      urlToImage || '',
      publishedAt || '',
      sourceName || '',
      author || ''
    ];
    
    const result = await runQuery(sql, params);
    
    res.status(201).json({
      message: 'Article bookmarked successfully',
      id: result.id
    });
  } catch (err) {
    console.error('Error adding bookmark:', err);
    res.status(500).json({ error: 'Internal server error bookmarking article' });
  }
});

// DELETE /api/bookmarks - Remove a bookmark (by URL)
router.delete('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { url } = req.body; // or read from query parameter/params

  if (!url) {
    return res.status(400).json({ error: 'Article URL is required to remove bookmark' });
  }

  try {
    const result = await runQuery(
      'DELETE FROM bookmarks WHERE user_id = ? AND url = ?',
      [userId, url]
    );

    if (result.changes === 0) {
      return res.status(444 || 404).json({ error: 'Bookmark not found' });
    }

    res.json({ message: 'Bookmark removed successfully' });
  } catch (err) {
    console.error('Error deleting bookmark:', err);
    res.status(500).json({ error: 'Internal server error removing bookmark' });
  }
});

export default router;
