import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { Bookmark, Clock, User, BookOpen, CheckCircle2 } from 'lucide-react';
import ArticleModal from './ArticleModal';

// NewsCard component with reading progress tracking
export default function NewsCard({ article = {}, onRequireAuth }) {
  const { user, toggleBookmark, isBookmarked } = useAuth();
  const userId = user?.id ? user.id : 'guest';
  const [isModalOpen, setIsModalOpen] = useState(false);

  const title = article?.title || 'Untitled';
  const description = article?.description || '';
  const url = article?.url || '';
  const urlToImage = article?.urlToImage || article?.url_to_image;
  const publishedAt = article?.publishedAt || article?.published_at;
  const sourceName = article?.source?.name || article?.source_name || 'News Source';
  const author = article?.author;

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (url) {
      const saved = localStorage.getItem(`progress_${userId}_${url}`);
      if (saved) setProgress(parseInt(saved, 10));
      else setProgress(0);
    }
  }, [url, userId]);

  const bookmarked = isBookmarked(url);

  const handleBookmarkClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    const res = await toggleBookmark({
      title,
      description,
      url,
      urlToImage,
      publishedAt,
      source: { name: sourceName },
      author,
    });

    if (res && res.requireAuth) {
      onRequireAuth();
    }
  };

  const handleProgressUpdate = (pct) => {
    setProgress(pct);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
      const now = Date.now();
      const then = new Date(dateStr).getTime();
      const diff = now - then;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      if (days < 30) return `${Math.floor(days / 7)}w ago`;
      return formatDate(dateStr);
    } catch {
      return '';
    }
  };

  const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='26' fill='%2394a3b8'%3ENews Article%3C/text%3E%3C/svg%3E";
  const PROXY_BASE = `${API_BASE_URL}/proxy/image?url=`;
  const getProxiedImage = (src) => {
    if (!src) return FALLBACK_IMAGE;
    if (src.includes('localhost:5000/api')) {
      src = src.replace('http://localhost:5000/api', API_BASE_URL);
    }
    if (src.includes('/api/proxy/image') || src.startsWith('data:')) return src;
    return `${PROXY_BASE}${encodeURIComponent(src)}`;
  };

  const imageSrc = getProxiedImage(urlToImage);

  const handleOpenReader = (e) => {
    if (e) e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <article style={styles.card}>
        {/* Image */}
        <div style={styles.imageLink} onClick={handleOpenReader}>
          <div style={styles.imageWrap}>
            <img
              src={imageSrc}
              alt={title}
              style={styles.image}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = FALLBACK_IMAGE;
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Source + Date row */}
          <div style={styles.metaRow}>
            <span className="badge badge-accent">{sourceName}</span>
            <div style={styles.timeRow}>
              <Clock size={12} style={{ color: 'var(--text-muted)' }} />
              <span style={styles.timeText}>{getTimeAgo(publishedAt)}</span>
            </div>
          </div>

          {/* Title */}
          <div style={styles.titleLink} onClick={handleOpenReader}>
            <h3 style={styles.title}>{title}</h3>
          </div>

          {/* Description */}
          <p style={{ cursor: 'pointer', ...styles.description }} onClick={handleOpenReader}>
            {description.length > 140
              ? `${description.slice(0, 140)}…`
              : description || 'No summary available for this article.'}
          </p>

          {/* Footer */}
          <div style={styles.footer}>
            <div style={styles.footerLeft}>
              {author && (
                <div style={styles.authorRow}>
                  <div style={styles.authorAvatar}>
                    <User size={11} color="#fff" />
                  </div>
                  <span style={styles.authorName}>{author}</span>
                </div>
              )}
            </div>

            <div style={styles.footerRight}>
              <button
                onClick={handleBookmarkClick}
                style={{
                  ...styles.bookmarkBtn,
                  color: bookmarked ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}
                title={bookmarked ? 'Remove from saved' : 'Save article'}
              >
                <Bookmark size={16} fill={bookmarked ? 'var(--accent-primary)' : 'none'} />
              </button>

              <button
                onClick={handleOpenReader}
                style={styles.readLink}
                title="Read full article"
              >
                <span>Read Story</span>
                <BookOpen size={13} />
              </button>
            </div>
          </div>

          {progress > 0 && (
            <div style={styles.progressSection}>
              <div style={styles.progressHeader}>
                {progress === 100 ? (
                  <span style={styles.completedBadge}>
                    <CheckCircle2 size={13} color="var(--accent-success)" />
                    <span>100% Completed</span>
                  </span>
                ) : (
                  <span style={styles.inProgressBadge}>
                    <Clock size={12} color="var(--accent-primary)" />
                    <span>{progress}% Read</span>
                  </span>
                )}
              </div>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${progress}%`,
                    backgroundColor: progress === 100 ? 'var(--accent-success)' : 'var(--accent-primary)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </article>

      {/* In-App Reader Modal */}
      <ArticleModal
        article={article}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProgressUpdate={handleProgressUpdate}
      />
    </>
  );
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-light)',
    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
    boxShadow: 'var(--shadow-xs)',
  },
  imageLink: {
    display: 'block',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  imageWrap: {
    width: '100%',
    height: '190px',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  content: {
    padding: '20px 20px 16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    gap: '8px',
  },
  timeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  timeText: {
    fontSize: '0.76rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  titleLink: {
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
  title: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.1rem',
    lineHeight: '1.4',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '10px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    letterSpacing: '-0.01em',
    transition: 'color 0.15s ease',
  },
  description: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '16px',
    flex: 1,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '12px',
    borderTop: '1px solid var(--border-light)',
    marginTop: 'auto',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  authorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  authorAvatar: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    maxWidth: '110px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  bookmarkBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  readLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--accent-primary)',
    textDecoration: 'none',
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-light)',
    transition: 'all 0.15s ease',
  },
  progressSection: {
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  progressHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
  },
  completedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: 'var(--accent-success)',
    fontWeight: '700',
  },
  inProgressBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: 'var(--text-secondary)',
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: '5px',
    backgroundColor: 'var(--bg-input)',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '9999px',
    transition: 'width 0.4s ease',
  },
};
