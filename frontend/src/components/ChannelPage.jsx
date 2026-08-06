import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import NewsCard from './NewsCard';
import { ArrowLeft, Rss, Check, Plus, Search, Newspaper, Sparkles } from 'lucide-react';

export default function ChannelPage({
  channelName,
  articles = [],
  onGoBack,
  onRequireAuth,
  onSelectChannel
}) {
  const { user } = useAuth();
  const { toggleFollowChannel, isChannelFollowed } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const followed = isChannelFollowed(channelName);

  // Filter articles belonging to this specific channel / source
  const channelArticles = articles.filter(art => {
    const sName = art?.source?.name || art?.source_name || '';
    return sName.toLowerCase() === (channelName || '').toLowerCase();
  });

  // Apply search query within channel
  const filteredArticles = channelArticles.filter(art => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = (art?.title || '').toLowerCase();
    const desc = (art?.description || '').toLowerCase();
    return title.includes(q) || desc.includes(q);
  });

  // Apply sorting
  filteredArticles.sort((a, b) => {
    const da = new Date(a.publishedAt || a.published_at || 0);
    const db = new Date(b.publishedAt || b.published_at || 0);
    return sortBy === 'oldest' ? da - db : db - da;
  });

  const handleFollowClick = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    await toggleFollowChannel(channelName);
  };

  return (
    <div style={styles.container}>
      {/* Back Bar */}
      <div style={styles.backBar}>
        <button onClick={onGoBack} style={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Back to All News</span>
        </button>
      </div>

      {/* Channel Header Hero */}
      <div style={styles.heroCard}>
        <div style={styles.heroInner}>
          <div style={styles.avatarWrap}>
            <div style={styles.avatar}>
              {channelName ? channelName.charAt(0).toUpperCase() : 'N'}
            </div>
            <div style={styles.livePulse} title="Live Publisher Feed" />
          </div>

          <div style={styles.channelDetails}>
            <div style={styles.titleRow}>
              <h1 style={styles.channelTitle}>{channelName}</h1>
              <span style={styles.verifiedBadge}>
                <Sparkles size={12} color="var(--accent-primary)" />
                <span>Verified Source</span>
              </span>
            </div>
            <p style={styles.channelSubtitle}>
              Live aggregated news coverage & stories published by {channelName}.
            </p>
            <div style={styles.statsRow}>
              <span style={styles.statTag}>
                <Newspaper size={14} />
                <span>{channelArticles.length} Article{channelArticles.length !== 1 ? 's' : ''}</span>
              </span>
              <span style={styles.statTag}>
                <Rss size={14} color={followed ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                <span>{followed ? 'Subscribed' : 'Channel Alerts Available'}</span>
              </span>
            </div>
          </div>

          <div style={styles.actionWrap}>
            <button
              onClick={handleFollowClick}
              style={{
                ...styles.followBtn,
                backgroundColor: followed ? 'rgba(59, 130, 246, 0.15)' : 'var(--accent-primary)',
                color: followed ? 'var(--accent-primary)' : '#ffffff',
                border: followed ? '1px solid var(--accent-primary)' : 'none',
              }}
            >
              {followed ? (
                <>
                  <Check size={16} color="var(--accent-primary)" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <Plus size={16} color="#ffffff" />
                  <span>Follow Channel</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder={`Search within ${channelName}…`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={styles.clearBtn}>×</button>
          )}
        </div>

        <div style={styles.sortWrap}>
          <label style={styles.sortLabel}>Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div style={styles.emptyCard}>
          <Newspaper size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
          <h3 style={styles.emptyTitle}>
            {searchQuery ? `No articles matching "${searchQuery}"` : `No articles available for ${channelName}`}
          </h3>
          <p style={styles.emptyText}>
            Try clearing your search query or switching back to the main news feed.
          </p>
          <button onClick={onGoBack} style={styles.resetBtn}>
            Return to Feed
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredArticles.map((art, idx) => (
            <NewsCard
              key={art.url || idx}
              article={art}
              onRequireAuth={onRequireAuth}
              onSelectChannel={onSelectChannel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 16px 60px',
  },
  backBar: {
    marginBottom: '16px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '4px 0',
  },
  heroCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-sm)',
    padding: '28px 24px',
    marginBottom: '24px',
  },
  heroInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    color: '#ffffff',
    fontSize: '1.8rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
  },
  livePulse: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    border: '2px solid var(--bg-card)',
  },
  channelDetails: {
    flex: 1,
    minWidth: '240px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  channelTitle: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '12px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: 'var(--accent-primary)',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  channelSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
    marginBottom: '12px',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  statTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  actionWrap: {
    display: 'flex',
    alignItems: 'center',
  },
  followBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 22px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-light)',
    padding: '0 14px',
    height: '42px',
    flex: 1,
    minWidth: '240px',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
    marginLeft: '8px',
  },
  clearBtn: {
    border: 'none',
    background: 'none',
    color: 'var(--text-muted)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0 4px',
  },
  sortWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sortLabel: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  sortSelect: {
    height: '42px',
    padding: '0 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  emptyCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1px solid var(--border-light)',
    padding: '60px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  emptyTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  emptyText: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    maxWidth: '400px',
    margin: 0,
  },
  resetBtn: {
    marginTop: '12px',
    padding: '8px 20px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--accent-primary)',
    color: '#ffffff',
    border: 'none',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};
