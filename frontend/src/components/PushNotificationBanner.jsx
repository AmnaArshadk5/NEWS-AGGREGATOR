import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, X, ShieldCheck } from 'lucide-react';

export default function PushNotificationBanner() {
  const { user } = useAuth();
  const { registerPushToken, triggerNativeNotification } = useNotifications();
  const [showBanner, setShowBanner] = useState(false);
  const [granted, setGranted] = useState(false);
  const [permState, setPermState] = useState(typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported');
  const [diagMsg, setDiagMsg] = useState(null);

  const checkStatus = () => {
    if ('Notification' in window) {
      setPermState(Notification.permission);
      if (Notification.permission === 'granted') {
        setGranted(true);
      }
    }
  };

  useEffect(() => {
    if (user && 'Notification' in window) {
      checkStatus();
      if (Notification.permission === 'default' && !localStorage.getItem('push_banner_dismissed')) {
        setShowBanner(true);
      }
    }
  }, [user]);

  const handleEnableAlerts = async () => {
    if (!('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setPermState(permission);
      if (permission === 'granted') {
        setShowBanner(false);
        setGranted(true);
        const mockToken = `fcm_web_${user?.id}_${Date.now()}`;
        if (registerPushToken) {
          await registerPushToken(mockToken);
        }
        setDiagMsg('✅ Permission granted! Dispatched test notification.');
        if (triggerNativeNotification) {
          triggerNativeNotification('🚨 Chrome Alerts Activated!', 'Desktop notifications are active for Google Chrome & Windows Action Center.');
        }
      } else if (permission === 'denied') {
        setDiagMsg('❌ Notification permission BLOCKED in Chrome settings. Please click the 🔒 Lock icon in your address bar and change Notifications to Allow.');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setDiagMsg(`⚠️ Permission error: ${err.message}`);
    }
  };

  const handleTestAlert = async () => {
    checkStatus();
    const currentPerm = 'Notification' in window ? Notification.permission : 'unsupported';

    if (currentPerm === 'denied') {
      setDiagMsg('❌ Chrome Permission is BLOCKED. Click the 🔒 Lock icon next to the URL address bar ➔ Set Notifications to ALLOW ➔ Refresh page.');
      window.alert('❌ Chrome Notifications are BLOCKED for this site.\n\nTo fix:\n1. Click the Lock 🔒 icon in Chrome URL bar.\n2. Change Notifications to ALLOW.\n3. Refresh page.');
      return;
    }

    if (currentPerm === 'default') {
      await handleEnableAlerts();
      return;
    }

    setDiagMsg('🚀 Fired Chrome Notification Popup & In-App Desktop Window!');

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

    // 2. Trigger in-app desktop floating popup card
    if (triggerNativeNotification) {
      triggerNativeNotification('📰 Live Breaking Story (Chrome Test)', 'Google Chrome desktop window notification popup test successful.');
    }

    // 3. Fallback explicit browser popup dialog to confirm action
    setTimeout(() => {
      window.alert('🔔 Chrome Alert Test Executed!\n\nIf native Windows OS popups did not appear, check Windows Focus Assist / Do Not Disturb in your Windows Taskbar.');
    }, 300);
  };

  const handleDismiss = () => {
    localStorage.setItem('push_banner_dismissed', 'true');
    setShowBanner(false);
  };

  if (!user) return null;

  return (
    <div style={styles.bannerContainer}>
      {granted && !showBanner && (
        <div style={styles.miniBanner}>
          <div style={styles.inner}>
            <div style={styles.iconWrap}>
              <Bell size={16} color="#10b981" />
            </div>
            <div style={styles.textWrap}>
              <span style={styles.miniTitle}>Chrome Notifications Active (Permission: {permState})</span>
              <span style={styles.subtitle}>Desktop popups enabled for followed channels & categories.</span>
            </div>
            <button onClick={handleTestAlert} style={styles.testBtn}>
              <Bell size={13} />
              <span>Test Chrome Alert</span>
            </button>
          </div>
        </div>
      )}

      {showBanner && (
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
      )}

      {diagMsg && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: diagMsg.includes('❌') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)',
          borderBottom: '1px solid var(--border-light)',
          fontSize: '0.82rem',
          color: diagMsg.includes('❌') ? '#ef4444' : '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between'
        }}>
          <span>{diagMsg}</span>
          <button onClick={() => setDiagMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: '12px' }}>✕</button>
        </div>
      )}
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
