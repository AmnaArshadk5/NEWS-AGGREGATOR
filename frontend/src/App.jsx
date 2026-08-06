import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { API_BASE_URL } from './config';
import Navbar from './components/Navbar';
import NewsCard from './components/NewsCard';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import LandingPage from './components/LandingPage';
import ChangePasswordModal from './components/ChangePasswordModal';
import ReadingProgressPage from './components/ReadingProgressPage';
import { RefreshCw, Newspaper, AlertTriangle, SlidersHorizontal, Zap, Clock } from 'lucide-react';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'General', slug: 'general' },
  { id: 2, name: 'Technology', slug: 'technology' },
  { id: 3, name: 'Business', slug: 'business' },
  { id: 4, name: 'Sports', slug: 'sports' },
  { id: 5, name: 'Entertainment', slug: 'entertainment' },
  { id: 6, name: 'Health', slug: 'health' },
  { id: 7, name: 'Science', slug: 'science' },
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

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: '', label: 'All Years' },
  ...Array.from({ length: currentYear - 2014 }, (_, i) => {
    const y = String(currentYear - i);
    return { value: y, label: y };
  }),
];

const COUNTRY_OPTIONS = [
  { value: '', label: '🌍 All Countries' },
  { value: 'au', label: '🇦🇺 Australia' },
  { value: 'at', label: '🇦🇹 Austria' },
  { value: 'be', label: '🇧🇪 Belgium' },
  { value: 'br', label: '🇧🇷 Brazil' },
  { value: 'bg', label: '🇧🇬 Bulgaria' },
  { value: 'ca', label: '🇨🇦 Canada' },
  { value: 'cn', label: '🇨🇳 China' },
  { value: 'co', label: '🇨🇴 Colombia' },
  { value: 'cu', label: '🇨🇺 Cuba' },
  { value: 'cz', label: '🇨🇿 Czech Republic' },
  { value: 'eg', label: '🇪🇬 Egypt' },
  { value: 'fr', label: '🇫🇷 France' },
  { value: 'de', label: '🇩🇪 Germany' },
  { value: 'gr', label: '🇬🇷 Greece' },
  { value: 'hk', label: '🇭🇰 Hong Kong' },
  { value: 'hu', label: '🇭🇺 Hungary' },
  { value: 'in', label: '🇮🇳 India' },
  { value: 'id', label: '🇮🇩 Indonesia' },
  { value: 'ie', label: '🇮🇪 Ireland' },
  { value: 'il', label: '🇮🇱 Israel' },
  { value: 'it', label: '🇮🇹 Italy' },
  { value: 'jp', label: '🇯🇵 Japan' },
  { value: 'lv', label: '🇱🇻 Latvia' },
  { value: 'lt', label: '🇱🇹 Lithuania' },
  { value: 'my', label: '🇲🇾 Malaysia' },
  { value: 'mx', label: '🇲🇽 Mexico' },
  { value: 'ma', label: '🇲🇦 Morocco' },
  { value: 'nl', label: '🇳🇱 Netherlands' },
  { value: 'nz', label: '🇳🇿 New Zealand' },
  { value: 'ng', label: '🇳🇬 Nigeria' },
  { value: 'no', label: '🇳🇴 Norway' },
  { value: 'pk', label: '🇵🇰 Pakistan' },
  { value: 'pe', label: '🇵🇪 Peru' },
  { value: 'ph', label: '🇵🇭 Philippines' },
  { value: 'pl', label: '🇵🇱 Poland' },
  { value: 'pt', label: '🇵🇹 Portugal' },
  { value: 'ro', label: '🇷🇴 Romania' },
  { value: 'ru', label: '🇷🇺 Russia' },
  { value: 'sa', label: '🇸🇦 Saudi Arabia' },
  { value: 'rs', label: '🇷🇸 Serbia' },
  { value: 'sg', label: '🇸🇬 Singapore' },
  { value: 'sk', label: '🇸🇰 Slovakia' },
  { value: 'si', label: '🇸🇮 Slovenia' },
  { value: 'za', label: '🇿🇦 South Africa' },
  { value: 'kr', label: '🇰🇷 South Korea' },
  { value: 'se', label: '🇸🇪 Sweden' },
  { value: 'ch', label: '🇨🇭 Switzerland' },
  { value: 'tw', label: '🇹🇼 Taiwan' },
  { value: 'th', label: '🇹🇭 Thailand' },
  { value: 'tr', label: '🇹🇷 Turkey' },
  { value: 'ua', label: '🇺🇦 Ukraine' },
  { value: 'ae', label: '🇦🇪 UAE' },
  { value: 'gb', label: '🇬🇧 United Kingdom' },
  { value: 'us', label: '🇺🇸 United States' },
  { value: 've', label: '🇻🇪 Venezuela' },
];

