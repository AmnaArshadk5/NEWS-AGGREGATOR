import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}>
          <X size={18} />
        </button>

        <div style={styles.header}>
          <h2 style={styles.heading}>Change Password</h2>
          <p style={styles.subtitle}>Update your account security credentials.</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={15} color="var(--accent-primary)" />
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            <CheckCircle2 size={15} color="var(--accent-success)" />
            <span style={styles.successText}>Password changed successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Current Password</label>
            <div style={styles.inputWrap}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                type="password"
                placeholder="Enter current password"
                className="input-field"
                style={styles.input}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>New Password</label>
            <div style={styles.inputWrap}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                type="password"
                placeholder="At least 6 characters"
                className="input-field"
                style={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <div style={styles.inputWrap}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                type="password"
                placeholder="Re-enter new password"
                className="input-field"
                style={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 size={16} className="spinner" /> : 'Update Password'}
          </button>
        </form>
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
  },
  header: {
    marginBottom: '20px',
  },
  heading: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.35rem',
    fontWeight: '700',
    marginBottom: '4px',
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '0.86rem',
    color: 'var(--text-muted)',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'rgba(136, 19, 55, 0.06)',
    border: '1px solid rgba(136, 19, 55, 0.15)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '16px',
  },
  errorText: {
    fontSize: '0.82rem',
    color: 'var(--accent-primary)',
    fontWeight: '500',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'rgba(22, 101, 52, 0.06)',
    border: '1px solid rgba(22, 101, 52, 0.15)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '16px',
  },
  successText: {
    fontSize: '0.82rem',
    color: 'var(--accent-success)',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
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
    marginTop: '6px',
    height: '42px',
    width: '100%',
  },
};
