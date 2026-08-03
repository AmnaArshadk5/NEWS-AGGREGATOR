import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import NewsCard from './components/NewsCard';
import AuthModal from './components/AuthModal';
import { RefreshCw, Newspaper, AlertTriangle, SlidersHorizontal, Zap, Clock } from 'lucide-react';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'technology', label: 'Technology' },
  { id: 'business', label: 'Business' },
  { id: 'sports', label: 'Sports' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'health', label: 'Health' },
  { id: 'science', label: 'Science' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

const TIMEFRAME_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '24h', label: 'Past 24 Hours' },
  { value: 'week', label: 'Past Week' },
  { value: 'month', label: 'Past Month' },
];

const YEAR_OPTIONS = [
  { value: '', label: 'All Years' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
];

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  const { user, bookmarks, isLoadingBookmarks } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Per-user 5-min client-side cache
  // Structure: { [cacheKey]: { data: [], timestamp: number, userId: string|null } }
  const newsCache = useRef({});
  const [cacheStatus, setCacheStatus] = useState(null); // { fromCache: bool, expiresAt: number }
  const prevUserId = useRef(user?.id ?? null);

  // Clear cache whenever the logged-in user changes (login / logout)
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (prevUserId.current !== currentId) {
      newsCache.current = {};
      setCacheStatus(null);
      prevUserId.current = currentId;
    }
  }, [user]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [timeframe, setTimeframe] = useState('all');
  const [year, setYear] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Bookmarks panel toggle
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Build a deterministic cache key from the current user + query params
  const buildCacheKey = useCallback(() => {
    const uid = user?.id ?? 'guest';
    return `${uid}::${selectedCategory}::${searchQuery}::${sortBy}::${year}::${timeframe}`;
  }, [user, selectedCategory, searchQuery, sortBy, year, timeframe]);

  // Fetch news — checks 5-min per-user cache first
  const fetchNews = useCallback(async (forceRefresh = false) => {
    if (showBookmarksOnly) return;

    const cacheKey = buildCacheKey();
    const cached = newsCache.current[cacheKey];
    const now = Date.now();

    // Serve from cache if valid and not a forced refresh
    if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
      setArticles(cached.data);
      setCacheStatus({ fromCache: true, expiresAt: cached.timestamp + CACHE_TTL_MS });
      return;
    }

    setLoading(true);
    setError(null);
    setCacheStatus(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (searchQuery) params.set('q', searchQuery);
      if (sortBy) params.set('sortBy', sortBy);
      if (year) params.set('year', year);
      if (timeframe) params.set('timeframe', timeframe);

      const response = await fetch(`${API_BASE_URL}/news?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to retrieve news. Please ensure the server is running.');
      }

      const data = await response.json();

      // Store in per-user cache
      newsCache.current[cacheKey] = { data, timestamp: Date.now(), userId: user?.id ?? 'guest' };
      setArticles(data);
      setCacheStatus({ fromCache: false, expiresAt: Date.now() + CACHE_TTL_MS });
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching news.');
    } finally {
      setLoading(false);
    }
  }, [showBookmarksOnly, buildCacheKey, selectedCategory, searchQuery, sortBy, year, timeframe, user]);

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, searchQuery, showBookmarksOnly, sortBy, year, timeframe]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleBookmarksView = () => {
    setShowBookmarksOnly(!showBookmarksOnly);
  };

  const getDisplayArticles = () => {
    if (!showBookmarksOnly) return articles;

    let filtered = [...bookmarks].map((b) => ({
      title: b.title,
      description: b.description,
      url: b.url,
      urlToImage: b.url_to_image || b.urlToImage,
      publishedAt: b.published_at || b.publishedAt,
      source: { name: b.source_name || b.source?.name },
      author: b.author,
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (art) =>
          (art.title && art.title.toLowerCase().includes(q)) ||
          (art.description && art.description.toLowerCase().includes(q))
      );
    }

    // Apply year filter locally for bookmarks
    if (year) {
      const y = parseInt(year, 10);
      filtered = filtered.filter((art) => {
        const d = art.publishedAt;
        if (!d) return false;
        return new Date(d).getFullYear() === y;
      });
    }

    // Apply timeframe filter locally for bookmarks
    if (timeframe && timeframe !== 'all') {
      const now = Date.now();
      let cutoff;
      if (timeframe === '24h') cutoff = now - 24 * 60 * 60 * 1000;
      else if (timeframe === 'week') cutoff = now - 7 * 24 * 60 * 60 * 1000;
      else if (timeframe === 'month') cutoff = now - 30 * 24 * 60 * 60 * 1000;
      if (cutoff) {
        filtered = filtered.filter((art) => {
          const d = art.publishedAt;
          if (!d) return false;
          return new Date(d).getTime() >= cutoff;
        });
      }
    }

    // Apply sort locally for bookmarks
    filtered.sort((a, b) => {
      const da = new Date(a.publishedAt || 0);
      const db = new Date(b.publishedAt || 0);
      return sortBy === 'oldest' ? da - db : db - da;
    });

    return filtered;
  };

  const displayArticles = getDisplayArticles();
  const activeFilterCount = [year, timeframe !== 'all' ? timeframe : '', sortBy !== 'newest' ? sortBy : ''].filter(Boolean).length;

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Navbar
        onSearch={handleSearch}
        onToggleBookmarks={toggleBookmarksView}
        showBookmarksOnly={showBookmarksOnly}
        openAuthModal={() => setIsAuthModalOpen(true)}
      />

      <main style={styles.main}>
        <div style={styles.container}>
          {/* Page Header */}
          <section style={styles.pageHeader}>
            <div style={styles.headerTop}>
              <div>
                <p style={styles.dateLabel}>{currentDate}</p>
                <h1 style={styles.pageTitle}>
                  {showBookmarksOnly
                    ? 'Saved Articles'
                    : searchQuery
                    ? `Results for "${searchQuery}"`
                    : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} News`}
                </h1>
              </div>
              <div style={styles.headerActions}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-secondary"
                  style={styles.filterToggleBtn}
                >
                  <SlidersHorizontal size={15} />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span style={styles.filterBadge}>{activeFilterCount}</span>
                  )}
                </button>
                {!showBookmarksOnly && (
                  <button
                    onClick={() => fetchNews(true)}
                    className="btn-ghost"
                    style={styles.refreshBtn}
                    title="Force refresh (bypass cache)"
                  >
                    <RefreshCw size={16} className={loading ? 'spinner' : ''} />
                  </button>
                )}
              </div>
            </div>

            {/* Category pills */}
            {!showBookmarksOnly && (
              <div style={styles.categoryBar} className="hide-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    style={{
                      ...styles.pill,
                      ...(selectedCategory === cat.id ? styles.pillActive : {}),
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Expandable Filter Bar */}
            {showFilters && (
              <div style={styles.filterBar}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Sort By</label>
                  <select
                    className="select-field"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Year</label>
                  <select
                    className="select-field"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    {YEAR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Timeframe</label>
                  <select
                    className="select-field"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                  >
                    {TIMEFRAME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {(year || timeframe !== 'all' || sortBy !== 'newest') && (
                  <button
                    onClick={() => {
                      setYear('');
                      setTimeframe('all');
                      setSortBy('newest');
                    }}
                    style={styles.clearFiltersBtn}
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </section>

          <div style={styles.divider} />

          {/* Cache status bar */}
          {!showBookmarksOnly && cacheStatus && !loading && !error && (
            <CacheStatusBar status={cacheStatus} onRefresh={() => fetchNews(true)} />
          )}

          {!loading && !error && displayArticles.length > 0 && (
            <p style={styles.resultsCount}>
              Showing <strong>{displayArticles.length}</strong> article{displayArticles.length !== 1 ? 's' : ''}
            </p>
          )}

          {/* Error */}
          {error && (
            <div style={styles.stateCard}>
              <AlertTriangle size={36} color="var(--accent-warm)" />
              <h3 style={styles.stateTitle}>Unable to load articles</h3>
              <p style={styles.stateText}>{error}</p>
              <button onClick={fetchNews} className="btn btn-primary">
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && !error && (
            <div style={styles.grid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={styles.skeletonCard}>
                  <div className="skeleton" style={styles.skeletonImg} />
                  <div style={styles.skeletonBody}>
                    <div className="skeleton" style={{ height: '14px', width: '30%', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ height: '20px', width: '90%', borderRadius: '4px', marginTop: '10px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '100%', borderRadius: '4px', marginTop: '8px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '70%', borderRadius: '4px', marginTop: '4px' }} />
                    <div className="skeleton" style={{ height: '32px', width: '40%', borderRadius: '6px', marginTop: 'auto' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && displayArticles.length === 0 && (
            <div style={styles.stateCard}>
              <Newspaper size={42} color="var(--accent-primary)" />
              <h3 style={styles.stateTitle}>No articles found</h3>
              <p style={styles.stateText}>
                {showBookmarksOnly
                  ? "You haven't saved any articles yet, or none match your active filters."
                  : 'No articles match your current search and filter criteria. Try adjusting your selections.'}
              </p>
              {showBookmarksOnly && bookmarks.length === 0 && (
                <button
                  onClick={() => setShowBookmarksOnly(false)}
                  className="btn btn-primary"
                >
                  Browse Headlines
                </button>
              )}
            </div>
          )}

          {/* Article Grid */}
          {!loading && !error && displayArticles.length > 0 && (
            <div style={styles.grid}>
              {displayArticles.map((article, index) => (
                <NewsCard
                  key={article.url || index}
                  article={article}
                  onRequireAuth={() => setIsAuthModalOpen(true)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <p style={styles.footerText}>
            © 2026 <strong>The Daily Wire</strong>. Your trusted source for global news.
          </p>
          <p style={styles.footerSub}>Powered by NewsAPI</p>
        </div>
      </footer>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
        article:hover { box-shadow: var(--shadow-md) !important; }
        article:hover img { transform: scale(1.03); }
        article:hover h3 { color: var(--accent-primary) !important; }
      `}</style>
    </>
  );
}

const styles = {
  main: {
    flex: 1,
    padding: '0 0 48px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 28px',
  },
  pageHeader: {
    padding: '28px 0 0',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  dateLabel: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
    marginBottom: '4px',
  },
  pageTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.8rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  filterToggleBtn: {
    height: '36px',
    fontSize: '0.84rem',
    gap: '6px',
    position: 'relative',
  },
  filterBadge: {
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    fontSize: '0.68rem',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    borderRadius: 'var(--radius-sm)',
    padding: '8px',
    color: 'var(--text-muted)',
  },
  categoryBar: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  pill: {
    padding: '7px 16px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-light)',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    fontSize: '0.84rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  pillActive: {
    backgroundColor: 'var(--accent-secondary)',
    color: '#fff',
    borderColor: 'var(--accent-secondary)',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
    flexWrap: 'wrap',
    marginTop: '18px',
    padding: '18px 20px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  filterLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  clearFiltersBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 0',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-light)',
    margin: '20px 0',
  },
  resultsCount: {
    fontSize: '0.84rem',
    color: 'var(--text-muted)',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '22px',
  },
  stateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '64px 32px',
    maxWidth: '460px',
    margin: '32px auto',
    gap: '14px',
  },
  stateTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.2rem',
    color: 'var(--text-primary)',
  },
  stateText: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    lineHeight: '1.6',
    marginBottom: '8px',
  },

  // Skeletons
  skeletonCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-light)',
    overflow: 'hidden',
    height: '420px',
    display: 'flex',
    flexDirection: 'column',
  },
  skeletonImg: {
    height: '190px',
    width: '100%',
  },
  skeletonBody: {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  footer: {
    borderTop: '1px solid var(--border-light)',
    padding: '28px',
    marginTop: 'auto',
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  footerSub: {
    fontSize: '0.76rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
};

// ─── CacheStatusBar ───────────────────────────────────────────────────────────
// Shows a slim indicator below the divider with cache hit/miss status + countdown.

function CacheStatusBar({ status, onRefresh }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const remaining = status.expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft('expired');
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}m ${secs}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [status.expiresAt]);

  if (status.fromCache) {
    return (
      <div style={cacheBarStyles.row}>
        <div style={cacheBarStyles.pill}>
          <Zap size={12} color="var(--accent-warm)" />
          <span style={cacheBarStyles.cached}>Served from cache</span>
          <span style={cacheBarStyles.sep}>·</span>
          <Clock size={12} color="var(--text-muted)" />
          <span style={cacheBarStyles.timer}>expires in {timeLeft}</span>
        </div>
        <button onClick={onRefresh} style={cacheBarStyles.refreshLink}>
          Fetch fresh data
        </button>
      </div>
    );
  }

  return (
    <div style={cacheBarStyles.row}>
      <div style={cacheBarStyles.pillLive}>
        <span style={cacheBarStyles.liveDot} />
        <span style={cacheBarStyles.liveText}>Live</span>
        <span style={cacheBarStyles.sep}>·</span>
        <Clock size={12} color="var(--text-muted)" />
        <span style={cacheBarStyles.timer}>cached for {timeLeft}</span>
      </div>
    </div>
  );
}

const cacheBarStyles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 12px',
    borderRadius: '999px',
    backgroundColor: 'rgba(180, 83, 9, 0.07)',
    border: '1px solid rgba(180, 83, 9, 0.18)',
    fontSize: '0.76rem',
  },
  pillLive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 12px',
    borderRadius: '999px',
    backgroundColor: 'rgba(22, 101, 52, 0.06)',
    border: '1px solid rgba(22, 101, 52, 0.15)',
    fontSize: '0.76rem',
  },
  cached: {
    fontWeight: '600',
    color: 'var(--accent-warm)',
  },
  liveText: {
    fontWeight: '700',
    color: 'var(--accent-success)',
    fontSize: '0.76rem',
  },
  liveDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#16a34a',
    display: 'inline-block',
  },
  timer: {
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  sep: {
    color: 'var(--border-medium)',
    fontSize: '0.9rem',
  },
  refreshLink: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontSize: '0.78rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
};

