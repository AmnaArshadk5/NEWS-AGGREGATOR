import express from 'express';
import { runQuery, allQuery, getQuery } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Require authentication for all channel operations
router.use(authMiddleware);

// GET /api/channels/following - Get array of followed channel names
router.get('/following', async (req, res) => {
  try {
    const rows = await allQuery(
      'SELECT source_name FROM channel_follows WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    const following = rows.map(r => r.source_name);
    res.json(following);
  } catch (err) {
    console.error('Error fetching followed channels:', err);
    res.status(500).json({ error: 'Failed to fetch followed channels' });
  }
});

// POST /api/channels/toggle - Toggle follow status for a channel
router.post('/toggle', async (req, res) => {
  const { sourceName } = req.body;

  if (!sourceName || !sourceName.trim()) {
    return res.status(400).json({ error: 'Channel name (sourceName) is required' });
  }

  const cleanSource = sourceName.trim();

  try {
    const existing = await getQuery(
      'SELECT id FROM channel_follows WHERE user_id = ? AND source_name = ?',
      [req.user.id, cleanSource]
    );

    if (existing) {
      // Unfollow
      await runQuery(
        'DELETE FROM channel_follows WHERE user_id = ? AND source_name = ?',
        [req.user.id, cleanSource]
      );
      res.json({ message: `Unfollowed ${cleanSource}`, isFollowing: false, sourceName: cleanSource });
    } else {
      // Follow
      await runQuery(
        'INSERT INTO channel_follows (user_id, source_name) VALUES (?, ?)',
        [req.user.id, cleanSource]
      );

      // Create a welcome notification for following this channel
      await runQuery(
        'INSERT INTO notifications (user_id, title, message, source_name) VALUES (?, ?, ?, ?)',
        [
          req.user.id,
          `Following ${cleanSource}`,
          `You are now following ${cleanSource}. You will receive alerts when new articles are published.`,
          cleanSource
        ]
      );

      res.status(201).json({ message: `Following ${cleanSource}`, isFollowing: true, sourceName: cleanSource });
    }
  } catch (err) {
    console.error('Error toggling channel follow:', err);
    res.status(500).json({ error: 'Failed to update channel follow status' });
  }
});

export default router;
