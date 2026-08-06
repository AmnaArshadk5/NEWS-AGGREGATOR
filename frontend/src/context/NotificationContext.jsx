import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [followedChannels, setFollowedChannels] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch followed channels list
  const fetchFollowedChannels = useCallback(async () => {
    if (!token) {
      setFollowedChannels([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/channels/following`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFollowedChannels(data);
      }
    } catch (err) {
      console.error('Error fetching followed channels:', err);
    }
  }, [token]);

  // Fetch notifications & unread badge count
  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [token]);

  // Poll for notifications every 30 seconds when logged in
  useEffect(() => {
    if (user && token) {
      fetchFollowedChannels();
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setFollowedChannels([]);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, token, fetchFollowedChannels, fetchNotifications]);

  // Toggle follow/unfollow status for a channel
  const toggleFollowChannel = async (sourceName) => {
    if (!token) return false;
    if (!sourceName || !sourceName.trim()) return false;

    const cleanSource = sourceName.trim();
    try {
      const res = await fetch(`${API_BASE_URL}/channels/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sourceName: cleanSource })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isFollowing) {
          setFollowedChannels(prev => [...prev, cleanSource]);
        } else {
          setFollowedChannels(prev => prev.filter(name => name.toLowerCase() !== cleanSource.toLowerCase()));
        }
        fetchNotifications();
        return data.isFollowing;
      }
    } catch (err) {
      console.error('Error toggling channel follow:', err);
    }
    return false;
  };

  const isChannelFollowed = (sourceName) => {
    if (!sourceName) return false;
    return followedChannels.some(name => name.toLowerCase() === sourceName.trim().toLowerCase());
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Register Web Push token to backend
  const registerPushToken = async (fcmToken) => {
    if (!token || !fcmToken) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fcmToken, deviceType: 'web' })
      });
    } catch (err) {
      console.error('Error registering push token:', err);
    }
  };

  // Favorite Categories state
  const userId = user?.id ? user.id : 'guest';
  const [favoriteCategories, setFavoriteCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(`fav_categories_${userId}`);
      return saved ? JSON.parse(saved) : ['Food', 'Technology'];
    } catch {
      return ['Food', 'Technology'];
    }
  });

  useEffect(() => {
    if (userId) {
      try {
        const saved = localStorage.getItem(`fav_categories_${userId}`);
        setFavoriteCategories(saved ? JSON.parse(saved) : ['Food', 'Technology']);
      } catch {
        setFavoriteCategories(['Food', 'Technology']);
      }
    }
  }, [userId]);

  const saveCategories = (updated) => {
    setFavoriteCategories(updated);
    try {
      localStorage.setItem(`fav_categories_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save favorite categories:', e);
    }
  };

  const toggleFavoriteCategory = (catName) => {
    if (!catName) return;
    const exists = favoriteCategories.some(c => c.toLowerCase() === catName.toLowerCase());
    let updated;
    if (exists) {
      updated = favoriteCategories.filter(c => c.toLowerCase() !== catName.toLowerCase());
    } else {
      updated = [...favoriteCategories, catName];
      // Generate live category notification
      const newNotif = {
        id: Date.now(),
        title: `Category Subscribed: ${catName}`,
        message: `Live alerts enabled for "${catName}". You'll receive updates when new ${catName} articles arrive!`,
        is_read: false,
        created_at: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
    saveCategories(updated);
  };

  const isCategoryFavorite = (catName) => {
    if (!catName) return false;
    return favoriteCategories.some(c => c.toLowerCase() === catName.toLowerCase());
  };

  return (
    <NotificationContext.Provider value={{
      followedChannels,
      notifications,
      unreadCount,
      favoriteCategories,
      toggleFollowChannel,
      isChannelFollowed,
      toggleFavoriteCategory,
      isCategoryFavorite,
      markAllAsRead,
      clearAllNotifications,
      registerPushToken,
      fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
