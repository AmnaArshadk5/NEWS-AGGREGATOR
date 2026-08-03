import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bookmark, Clock, User, ArrowUpRight } from 'lucide-react';

export default function NewsCard({ article, onRequireAuth }) {
  const { toggleBookmark, isBookmarked } = useAuth();

  const title = article.title;
  const description = article.description || '';
  const url = article.url;
  const urlToImage = article.urlToImage || article.url_to_image;
  const publishedAt = article.publishedAt || article.published_at;
  const sourceName = article.source?.name || article.source_name || 'News Source';
  const author = article.author;

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

  const imageSrc =
    urlToImage ||
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800';

  return (
    <article style={styles.card}>
      {/* Image */}
      <a href={url || '#'} target="_blank" rel="noopener noreferrer" style={styles.imageLink}>
        <div style={styles.imageWrap}>
          <img
            src={imageSrc}
            alt={title}
            style={styles.image}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800';
            }}
          />
        </div>
      </a>

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
        <a href={url || '#'} target="_blank" rel="noopener noreferrer" style={styles.titleLink}>
          <h3 style={styles.title}>{title}</h3>
        </a>

        {/* Description */}
        <p style={styles.description}>
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

            <a
              href={url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.readLink}
              onClick={(e) => {
                if (!url || url === '#') {
                  e.preventDefault();
                }
              }}
            >
              <span>Read</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </article>
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
};
