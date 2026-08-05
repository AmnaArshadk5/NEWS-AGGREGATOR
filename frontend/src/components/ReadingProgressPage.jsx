import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, CheckCircle, Clock, Trash2, Search, ExternalLink, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import ArticleModal from './ArticleModal';

const PROXY_BASE = `${API_BASE_URL}/proxy/image?url=`;
function getProxiedImage(src) {
  if (!src) return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800';
  if (src.includes('/api/proxy/image') || src.startsWith('data:') || src.includes('unsplash.com')) return src;
  return `${PROXY_BASE}${encodeURIComponent(src)}`;
}

export default function ReadingProgressPage({ onGoHome }) {
  const { user } = useAuth();
  const userId = user?.id ? user.id : 'guest';

  const [items, setItems] = useState([]);
  const [filterTab, setFilterTab] = useState('in_progress'); // 'in_progress' | 'completed' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load reading progress articles for the logged-in user
  const loadProgressArticles = useCallback(() => {
    const list = [];
    const prefix = `progress_article_${userId}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.url) {
            const pct = parseInt(localStorage.getItem(`progress_${userId}_${data.url}`) || data.progress || '0', 10);
            list.push({ ...data, progress: pct });
          }
        } catch (err) {
          console.warn('Failed to parse progress item:', key);
        }
      }
    }
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    setItems(list);
  }, [userId]);

  useEffect(() => {
    loadProgressArticles();
  }, [loadProgressArticles]);

  const deleteProgress = (url) => {
    localStorage.removeItem(`progress_${userId}_${url}`);
    localStorage.removeItem(`progress_article_${userId}_${url}`);
    setItems(prev => prev.filter(item => item.url !== url));
  };

  const clearAllInProgress = () => {
    items.filter(item => item.progress < 100).forEach(item => {
      localStorage.removeItem(`progress_${userId}_${item.url}`);
      localStorage.removeItem(`progress_article_${userId}_${item.url}`);
    });
    loadProgressArticles();
  };

  const handleContinueReading = (item) => {
    setSelectedArticle(item);
    setIsModalOpen(true);
  };

  const handleModalProgressUpdate = () => {
    loadProgressArticles();
  };

  // Filter items
  const inProgressCount = items.filter(i => i.progress > 0 && i.progress < 100).length;
  const completedCount  = items.filter(i => i.progress >= 100).length;

  const filteredItems = items.filter(item => {
    // Tab filter
    if (filterTab === 'in_progress' && (item.progress <= 0 || item.progress >= 100)) return false;
    if (filterTab === 'completed' && item.progress < 100) return false;
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title && item.title.toLowerCase().includes(q);
      const sourceMatch = item.source?.name && item.source.name.toLowerCase().includes(q);
      return titleMatch || sourceMatch;
    }
    return true;
  });

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.badgeRow}>
              <span style={styles.headerBadge}>
                <BookOpen size={13} style={{ marginRight: '4px' }} /> Reading Shelf
              </span>
            </div>
            <h1 style={styles.title}>Incomplete & Tracked Reading</h1>
            <p style={styles.subtitle}>
              Pick up right where you left off. Articles automatically sync your scroll reading progress.
            </p>
          </div>
          {inProgressCount > 0 && (
            <button onClick={clearAllInProgress} style={styles.clearBtn}>
              <Trash2 size={14} />
              <span>Clear Incomplete Progress</span>
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statIconWrap}>
              <Clock size={18} color="var(--accent-warm)" />
            </div>
            <div>
              <span style={styles.statNumber}>{inProgressCount}</span>
              <span style={styles.statLabel}>In Progress Articles</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrap, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <CheckCircle size={18} color="#22c55e" />
            </div>
            <div>
              <span style={styles.statNumber}>{completedCount}</span>
              <span style={styles.statLabel}>Fully Read Articles</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrap, backgroundColor: 'rgba(136, 19, 55, 0.1)' }}>
              <BookOpen size={18} color="var(--accent-primary)" />
            </div>
            <div>
              <span style={styles.statNumber}>{items.length}</span>
              <span style={styles.statLabel}>Total Tracked</span>
            </div>
          </div>
        </div>
      </header>

      {/* Controls Bar: Tabs & Search */}
      <div style={styles.controlsBar}>
        <div style={styles.tabsGroup}>
          <button
            onClick={() => setFilterTab('in_progress')}
            style={{
              ...styles.tabBtn,
              ...(filterTab === 'in_progress' ? styles.tabBtnActive : {}),
            }}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            style={{
              ...styles.tabBtn,
              ...(filterTab === 'completed' ? styles.tabBtnActive : {}),
            }}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            style={{
              ...styles.tabBtn,
              ...(filterTab === 'all' ? styles.tabBtnActive : {}),
            }}
          >
            All Tracked ({items.length})
          </button>
        </div>

        {/* Search input */}
        <div style={styles.searchBox}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search progress list..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={styles.searchClear}>×</button>
          )}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredItems.length > 0 ? (
        <div style={styles.grid}>
          {filteredItems.map((item) => (
            <div key={item.url} style={styles.card}>
              {/* Image & Source Badge */}
              <div style={styles.cardImgWrap} onClick={() => handleContinueReading(item)}>
                <img
                  src={getProxiedImage(item.urlToImage || item.url_to_image)}
                  alt={item.title}
                  style={styles.cardImg}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800';
                  }}
                />
                <span style={styles.sourceBadge}>{item.source?.name || item.source_name || 'News'}</span>
              </div>

              {/* Card Body */}
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle} onClick={() => handleContinueReading(item)}>
                  {item.title}
                </h3>
                {item.description && (
                  <p style={styles.cardDesc}>
                    {item.description.length > 110 ? item.description.slice(0, 110) + '…' : item.description}
                  </p>
                )}

                {/* Progress Bar Component */}
                <div style={styles.progressWrap}>
                  <div style={styles.progressHeader}>
                    <span style={styles.progressLabel}>
                      {item.progress >= 100 ? '✓ Article Completed' : `Reading Progress: ${item.progress}%`}
                    </span>
                    <span style={{
                      ...styles.progressPctText,
                      color: item.progress >= 100 ? '#22c55e' : 'var(--accent-primary)'
                    }}>
                      {item.progress}%
                    </span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${Math.min(100, Math.max(0, item.progress))}%`,
                        backgroundColor: item.progress >= 100 ? '#22c55e' : 'var(--accent-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Card Actions */}
                <div style={styles.cardFooter}>
                  <button
                    onClick={() => handleContinueReading(item)}
                    className="btn btn-primary"
                    style={styles.continueBtn}
                  >
                    <span>{item.progress >= 100 ? 'Re-read Article' : 'Continue Reading'}</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => deleteProgress(item.url)}
                    style={styles.deleteBtn}
                    title="Remove from reading list"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div style={styles.emptyCard}>
          <div style={styles.emptyIconWrap}>
            <BookOpen size={36} color="var(--accent-primary)" />
          </div>
          <h3 style={styles.emptyTitle}>
            {filterTab === 'in_progress' ? 'No Incomplete Articles' : filterTab === 'completed' ? 'No Completed Articles' : 'No Reading Progress Logged'}
          </h3>
          <p style={styles.emptyText}>
            {filterTab === 'in_progress'
              ? 'All articles you start reading will show up here with their live reading percentage.'
              : 'Start reading articles in Reader View and your finished stories will appear here.'}
          </p>
          <button onClick={onGoHome} className="btn btn-primary" style={{ marginTop: '8px' }}>
            Browse Latest Headlines
          </button>
        </div>
      )}

      {/* Reader Modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProgressUpdate={handleModalProgressUpdate}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 20px 60px',
  },
  header: {
    marginBottom: '28px',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
  },
  badgeRow: { marginBottom: '8px' },
  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '999px',
    backgroundColor: 'rgba(136, 19, 55, 0.08)',
    color: 'var(--accent-primary)',
    fontSize: '0.78rem',
    fontWeight: '700',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '0.92rem',
    color: 'var(--text-muted)',
    maxWidth: '600px',
    lineHeight: '1.5',
  },
  clearBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  // Stats Row
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
  },
  statIconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: 'rgba(180, 83, 9, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statNumber: {
    display: 'block',
    fontSize: '1.4rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: '1.1',
  },
  statLabel: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },

  // Controls Bar
  controlsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '28px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-light)',
  },
  tabsGroup: {
    display: 'flex',
    gap: '6px',
    backgroundColor: 'var(--bg-input)',
    padding: '4px',
    borderRadius: 'var(--radius-md)',
  },
  tabBtn: {
    padding: '7px 16px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.84rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabBtnActive: {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },

  // Search box
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 12px',
    height: '38px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-sm)',
    width: '260px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.86rem',
    color: 'var(--text-primary)',
    width: '100%',
  },
  searchClear: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '1.1rem',
    cursor: 'pointer',
    lineHeight: '1',
  },

  // Cards Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  cardImgWrap: {
    height: '180px',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    backgroundColor: 'var(--bg-input)',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  sourceBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    color: '#fff',
    fontSize: '0.72rem',
    fontWeight: '600',
    letterSpacing: '0.03em',
  },
  cardBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  cardTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.08rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: '1.38',
    marginBottom: '8px',
    cursor: 'pointer',
  },
  cardDesc: {
    fontSize: '0.84rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    marginBottom: '16px',
  },

  // Progress Bar in Card
  progressWrap: {
    marginTop: 'auto',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: 'var(--bg-input)',
    borderRadius: 'var(--radius-sm)',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  progressLabel: {
    fontSize: '0.76rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  progressPctText: {
    fontSize: '0.78rem',
    fontWeight: '700',
  },
  progressTrack: {
    height: '6px',
    backgroundColor: 'var(--border-light)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.3s ease',
  },

  // Card Footer
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  continueBtn: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '0.84rem',
    padding: '9px 14px',
  },
  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-light)',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  // Empty State
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '64px 20px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    maxWidth: '480px',
    margin: '32px auto',
    gap: '12px',
  },
  emptyIconWrap: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(136, 19, 55, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  emptyTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  emptyText: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    lineHeight: '1.6',
    maxWidth: '380px',
  },
};
