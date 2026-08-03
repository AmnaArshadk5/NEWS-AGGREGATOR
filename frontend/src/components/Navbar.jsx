import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, Bookmark, User, ChevronDown } from 'lucide-react';

export default function Navbar({ onSearch, onToggleBookmarks, showBookmarksOnly, openAuthModal }) {
  const { user, logout, bookmarks } = useAuth();
  const [searchVal, setSearchVal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchVal.trim());
  };

  const handleClearSearch = () => {
    setSearchVal('');
    onSearch('');
  };

  return (
    <header style={styles.header}>
      {/* Top bar */}
      <nav style={styles.nav}>
        {/* Brand */}
        <div
          style={styles.brand}
          onClick={() => {
            handleClearSearch();
            if (showBookmarksOnly) onToggleBookmarks();
          }}
        >
          <span style={styles.brandText}>The Daily</span>
          <span style={styles.brandAccent}>Wire</span>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} style={styles.searchForm}>
          <div style={styles.searchWrap}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="input-field"
              style={styles.searchInput}
            />
            {searchVal && (
              <button type="button" onClick={handleClearSearch} style={styles.clearBtn}>
                ×
              </button>
            )}
          </div>
        </form>

        {/* Actions */}
        <div style={styles.actions}>
          {user ? (
            <>
              <button
                onClick={onToggleBookmarks}
                className="btn"
                style={{
                  ...styles.bookmarkBtn,
                  backgroundColor: showBookmarksOnly ? 'var(--accent-primary)' : 'transparent',
                  color: showBookmarksOnly ? '#fff' : 'var(--text-secondary)',
                  border: showBookmarksOnly ? 'none' : '1px solid var(--border-light)',
                }}
              >
                <Bookmark size={15} fill={showBookmarksOnly ? '#fff' : 'none'} />
                <span>Saved</span>
                {bookmarks.length > 0 && (
                  <span style={{
                    ...styles.count,
                    backgroundColor: showBookmarksOnly ? 'rgba(255,255,255,0.25)' : 'var(--bg-input)',
                    color: showBookmarksOnly ? '#fff' : 'var(--text-secondary)',
                  }}>
                    {bookmarks.length}
                  </span>
                )}
              </button>

              <div style={styles.userPill}>
                <div style={styles.avatar}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span style={styles.username}>{user.username}</span>
              </div>

              <button onClick={logout} className="btn-ghost" title="Sign out" style={styles.logoutBtn}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button onClick={openAuthModal} className="btn btn-primary" style={styles.loginBtn}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Thin accent line */}
      <div style={styles.accentLine} />
    </header>
  );
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'var(--bg-nav)',
    borderBottom: '1px solid var(--border-light)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '14px 28px',
    gap: '20px',
    flexWrap: 'wrap',
  },
  brand: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'baseline',
    gap: '5px',
    userSelect: 'none',
    flexShrink: 0,
  },
  brandText: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  brandAccent: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--accent-primary)',
    letterSpacing: '-0.02em',
  },
  searchForm: {
    flex: 1,
    maxWidth: '420px',
    minWidth: '180px',
  },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  searchInput: {
    paddingLeft: '38px',
    paddingRight: '34px',
    height: '38px',
    fontSize: '0.88rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-input)',
  },
  clearBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    lineHeight: 1,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  bookmarkBtn: {
    height: '36px',
    padding: '0 14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    fontWeight: '600',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  count: {
    padding: '1px 7px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.72rem',
    fontWeight: '700',
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px 4px 4px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-card)',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-secondary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.78rem',
    fontWeight: '700',
  },
  username: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    maxWidth: '100px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
  },
  loginBtn: {
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    padding: '0 20px',
  },
  accentLine: {
    height: '3px',
    background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-warm) 50%, var(--accent-primary) 100%)',
    opacity: 0.85,
  },
};
