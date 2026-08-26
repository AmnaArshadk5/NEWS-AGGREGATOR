import express from 'express';
import { 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markAllNotificationsRead, 
  deleteNotification,
  clearAllNotifications, 
  registerPushToken 
} from '../queries.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Require authentication for notification endpoints
router.use(authMiddleware);

// GET /api/notifications - Get in-app notifications & unread count
router.get('/', async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.id);
    const unreadCount = await getUnreadNotificationCount(req.user.id);

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
    await markAllNotificationsRead(req.user.id);
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
    await deleteNotification(targetId, req.user.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// DELETE /api/notifications - Clear all notifications
router.delete('/', async (req, res) => {
  try {
    await clearAllNotifications(req.user.id);
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
    await registerPushToken(req.user.id, fcmToken, deviceType || 'web');
    res.status(201).json({ message: 'Push token registered successfully' });
  } catch (err) {
    console.error('Error registering push token:', err);
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

export default router;
