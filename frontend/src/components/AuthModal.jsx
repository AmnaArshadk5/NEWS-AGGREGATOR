import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, User, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, authError, setAuthError } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    let success = false;
    if (isLoginMode) {
      success = await login(username, password);
    } else {
      success = await register(username, password);
    }
    setLoading(false);

    if (success) {
      setUsername('');
      setPassword('');
      onClose();
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setAuthError(null);
    setUsername('');
    setPassword('');
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} style={styles.closeBtn}>
          <X size={18} />
        </button>

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.heading}>{isLoginMode ? 'Welcome back' : 'Create your account'}</h2>
          <p style={styles.subtitle}>
            {isLoginMode
              ? 'Sign in to access your saved articles and personalized feed.'
              : 'Join us to save articles and build your reading list.'}
          </p>
        </div>

        {/* Error */}
        {authError && (
          <div style={styles.errorBox}>
            <AlertCircle size={15} color="var(--accent-primary)" />
            <span style={styles.errorText}>{authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrap}>
              <User size={16} style={styles.inputIcon} />
              <input
                type="text"
                placeholder="Enter your username"
                className="input-field"
                style={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                type="password"
                placeholder="Enter your password"
                className="input-field"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? (
              <Loader2 size={16} className="spinner" />
            ) : isLoginMode ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={styles.dividerRow}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Toggle */}
        <p style={styles.toggleRow}>
          {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={toggleMode} style={styles.toggleBtn}>
            {isLoginMode ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--bg-modal-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
  },
  modal: {
    position: 'relative',
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-light)',
    padding: '36px 32px 28px',
    boxShadow: 'var(--shadow-lg)',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s ease',
  },
  header: {
    marginBottom: '24px',
  },
  heading: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.4rem',
    fontWeight: '700',
    marginBottom: '6px',
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'rgba(136, 19, 55, 0.06)',
    border: '1px solid rgba(136, 19, 55, 0.15)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '18px',
  },
  errorText: {
    fontSize: '0.82rem',
    color: 'var(--accent-primary)',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  input: {
    paddingLeft: '40px',
  },
  submitBtn: {
    marginTop: '4px',
    height: '44px',
    width: '100%',
    fontSize: '0.92rem',
    borderRadius: 'var(--radius-sm)',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '22px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--border-light)',
  },
  dividerText: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  toggleRow: {
    textAlign: 'center',
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.88rem',
  },
};
