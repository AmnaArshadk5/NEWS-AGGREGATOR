import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [followedChannels, setFollowedChannels] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);
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
      setActiveToast(null); // Instantly clear active on-screen toast on logout
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

  // Process incoming articles and generate live alerts for followed channels & favorite categories
  const processLiveArticleNotifications = useCallback((incomingArticles = []) => {
    if (!user || !token) return; // Do not process alerts if user is logged out
    if (!Array.isArray(incomingArticles) || incomingArticles.length === 0) return;

    let notifiedUrls = new Set();
    try {
      const savedNotified = localStorage.getItem(`notified_urls_${userId}`);
      if (savedNotified) notifiedUrls = new Set(JSON.parse(savedNotified));
    } catch (e) {
      console.error('Error reading notified URLs:', e);
    }

    const newAlerts = [];
    const lowerChannels = followedChannels.map(c => (c || '').toLowerCase());
    const lowerCategories = favoriteCategories.map(c => (c || '').toLowerCase());

    incomingArticles.slice(0, 40).forEach(art => {
      const url = art.url || art.link;
      if (!url || notifiedUrls.has(url)) return;

      const sourceName = art.source?.name || art.source_name || '';
      const categoryName = art.category || '';
      const title = art.title || 'Breaking Story';

      let matchedReason = null;
      let matchedSource = sourceName;

      // 1. Check if source matches followed channels
      if (sourceName && lowerChannels.some(ch => sourceName.toLowerCase().includes(ch) || ch.includes(sourceName.toLowerCase()))) {
        matchedReason = `Channel Alert: ${sourceName}`;
      }
      // 2. Check if article matches favorite categories
      else if (lowerCategories.length > 0) {
        const titleLower = title.toLowerCase();
        const descLower = (art.description || '').toLowerCase();

        for (const cat of lowerCategories) {
          if (categoryName.toLowerCase().includes(cat) || titleLower.includes(cat) || descLower.includes(cat)) {
            matchedReason = `Category Alert: ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
            break;
          }
        }
      }

      if (matchedReason) {
        notifiedUrls.add(url);
        newAlerts.push({
          id: Date.now() + Math.random(),
          title: matchedReason,
          message: title,
          source_name: matchedSource,
          article_url: url,
          is_read: false,
          created_at: new Date().toISOString()
        });

        triggerNativeNotification(matchedReason, title);
      }
    });

    if (newAlerts.length > 0) {
      try {
        localStorage.setItem(`notified_urls_${userId}`, JSON.stringify(Array.from(notifiedUrls)));
      } catch (e) {
        console.error('Error saving notified URLs:', e);
      }

      setActiveToast(newAlerts[0]);
      setNotifications(prev => [...newAlerts, ...prev]);
      setUnreadCount(prev => prev + newAlerts.length);
    }
  }, [user, token, followedChannels, favoriteCategories, userId]);

  // Register Service Worker for Chrome & cross-browser native push popups
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('SW registration note:', err.message);
      });
    }
  }, []);

  // Trigger native browser push notification if permitted (Chrome, Edge, Firefox)
  const triggerNativeNotification = async (title, body) => {
    // 1. Always show in-app toast banner for instant UI confirmation
    setActiveToast({
      id: Date.now(),
      title: title || 'Live Breaking Story',
      message: body || 'Google Chrome notification test successful.',
      created_at: new Date().toISOString()
    });

    if (!('Notification' in window)) return;

    let permission = Notification.permission;
    if (permission === 'default') {
      try {
        permission = await Notification.requestPermission();
      } catch (e) {
        console.warn('Notification permission error:', e.message);
      }
    }

    if (permission === 'granted') {
      const options = {
        body: body || 'Breaking news alert from The Daily Wire.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: `news_${Date.now()}`,
        requireInteraction: true,
        silent: false
      };

      try {
        if ('serviceWorker' in navigator) {
          const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready);
          if (reg && reg.showNotification) {
            await reg.showNotification(title, options);
            return;
          }
        }
        new Notification(title, options);
      } catch (err) {
        try {
          new Notification(title, { body: body || 'Live news update' });
        } catch (e) {
          console.warn('Native notification error:', e.message);
        }
      }
    }
  };

  // Real-Time Background Polling Engine (polls every 10 seconds ONLY when user is logged in)
  useEffect(() => {
    if (!user || !token) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/news`);
        if (res.ok) {
          const latest = await res.json();
          if (Array.isArray(latest)) {
            processLiveArticleNotifications(latest);
          }
        }
      } catch (err) {
        console.error('Error in background notification polling:', err);
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [user, token, processLiveArticleNotifications]);

  const dismissToast = () => setActiveToast(null);

  return (
    <NotificationContext.Provider value={{
      followedChannels,
      notifications,
      unreadCount,
      activeToast,
      dismissToast,
      favoriteCategories,
      toggleFollowChannel,
      isChannelFollowed,
      toggleFavoriteCategory,
      isCategoryFavorite,
      processLiveArticleNotifications,
      triggerNativeNotification,
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