import PushNotificationBanner from './components/PushNotificationBanner';
import ChannelPage from './components/ChannelPage';

export default function App() {
  const { user, bookmarks, isLoadingBookmarks, sessionNotice, setSessionNotice } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dynamic Categories from Backend API
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);

  // Per-user 5-min client-side cache
  const newsCache = useRef({});
  const [cacheStatus, setCacheStatus] = useState(null);
  const prevUserId = useRef(user?.id ?? null);

  // Clear cache & reset views to home whenever the logged-in user changes (login / logout)
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (prevUserId.current !== currentId) {
      newsCache.current = {};
      setCacheStatus(null);
      setShowBookmarksOnly(false);
      setShowProgressOnly(false);
      setSearchQuery('');
      prevUserId.current = currentId;
    }
  }, [user]);

  // Fetch Public Categories from Backend API
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setCategories(data);
        }
      }
    } catch (err) {
      console.error('Error loading public categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Set default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].slug);
    }
  }, [categories, selectedCategory]);

  // Ensure selectedCategory always points to an existing category
  useEffect(() => {
    const exists = categories.some(cat => cat.slug === selectedCategory);
    if (!exists && categories.length > 0) {
      setSelectedCategory(categories[0].slug);
    }
  }, [categories, selectedCategory]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [timeframe, setTimeframe] = useState('all');
  const [year, setYear] = useState('');
const [selectedCountry, setSelectedCountry] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Bookmarks panel toggle
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showProgressOnly, setShowProgressOnly] = useState(false);

  // Calculate incomplete progress count from localStorage for logged-in user
  const getInProgressCount = () => {
    const userId = user?.id ? user.id : 'guest';
    const prefix = `progress_${userId}_`;
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && !key.startsWith(`progress_article_${userId}_`)) {
        const val = parseInt(localStorage.getItem(key) || '0', 10);
        if (val > 0 && val < 100) count++;
      }
    }
    return count;
  };

  // View State ('home' or 'admin')
  const [currentView, setCurrentView] = useState('home');

  // Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Build a deterministic cache key from the current user + query params
  const buildCacheKey = useCallback(() => {
  const uid = user?.id ?? 'guest';
  return `${uid}::${selectedCategory}::${searchQuery}::${sortBy}::${year}::${timeframe}::${selectedCountry}`;
}, [user, selectedCategory, searchQuery, sortBy, year, timeframe, selectedCountry]);

