import express from 'express';
import { runQuery, allQuery } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Require authentication for notification endpoints
router.use(authMiddleware);

// GET /api/notifications - Get in-app notifications & unread count
router.get('/', async (req, res) => {
  try {
    const notifications = await allQuery(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );

    const unreadCount = notifications.filter(n => n.is_read === 0 || n.is_read === false).length;

    res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    await runQuery(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking notifications read:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// DELETE /api/notifications/:id - Delete a specific notification
router.delete('/:id', async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  try {
    await runQuery(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [targetId, req.user.id]
    );
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// DELETE /api/notifications - Clear all notifications
router.delete('/', async (req, res) => {
  try {
    await runQuery(
      'DELETE FROM notifications WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'All notifications cleared' });
  } catch (err) {
    console.error('Error clearing notifications:', err);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

// POST /api/notifications/register-token - Register FCM push token for logged-in user
router.post('/register-token', async (req, res) => {
  const { fcmToken, deviceType } = req.body;
  if (!fcmToken) {
    return res.status(400).json({ error: 'fcmToken is required' });
  }

  try {
    await runQuery(
      'INSERT INTO user_push_tokens (user_id, fcm_token, device_type) VALUES (?, ?, ?) ON CONFLICT (fcm_token) DO NOTHING',
      [req.user.id, fcmToken, deviceType || 'web']
    );
    res.json({ message: 'Push notification token registered successfully' });
  } catch (err) {
    console.error('Error registering FCM token:', err);
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

export default router;
