import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, X, ShieldCheck } from 'lucide-react';

export default function PushNotificationBanner() {
  const { user } = useAuth();
  const { registerPushToken } = useNotifications();
  const [showBanner, setShowBanner] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    // Only show to logged-in users whose browser supports Notification API
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
        // Simulate FCM Web Push token registration
        const mockToken = `fcm_web_${user?.id}_${Date.now()}`;
        if (registerPushToken) {
          await registerPushToken(mockToken);
        }
      } else {
        setShowBanner(false);
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_banner_dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

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
