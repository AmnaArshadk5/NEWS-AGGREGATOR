import express from 'express';
import { 
  getFollowedChannels, 
  findFollowedChannel, 
  addFollowChannel, 
  removeFollowChannel, 
  createNotification 
} from '../queries.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Require authentication for all channel operations
router.use(authMiddleware);

// GET /api/channels/following - Get array of followed channel names
router.get('/following', async (req, res) => {
  try {
    const following = await getFollowedChannels(req.user.id);
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
    const existing = await findFollowedChannel(req.user.id, cleanSource);

    if (existing) {
      // Unfollow
      await removeFollowChannel(req.user.id, cleanSource);
      res.json({ message: `Unfollowed ${cleanSource}`, isFollowing: false, sourceName: cleanSource });
    } else {
      // Follow
      await addFollowChannel(req.user.id, cleanSource);

      // Create a welcome notification for following this channel
      await createNotification(
        req.user.id,
        `Following ${cleanSource}`,
        `You are now following ${cleanSource}. You will receive alerts when new articles are published.`,
        cleanSource
      );

      res.status(201).json({ message: `Following ${cleanSource}`, isFollowing: true, sourceName: cleanSource });
    }
  } catch (err) {
    console.error('Error toggling channel follow:', err);
    res.status(500).json({ error: 'Failed to update channel follow status' });
  }
});

export default router;
