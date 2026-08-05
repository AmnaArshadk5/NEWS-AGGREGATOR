import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search, LogOut, Bookmark, User, Shield, KeyRound,
  ChevronDown, History, TrendingUp, Trash2, X, Clock, CheckCheck, BookOpen, Sun, Moon, Menu
} from 'lucide-react';

const TRENDING_TOPICS = [
  "Artificial Intelligence", "Global Markets", "Space Exploration", "Climate Summit", "Tech Layoffs"
];

export default function Navbar({
  onSearch,
  onToggleBookmarks,
  showBookmarksOnly,
  onToggleProgress,
  showProgressOnly,
  progressCount,
  openAuthModal,
  openAdminPanel,
  openChangePasswordModal,
  onGoHome
}) {
  const { user, logout, bookmarks } = useAuth();
  const [searchVal, setSearchVal] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Night Mode / Dark Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('news_app_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('news_app_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('news_app_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Search history state
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // History Management Panel state
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');
  const historyPanelRef = useRef(null);

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (msg, icon = '✓') => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  };

  // Load search history from localStorage on user change
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`searchHistory_${user.id}`);
      if (saved) {
        try { setSearchHistory(JSON.parse(saved)); } catch (e) {}
      }
    } else {
      setSearchHistory([]);
    }
  }, [user]);

  const persistHistory = (list) => {
    if (!user?.id) return;
    localStorage.setItem(`searchHistory_${user.id}`, JSON.stringify(list));
  };

  const saveSearchToHistory = (query) => {
    if (!user?.id || !query.trim()) return;
    const current = [...searchHistory];
    const index = current.findIndex(item => item.toLowerCase() === query.trim().toLowerCase());
    if (index > -1) current.splice(index, 1);
    current.unshift(query.trim());
    const limited = current.slice(0, 20); // keep up to 20 searches
    setSearchHistory(limited);
    persistHistory(limited);
  };

  const deleteHistoryItem = (item) => {
    const updated = searchHistory.filter(h => h !== item);
    setSearchHistory(updated);
    persistHistory(updated);
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    persistHistory([]);
    showToast('Search history cleared', '🗑');
  };

  const clearReadingHistory = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('progress_'));
    keys.forEach(k => localStorage.removeItem(k));
    setDropdownOpen(false);
    showToast('Reading history cleared', '🗑');
  };

  // Search submit
  const handleSearchSubmit = (query) => {
    if (query.trim()) {
      saveSearchToHistory(query.trim());
      onSearch(query.trim());
      setSearchVal(query.trim());
      setIsSearchFocused(false);
      setHistoryPanelOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearchSubmit(searchVal);
  };

  const handleClearSearch = () => {
    setSearchVal('');
    onSearch('');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (historyPanelRef.current && !historyPanelRef.current.contains(event.target)) {
        setHistoryPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredHistory = searchHistory.filter(h =>
    h.toLowerCase().includes(historyFilter.toLowerCase())
  );

  return (
    <header style={styles.header}>
      {/* Top bar */}
      <nav style={styles.nav}>
        {/* Brand */}
        <div
          style={styles.brand}
          onClick={() => {
            handleClearSearch();
            if (onGoHome) onGoHome();
            else if (showBookmarksOnly) onToggleBookmarks();
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
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="input-field"
              style={styles.searchInput}
            />
            {searchVal && (
              <button type="button" onClick={handleClearSearch} style={styles.clearBtn}>
                ×
              </button>
            )}

            {/* Smart Search Dropdown */}
            {isSearchFocused && user && (
              <div style={styles.searchDropdown}>
                {searchHistory.length > 0 && (
                  <div style={styles.searchGroup}>
                    <div style={styles.searchGroupHeader}>
                      <span style={styles.searchGroupTitle}>Recent Searches</span>
                      <button
                        style={styles.manageHistoryBtn}
                        onMouseDown={(e) => { e.preventDefault(); setHistoryPanelOpen(true); setIsSearchFocused(false); }}
                      >
                        Manage
                      </button>
                    </div>
                    {searchHistory.slice(0, 5).map((item, idx) => (
                      <div
                        key={`hist-${idx}`}
                        style={styles.searchItem}
                        onMouseDown={(e) => { e.preventDefault(); handleSearchSubmit(item); }}
                      >
                        <History size={14} color="var(--text-muted)" />
                        <span style={{ flex: 1 }}>{item}</span>
                        <span
                          style={styles.histItemDelete}
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteHistoryItem(item); }}
                          title="Remove"
                        >×</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ ...styles.searchGroup, borderBottom: 'none', marginBottom: 0 }}>
                  <span style={styles.searchGroupTitle}>Trending Now</span>
                  {TRENDING_TOPICS.map((item, idx) => (
                    <div
                      key={`trend-${idx}`}
                      style={styles.searchItem}
                      onMouseDown={(e) => { e.preventDefault(); handleSearchSubmit(item); }}
                    >
                      <TrendingUp size={14} color="var(--accent-primary)" />
                      <span style={{ fontWeight: '500' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Actions */}
        <div className="desktop-actions" style={styles.actions}>
          {user ? (
            <>
              {/* Admin Button */}
              {user.role === 'admin' && (
                <button
                  onClick={openAdminPanel}
                  className="btn"
                  style={styles.adminBtn}
                  title="Admin Dashboard"
                >
                  <Shield size={15} color="var(--accent-primary)" />
                  <span>Admin Panel</span>
                </button>
              )}

              {/* Reading Progress Button */}
              <button
                onClick={onToggleProgress}
                className="btn"
                style={{
                  ...styles.bookmarkBtn,
                  backgroundColor: showProgressOnly ? 'var(--accent-primary)' : 'transparent',
                  color: showProgressOnly ? '#fff' : 'var(--text-secondary)',
                  border: showProgressOnly ? 'none' : '1px solid var(--border-light)',
                }}
                title="Reading Progress & Incomplete Articles"
              >
                <BookOpen size={15} color={showProgressOnly ? '#fff' : 'var(--accent-primary)'} />
                <span>Progress</span>
                {progressCount > 0 && (
                  <span style={{
                    ...styles.count,
                    backgroundColor: showProgressOnly ? 'rgba(255,255,255,0.25)' : 'rgba(136, 19, 55, 0.1)',
                    color: showProgressOnly ? '#fff' : 'var(--accent-primary)',
                  }}>
                    {progressCount}
                  </span>
                )}
              </button>

              {/* Bookmarks Button */}
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

              {/* Night Mode Toggle Button */}
              <button
                onClick={toggleTheme}
                className="btn"
                style={{
                  ...styles.bookmarkBtn,
                  backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                  color: isDarkMode ? '#fbbf24' : 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                }}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Night Mode'}
              >
                {isDarkMode ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="var(--text-secondary)" />}
                <span>{isDarkMode ? 'Day' : 'Night'}</span>
              </button>

              {/* Profile Dropdown */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <div
                  style={styles.userPill}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div style={styles.avatar}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span style={styles.username}>{user.username}</span>
                  <ChevronDown size={14} color="var(--text-muted)" />
                </div>

                {dropdownOpen && (
                  <div style={styles.dropdownMenu}>
                    <div style={styles.dropdownHeader}>
                      <span style={styles.dropdownUser}>{user.username}</span>
                      <span style={styles.dropdownRole}>{user.role ? user.role.toUpperCase() : 'USER'}</span>
                    </div>
                    <div style={styles.dropdownDivider} />

                    {user.role === 'admin' && (
                      <button
                        onClick={() => { setDropdownOpen(false); openAdminPanel(); }}
                        style={styles.dropdownItem}
                      >
                        <Shield size={15} color="var(--accent-primary)" />
                        <span>Admin Control Panel</span>
                      </button>
                    )}

                    <button
                      onClick={() => { setDropdownOpen(false); openChangePasswordModal(); }}
                      style={styles.dropdownItem}
                    >
                      <KeyRound size={15} />
                      <span>Change Password</span>
                    </button>

                    <button
                      onClick={() => { setDropdownOpen(false); setHistoryPanelOpen(true); }}
                      style={styles.dropdownItem}
                    >
                      <History size={15} />
                      <span>Search History</span>
                    </button>

                    <button
                      onClick={clearReadingHistory}
                      style={styles.dropdownItem}
                    >
                      <Trash2 size={15} color="var(--text-muted)" />
                      <span>Clear Reading Progress</span>
                    </button>

                    <div style={styles.dropdownDivider} />

                    <button
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      style={{ ...styles.dropdownItem, color: '#ef4444' }}
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button onClick={openAuthModal} className="btn btn-primary" style={styles.loginBtn}>
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          className="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={22} color="var(--text-primary)" /> : <Menu size={22} color="var(--text-primary)" />}
        </button>
      </nav>

      {/* ── Mobile Navigation Drawer ── */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          {user ? (
            <div className="mobile-menu-items">
              <div className="mobile-user-card">
                <div className="mobile-user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="mobile-user-details">
                  <span className="mobile-user-name">{user.username}</span>
                  <span className="mobile-user-role">{user.role ? user.role.toUpperCase() : 'USER'}</span>
                </div>
              </div>

              {/* Progress Shelf */}
              <button
                onClick={() => { setMobileMenuOpen(false); onToggleProgress(); }}
                className={`mobile-menu-btn ${showProgressOnly ? 'active' : ''}`}
              >
                <BookOpen size={18} color="var(--accent-primary)" />
                <span>Reading Progress</span>
                {progressCount > 0 && <span className="mobile-badge">{progressCount}</span>}
              </button>

              {/* Saved Stories */}
              <button
                onClick={() => { setMobileMenuOpen(false); onToggleBookmarks(); }}
                className={`mobile-menu-btn ${showBookmarksOnly ? 'active' : ''}`}
              >
                <Bookmark size={18} color="var(--accent-primary)" />
                <span>Saved Stories</span>
                {bookmarks.length > 0 && <span className="mobile-badge">{bookmarks.length}</span>}
              </button>

              {/* Night Mode Switch */}
              <button
                onClick={toggleTheme}
                className="mobile-menu-btn"
              >
                {isDarkMode ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="var(--text-secondary)" />}
                <span>{isDarkMode ? 'Light Theme' : 'Night Mode'}</span>
              </button>

              {/* Admin Control Panel */}
              {user.role === 'admin' && (
                <button
                  onClick={() => { setMobileMenuOpen(false); openAdminPanel(); }}
                  className="mobile-menu-btn"
                >
                  <Shield size={18} color="var(--accent-primary)" />
                  <span>Admin Panel</span>
                </button>
              )}

              {/* Change Password */}
              <button
                onClick={() => { setMobileMenuOpen(false); openChangePasswordModal(); }}
                className="mobile-menu-btn"
              >
                <KeyRound size={18} />
                <span>Change Password</span>
              </button>

              {/* Search History */}
              <button
                onClick={() => { setMobileMenuOpen(false); setHistoryPanelOpen(true); }}
                className="mobile-menu-btn"
              >
                <History size={18} />
                <span>Search History</span>
              </button>

              {/* Sign Out */}
              <button
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                className="mobile-menu-btn logout"
              >
                <LogOut size={18} color="#ef4444" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="mobile-menu-items">
              <button onClick={toggleTheme} className="mobile-menu-btn">
                {isDarkMode ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="var(--text-secondary)" />}
                <span>{isDarkMode ? 'Light Theme' : 'Night Mode'}</span>
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); openAuthModal(); }}
                className="btn btn-primary mobile-signin-btn"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      )}

      {/* Thin accent line */}
      <div style={styles.accentLine} />

      {/* ─── Search History Management Panel ─── */}
      {historyPanelOpen && (
        <div style={styles.panelOverlay} onClick={() => setHistoryPanelOpen(false)}>
          <div style={styles.historyPanel} ref={historyPanelRef} onClick={e => e.stopPropagation()}>
            {/* Panel header */}
            <div style={styles.panelHeader}>
              <div style={styles.panelTitleRow}>
                <History size={18} color="var(--accent-primary)" />
                <h2 style={styles.panelTitle}>Search History</h2>
                <span style={styles.panelCount}>{searchHistory.length} searches</span>
              </div>
              <button style={styles.panelCloseBtn} onClick={() => setHistoryPanelOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Filter bar within history */}
            <div style={styles.historySearch}>
              <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Filter your history…"
                value={historyFilter}
                onChange={e => setHistoryFilter(e.target.value)}
                className="input-field"
                style={styles.historySearchInput}
                autoFocus
              />
              {historyFilter && (
                <button style={styles.clearBtn} onClick={() => setHistoryFilter('')}>×</button>
              )}
            </div>

            {/* Bulk actions */}
            {searchHistory.length > 0 && (
              <div style={styles.bulkActions}>
                <span style={styles.bulkLabel}>{filteredHistory.length} result{filteredHistory.length !== 1 ? 's' : ''}</span>
                <button style={styles.clearAllBtn} onClick={clearAllHistory}>
                  <Trash2 size={13} />
                  Clear All History
                </button>
              </div>
            )}

            {/* History list */}
            <div style={styles.historyList}>
              {filteredHistory.length === 0 ? (
                <div style={styles.emptyState}>
                  <Clock size={40} color="var(--text-muted)" />
                  <p style={styles.emptyTitle}>
                    {searchHistory.length === 0 ? 'No search history yet' : 'No matches found'}
                  </p>
                  <p style={styles.emptySubtitle}>
                    {searchHistory.length === 0
                      ? 'Your searches will appear here'
                      : `No history matches "${historyFilter}"`}
                  </p>
                </div>
              ) : (
                filteredHistory.map((item, idx) => (
                  <div key={`hp-${idx}`} style={styles.historyRow}>
                    <div
                      style={styles.historyRowLeft}
                      onClick={() => handleSearchSubmit(item)}
                      title={`Search for "${item}"`}
                    >
                      <Clock size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <span style={styles.historyRowText}>{item}</span>
                    </div>
                    <div style={styles.historyRowActions}>
                      <button
                        style={styles.historyActionBtn}
                        onClick={() => handleSearchSubmit(item)}
                        title="Search again"
                      >
                        <Search size={13} />
                      </button>
                      <button
                        style={{ ...styles.historyActionBtn, color: '#ef4444' }}
                        onClick={() => deleteHistoryItem(item)}
                        title="Delete this item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Trending suggestions at the bottom */}
            <div style={styles.panelTrending}>
              <span style={styles.panelTrendingTitle}>Trending Topics</span>
              <div style={styles.panelTrendingChips}>
                {TRENDING_TOPICS.map((topic, idx) => (
                  <button
                    key={idx}
                    style={styles.trendingChip}
                    onClick={() => handleSearchSubmit(topic)}
                  >
                    <TrendingUp size={12} />
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={styles.toast}>
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}
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
    zIndex: 2,
  },
  searchInput: {
    paddingLeft: '38px',
    paddingRight: '34px',
    height: '40px',
    fontSize: '0.88rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-input)',
    width: '100%',
    transition: 'all 0.2s ease',
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
    zIndex: 2,
  },
  searchDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    width: '100%',
    maxWidth: '100%',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-light)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    padding: '8px 0',
    zIndex: 200,
  },
  searchGroup: {
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid var(--border-light)',
  },
  searchGroupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 16px 8px',
  },
  searchGroupTitle: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  manageHistoryBtn: {
    background: 'none',
    border: 'none',
    fontSize: '0.78rem',
    color: 'var(--accent-primary)',
    cursor: 'pointer',
    fontWeight: '600',
    padding: 0,
  },
  searchItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    transition: 'background 0.15s ease',
  },
  histItemDelete: {
    fontSize: '1.1rem',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
    opacity: 0.6,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  adminBtn: {
    height: '36px',
    padding: '0 14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    fontWeight: '600',
    gap: '6px',
    backgroundColor: 'rgba(136, 19, 55, 0.08)',
    color: 'var(--accent-primary)',
    border: '1px solid rgba(136, 19, 55, 0.2)',
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
    padding: '4px 10px 4px 4px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-card)',
    cursor: 'pointer',
    userSelect: 'none',
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
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '220px',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-md)',
    padding: '6px',
    zIndex: 110,
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownHeader: {
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownUser: {
    fontWeight: '700',
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
  },
  dropdownRole: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--accent-primary)',
    marginTop: '2px',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: 'var(--border-light)',
    margin: '4px 0',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.15s ease',
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

  // ─── History Panel ───
  panelOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(3px)',
    zIndex: 500,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '80px',
  },
  historyPanel: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-xl)',
    width: '100%',
    maxWidth: '540px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    margin: '0 20px',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--border-light)',
    flexShrink: 0,
  },
  panelTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  panelTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  panelCount: {
    fontSize: '0.78rem',
    fontWeight: '700',
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-muted)',
    padding: '2px 10px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-light)',
  },
  panelCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
  },
  historySearch: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 24px',
    borderBottom: '1px solid var(--border-light)',
    flexShrink: 0,
  },
  historySearchInput: {
    flex: 1,
    height: '38px',
    fontSize: '0.9rem',
    border: 'none',
    background: 'transparent',
    outline: 'none',
    color: 'var(--text-primary)',
  },
  bulkActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 24px',
    flexShrink: 0,
    backgroundColor: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--border-light)',
  },
  bulkLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  clearAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-sm)',
    padding: '5px 12px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#ef4444',
  },
  historyList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  historyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 24px',
    transition: 'background 0.15s ease',
    gap: '12px',
  },
  historyRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    cursor: 'pointer',
    overflow: 'hidden',
  },
  historyRowText: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  historyRowActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  historyActionBtn: {
    background: 'none',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-sm)',
    padding: '5px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.15s ease',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    gap: '12px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  emptySubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  panelTrending: {
    padding: '14px 24px',
    borderTop: '1px solid var(--border-light)',
    flexShrink: 0,
    backgroundColor: 'var(--bg-elevated)',
  },
  panelTrendingTitle: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '10px',
  },
  panelTrendingChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  trendingChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Toast
  toast: {
    position: 'fixed',
    bottom: '28px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderLeft: '4px solid var(--accent-primary)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    padding: '12px 22px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    zIndex: 9999,
    animation: 'slideUp 0.3s ease',
  },
};
