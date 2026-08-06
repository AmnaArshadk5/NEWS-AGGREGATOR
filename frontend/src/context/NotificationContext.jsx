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

  return (
    <NotificationContext.Provider value={{
      followedChannels,
      notifications,
      unreadCount,
      toggleFollowChannel,
      isChannelFollowed,
      markAllAsRead,
      clearAllNotifications,
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
