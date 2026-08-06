import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, User, Mail, Phone, Lock, AlertCircle, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, authError, setAuthError } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form Fields State
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-reset form fields cleanly whenever modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setFirstName('');
      setEmail('');
      setContactNumber('');
      setUsername('');
      setPassword('');
      setShowPassword(false);
      if (setAuthError) setAuthError(null);
    }
  }, [isOpen, setAuthError]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFirstName('');
    setEmail('');
    setContactNumber('');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    if (setAuthError) setAuthError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    let success = false;

    if (isLoginMode) {
      success = await login(username, password);
    } else {
      success = await register(username, password, {
        firstName,
        email,
        contactNumber
      });
    }

    setLoading(false);

    if (success) {
      resetForm();
      onClose();
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    resetForm();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} style={styles.closeBtn} title="Close Modal">
          <X size={18} />
        </button>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <User size={22} color="var(--accent-primary)" />
          </div>
          <h2 style={styles.title}>
            {isLoginMode ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style={styles.subtitle}>
            {isLoginMode
              ? 'Sign in to access your saved bookmarks and custom feed'
              : 'Fill in your details below to set up your news profile'}
          </p>
        </div>

        {/* Error message */}
        {authError && (
          <div style={styles.errorBox}>
            <AlertCircle size={15} color="#ef4444" />
            <span style={styles.errorText}>{authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLoginMode && (
            <>
              {/* First Name Field */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>First Name</label>
                <div style={styles.inputWrap}>
                  <User size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Enter your first name"
                    style={styles.input}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrap}>
                  <Mail size={16} style={styles.inputIcon} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    style={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Contact Number Field */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Contact Number</label>
                <div style={styles.inputWrap}>
                  <Phone size={16} style={styles.inputIcon} />
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    style={styles.input}
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Username Field */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username *</label>
            <div style={styles.inputWrap}>
              <User size={16} style={styles.inputIcon} />
              <input
                type="text"
                placeholder="Choose a unique username"
                style={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
          </div>

          {/* Password Field with Eye Toggle */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password *</label>
            <div style={styles.inputWrap}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password (min 6 chars)"
                style={{ ...styles.input, paddingRight: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={18} color="var(--accent-primary)" />
                ) : (
                  <Eye size={18} color="var(--text-muted)" />
                )}
              </button>
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

        {/* Mode Switch Divider */}
        <div style={styles.dividerRow}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Switch Login / Register Toggle */}
        <div style={styles.toggleFooter}>
          <span style={styles.toggleText}>
            {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button type="button" onClick={toggleMode} style={styles.toggleBtn}>
            {isLoginMode ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    position: 'relative',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: '20px',
    padding: '32px 28px',
    width: '100%',
    maxWidth: '440px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    color: 'var(--text-primary)',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  iconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.84rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
    margin: 0,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    marginBottom: '16px',
  },
  errorText: {
    fontSize: '0.82rem',
    color: '#ef4444',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
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
    width: '100%',
    padding: '11px 12px 11px 38px',
    borderRadius: '10px',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    WebkitTapHighlightColor: 'transparent',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '700',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0 16px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--border-light)',
  },
  dividerText: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  toggleFooter: {
    textAlign: 'center',
    fontSize: '0.85rem',
  },
  toggleText: {
    color: 'var(--text-muted)',
    marginRight: '6px',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: 0,
  },
};