// Fetch news — checks 5-min per-user cache first
const fetchNews = useCallback(async (forceRefresh = false) => {
  if (showBookmarksOnly || showProgressOnly) return;

  // If no category selected yet, set to first available and skip this call (will re-trigger via effect)
  if (!selectedCategory) {
    if (categories.length > 0) {
      setSelectedCategory(categories[0].slug);
    }
    return;
  }

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
    if (selectedCountry) params.set('country', selectedCountry);

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
}, [showBookmarksOnly, buildCacheKey, selectedCategory, searchQuery, sortBy, year, timeframe, selectedCountry, user]);

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, searchQuery, showBookmarksOnly, sortBy, year, timeframe, selectedCountry, fetchNews]);

  const handleSelectChannel = (channelName) => {
    setShowProgressOnly(false);
    setShowBookmarksOnly(false);
    setSelectedCategory('');
    setSelectedChannel(channelName);
  };

  const handleCategorySelect = (categorySlug) => {
    setShowProgressOnly(false);
    setShowBookmarksOnly(false);
    setSelectedChannel(null);
    setSelectedCategory(categorySlug);
  };

  const handleSearch = (query) => {
    setShowProgressOnly(false);
    setShowBookmarksOnly(false);
    setSelectedChannel(null);
    setSearchQuery(query);
  };

  const toggleBookmarksView = () => {
    setShowProgressOnly(false);
    setSelectedChannel(null);
    setShowBookmarksOnly(!showBookmarksOnly);
  };

  const toggleProgressView = () => {
    setShowBookmarksOnly(false);
    setSelectedChannel(null);
    setShowProgressOnly(!showProgressOnly);
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

    if (year) {
      const y = parseInt(year, 10);
      filtered = filtered.filter((art) => {
        const d = art.publishedAt;
        if (!d) return false;
        return new Date(d).getFullYear() === y;
      });
    }

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

    filtered.sort((a, b) => {
      const da = new Date(a.publishedAt || 0);
      const db = new Date(b.publishedAt || 0);
      return sortBy === 'oldest' ? da - db : db - da;
    });

    return filtered;
  };

  const displayArticles = getDisplayArticles();
  const activeFilterCount = [year, timeframe !== 'all' ? timeframe : '', sortBy !== 'newest' ? sortBy : '', selectedCountry].filter(Boolean).length;

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // -------------------------------------------------------------
  // ROLE-BASED ROUTING
  // -------------------------------------------------------------

  if (!user) {
    return (
      <>
        <LandingPage onLoginClick={() => setIsAuthModalOpen(true)} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }

  if (user.role === 'admin') {
    return (
      <>
        <AdminPanel 
          onCategoriesUpdated={fetchCategories} 
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        />
        <ChangePasswordModal 
          isOpen={isChangePasswordOpen} 
          onClose={() => setIsChangePasswordOpen(false)} 
        />
      </>
    );
  }

  // STANDARD USER LAYOUT
  const resetHome = () => {
    setShowBookmarksOnly(false);
    setShowProgressOnly(false);
    setSelectedChannel(null);
    setSearchQuery('');
    if (categories.length > 0) {
      setSelectedCategory(categories[0].slug);
    } else {
      setSelectedCategory('');
    }
  };

  return (
    <>
      <Navbar
        onSearch={handleSearch}
        onToggleBookmarks={toggleBookmarksView}
        showBookmarksOnly={showBookmarksOnly}
        onToggleProgress={toggleProgressView}
        showProgressOnly={showProgressOnly}
        progressCount={getInProgressCount()}
        openChangePasswordModal={() => setIsChangePasswordOpen(true)}
        onGoHome={resetHome}
        onSelectChannel={handleSelectChannel}
      />
      <PushNotificationBanner />

      <main style={styles.main}>
        {selectedChannel ? (
          <ChannelPage
            channelName={selectedChannel}
            articles={articles}
            onGoBack={() => setSelectedChannel(null)}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onSelectChannel={handleSelectChannel}
          />
        ) : showProgressOnly ? (
          <ReadingProgressPage onGoHome={resetHome} />
        ) : (
          <div style={styles.container}>
          {/* Security Session Notice Banner */}
          {sessionNotice && (
            <div style={styles.sessionNoticeBanner}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--accent-warm)" />
                <span>{sessionNotice}</span>
              </div>
              <button onClick={() => setSessionNotice(null)} style={styles.noticeCloseBtn}>×</button>
            </div>
          )}

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

            {/* Dynamic Category pills */}
            {!showBookmarksOnly && (
              <div style={styles.categoryBar} className="hide-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.slug || cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    style={{
                      ...styles.pill,
                      ...(selectedCategory === cat.slug ? styles.pillActive : {}),
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Expandable Filter Bar */}
                {showFilters && (
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Sort By</label>
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Year</label>
          <CustomSelect
            value={year}
            onChange={setYear}
            options={YEAR_OPTIONS}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Timeframe</label>
          <CustomSelect
            value={timeframe}
            onChange={setTimeframe}
            options={TIMEFRAME_OPTIONS}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Country</label>
          <CountryPicker
            value={selectedCountry}
            onChange={setSelectedCountry}
            options={COUNTRY_OPTIONS}
          />
        </div>
        {(year || timeframe !== 'all' || sortBy !== 'newest' || selectedCountry) && (
          <button
            onClick={() => {
              setYear('');
              setTimeframe('all');
              setSortBy('newest');
              setSelectedCountry('');
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

          {/* Results count */}
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
              <button onClick={() => fetchNews(true)} className="btn btn-primary">
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
                  onSelectChannel={handleSelectChannel}
                />
              ))}
            </div>
          )}
        </div>
        )}
      </main>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />

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
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
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
  sessionNoticeBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(180, 83, 9, 0.08)',
    border: '1px solid rgba(180, 83, 9, 0.25)',
    color: 'var(--accent-warm)',
    padding: '12px 18px',
    borderRadius: 'var(--radius-md)',
    marginTop: '20px',
    fontSize: '0.88rem',
    fontWeight: '600',
  },
  noticeCloseBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--accent-warm)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0 4px',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-light)',
    backgroundColor: 'var(--bg-card)',
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
    borderWidth: '1px',
    borderStyle: 'solid',
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
    backgroundColor: 'transparent',
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

// --- CacheStatusBar Component ---
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

// --- CustomSelect Component ---
// Generic fixed-position dropdown — always opens downward.
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find(o => o.value === value) || options[0];

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 160) });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onScroll = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        style={cpStyles.trigger}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{selected?.label}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          ref={panelRef}
          style={{ ...cpStyles.panel, top: pos.top, left: pos.left, width: pos.width, maxHeight: '240px' }}
        >
          <div style={cpStyles.list}>
            {options.map(opt => (
              <div
                key={opt.value}
                style={{
                  ...cpStyles.option,
                  ...(opt.value === value ? cpStyles.optionActive : {}),
                }}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                {opt.label}
                {opt.value === value && <span style={cpStyles.check}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// --- CountryPicker Component ---
// Custom dropdown that always opens DOWNWARD using position:fixed,
// immune to parent overflow:hidden clipping.
function CountryPicker({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find(o => o.value === value) || options[0];
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
      });
    }
    setOpen(true);
    setSearch('');
  };

  // Close on outside click OR any scroll
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onScroll = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <>
      {/* Trigger button styled like other selects */}
      <button
        ref={triggerRef}
        onClick={() => open ? setOpen(false) : openDropdown()}
        style={cpStyles.trigger}
        type="button"
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{selected.label}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Portal-like panel anchored via position:fixed */}
      {open && (
        <div
          ref={panelRef}
          style={{
            ...cpStyles.panel,
            top: pos.top,
            left: pos.left,
            width: pos.width,
          }}
        >
          {/* Search input */}
          <div style={cpStyles.searchWrap}>
            <span style={cpStyles.searchIcon}>🔍</span>
            <input
              autoFocus
              type="text"
              placeholder="Search country…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={cpStyles.searchInput}
            />
            {search && (
              <button style={cpStyles.clearSearch} onClick={() => setSearch('')}>×</button>
            )}
          </div>

          {/* Options list */}
          <div style={cpStyles.list}>
            {filtered.length === 0 ? (
              <div style={cpStyles.noResult}>No countries found</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.value}
                  style={{
                    ...cpStyles.option,
                    ...(opt.value === value ? cpStyles.optionActive : {}),
                  }}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                >
                  {opt.label}
                  {opt.value === value && <span style={cpStyles.check}>✓</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

const cpStyles = {
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    height: '38px',
    minWidth: '180px',
    padding: '0 12px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.88rem',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    textAlign: 'left',
    transition: 'border-color 0.15s',
  },
  panel: {
    position: 'fixed',
    zIndex: 9999,
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    maxHeight: '340px',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 12px',
    borderBottom: '1px solid var(--border-light)',
    flexShrink: 0,
  },
  searchIcon: {
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  clearSearch: {
    background: 'none',
    border: 'none',
    fontSize: '1.1rem',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
  },
  list: {
    overflowY: 'auto',
    flex: 1,
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 14px',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'background 0.12s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  optionActive: {
    backgroundColor: 'rgba(136, 19, 55, 0.07)',
    color: 'var(--accent-primary)',
    fontWeight: '600',
  },
  check: {
    fontSize: '0.8rem',
    color: 'var(--accent-primary)',
    fontWeight: '700',
  },
  noResult: {
    padding: '18px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
};
