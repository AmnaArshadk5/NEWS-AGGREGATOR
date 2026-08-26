import express from 'express';
import { getUserBookmarks, addBookmark, removeBookmark } from '../queries.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/bookmarks - Get all bookmarks for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookmarks = await getUserBookmarks(userId);
    res.json(bookmarks);
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    res.status(500).json({ error: 'Internal server error fetching bookmarks' });
  }
});

// POST /api/bookmarks - Add a new bookmark
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { title, description, url, urlToImage, publishedAt, sourceName, author, source } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required to bookmark an article' });
  }

  try {
    const article = {
      title,
      description,
      url,
      urlToImage,
      publishedAt,
      source: source || { name: sourceName },
      author
    };
    const result = await addBookmark(userId, article);
    
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
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Article URL is required to remove bookmark' });
  }

  try {
    await removeBookmark(userId, url);
    res.json({ message: 'Bookmark removed successfully' });
  } catch (err) {
    console.error('Error removing bookmark:', err);
    res.status(500).json({ error: 'Internal server error removing bookmark' });
  }
});

export default router;
