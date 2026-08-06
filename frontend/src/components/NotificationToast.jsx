import React, { useEffect } from 'react';
import { Bell, Zap, X, ExternalLink, ArrowRight } from 'lucide-react';

export default function NotificationToast({ toast, onClose, onSelectChannel }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div style={styles.toastWrap} className="slide-in-toast">
      <div style={styles.toastCard}>
        <div style={styles.toastHeader}>
          <div style={styles.iconBadge}>
            <Zap size={14} color="#ffffff" />
          </div>
          <span style={styles.toastTitle}>{toast.title || 'Live Breaking News'}</span>
          <button onClick={onClose} style={styles.closeBtn} title="Dismiss">
            <X size={15} />
          </button>
        </div>

        <p style={styles.toastMessage}>{toast.message}</p>

        <div style={styles.toastFooter}>
          {toast.source_name && (
            <span style={styles.sourceTag}>{toast.source_name}</span>
          )}
          <button
            onClick={() => {
              onClose();
              if (toast.source_name && onSelectChannel) {
                onSelectChannel(toast.source_name);
              }
            }}
            style={styles.actionBtn}
          >
            <span>View Channel</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  toastWrap: {
    position: 'fixed',
    top: '76px',
    right: '20px',
    zIndex: 9999,
    maxWidth: '380px',
    width: 'calc(100% - 40px)',
  },
  toastCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '14px',
    border: '1px solid var(--accent-primary)',
    boxShadow: '0 12px 30px rgba(136, 19, 55, 0.25)',
    padding: '14px 16px',
    color: 'var(--text-primary)',
    backdropFilter: 'blur(10px)',
  },
  toastHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  iconBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toastTitle: {
    fontWeight: '800',
    fontSize: '0.86rem',
    color: 'var(--accent-primary)',
    flex: 1,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
  },
  toastMessage: {
    fontSize: '0.84rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0 0 10px 0',
    lineHeight: '1.35',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  toastFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    paddingTop: '8px',
    borderTop: '1px solid var(--border-light)',
  },
  sourceTag: {
    fontSize: '0.74rem',
    fontWeight: '700',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    color: 'var(--accent-primary)',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
  },
};
