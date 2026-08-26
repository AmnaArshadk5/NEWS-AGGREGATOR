import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, X, ShieldCheck } from 'lucide-react';

export default function PushNotificationBanner() {
  const { user } = useAuth();
  const { registerPushToken, triggerNativeNotification } = useNotifications();
  const [showBanner, setShowBanner] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (user && 'Notification' in window) {
      if (Notification.permission === 'default' && !localStorage.getItem('push_banner_dismissed')) {
        setShowBanner(true);
      } else if (Notification.permission === 'granted') {
        setGranted(true);
      }
    }
  }, [user]);

  const handleEnableAlerts = async () => {
    if (!('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setShowBanner(false);
        setGranted(true);
        const mockToken = `fcm_web_${user?.id}_${Date.now()}`;
        if (registerPushToken) {
          await registerPushToken(mockToken);
        }
        if (triggerNativeNotification) {
          triggerNativeNotification('🚨 Chrome Alerts Activated!', 'Desktop notifications are active for Google Chrome & Windows Action Center.');
        }
      } else {
        setShowBanner(false);
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const handleTestAlert = () => {
    // 1. Direct synchronous call preserves Chrome User Activation gesture
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: 'Google Chrome desktop window notification popup test successful.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: `news_${Date.now()}`,
        requireInteraction: true,
        silent: false
      };

      try {
        new Notification('📰 Live Breaking Story (Chrome Test)', options);
      } catch (err) {
        console.warn('Direct Notification call error:', err.message);
      }
    }

    // 2. Also trigger context toast and Service Worker fallback
    if (triggerNativeNotification) {
      triggerNativeNotification('📰 Live Breaking Story (Chrome Test)', 'Google Chrome desktop window notification popup test successful.');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_banner_dismissed', 'true');
    setShowBanner(false);
  };

  if (!user || (!showBanner && !granted)) return null;

  if (granted && !showBanner) {
    return (
      <div style={styles.miniBanner}>
        <div style={styles.inner}>
          <div style={styles.iconWrap}>
            <Bell size={16} color="#10b981" />
          </div>
          <div style={styles.textWrap}>
            <span style={styles.miniTitle}>Chrome Notifications Active</span>
            <span style={styles.subtitle}>Desktop popups enabled for followed channels & categories.</span>
          </div>
          <button onClick={handleTestAlert} style={styles.testBtn}>
            <Bell size={13} />
            <span>Test Chrome Alert</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.banner}>
      <div style={styles.inner}>
        <div style={styles.iconWrap}>
          <Bell size={18} color="#3b82f6" />
        </div>
        <div style={styles.textWrap}>
          <span style={styles.title}>Enable Lock-Screen Breaking News Alerts</span>
          <span style={styles.subtitle}>Get notified instantly on your phone or desktop when your followed channels post stories.</span>
        </div>
        <div style={styles.btnRow}>
          <button onClick={handleEnableAlerts} style={styles.enableBtn}>
            <ShieldCheck size={14} />
            <span>Enable Alerts</span>
          </button>
          <button onClick={handleDismiss} style={styles.closeBtn} aria-label="Dismiss banner">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    backgroundColor: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-light)',
    padding: '10px 16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    position: 'relative',
    zIndex: 90,
  },
  miniBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
    padding: '8px 16px',
    position: 'relative',
    zIndex: 90,
  },
  miniTitle: {
    fontWeight: '700',
    fontSize: '0.84rem',
    color: '#059669',
  },
  testBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    fontWeight: '600',
    fontSize: '0.78rem',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  iconWrap: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: '220px',
  },
  title: {
    fontWeight: '700',
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  btnRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  enableBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    border: 'none',
    fontWeight: '600',
    fontSize: '0.8rem',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(59,130,246,0.3)',
    transition: 'all 0.2s ease',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
