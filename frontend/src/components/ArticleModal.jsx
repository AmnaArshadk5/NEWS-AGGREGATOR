import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ExternalLink, Bookmark, Clock, User, Share2, Check, BookOpen, Loader, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL as API_BASE } from '../config';

export default function ArticleModal({ article, isOpen, onClose, onProgressUpdate, onSelectChannel }) {
  const title       = article?.title       || 'Untitled Article';
  const description = article?.description || '';
  const url         = article?.url         || '#';
  const urlToImage  = article?.urlToImage  || article?.url_to_image || '';
  const publishedAt = article?.publishedAt || article?.published_at;
  const sourceName  = article?.source?.name || article?.source_name || 'News Source';
  const author      = article?.author      || 'Editorial Desk';

  const { user, toggleBookmark, isBookmarked } = useAuth();
  const userId = user?.id ? user.id : 'guest';

  const [copied,        setCopied]        = useState(false);
  const [readPercent,   setReadPercent]   = useState(0);
  const [readerMode,    setReaderMode]    = useState(false);
  const [readerContent, setReaderContent] = useState(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError,   setReaderError]   = useState(null);

  const bodyRef = useRef(null);

  // Restore saved percentage when modal opens
  useEffect(() => {
    if (isOpen && url) {
      const stored = parseInt(localStorage.getItem(`progress_${userId}_${url}`) || '0', 10);
      setReadPercent(stored);
    }
    setReaderContent(null);
    setReaderError(null);
    setReaderMode(false);
  }, [isOpen, url, userId]);

  const lastProgressRef = useRef(0);
  const scrollTickingRef = useRef(false);

  // Save progress helper (only triggers state when percentage changes by at least 3% or reaches 100%)
  const saveProgress = useCallback((pct) => {
    const clamped = Math.min(100, Math.max(0, pct));
    if (Math.abs(clamped - lastProgressRef.current) < 3 && clamped < 100) return;
    lastProgressRef.current = clamped;

    setReadPercent(clamped);
    if (url) {
      const stored = parseInt(localStorage.getItem(`progress_${userId}_${url}`) || '0', 10);
      if (clamped > stored) {
        localStorage.setItem(`progress_${userId}_${url}`, clamped);
        localStorage.setItem(`progress_article_${userId}_${url}`, JSON.stringify({
          url,
          title,
          description,
          urlToImage,
          publishedAt,
          source: { name: sourceName },
          author,
          progress: clamped,
          updatedAt: Date.now(),
        }));
        if (onProgressUpdate) onProgressUpdate(clamped);
      }
    }
  }, [url, userId, title, description, urlToImage, publishedAt, sourceName, author, onProgressUpdate]);

  // Smooth throttled scroll tracker using requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (scrollTickingRef.current) return;
    scrollTickingRef.current = true;
    requestAnimationFrame(() => {
      scrollTickingRef.current = false;
      const el = bodyRef.current;
      if (!el || !readerMode) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const scrollable = scrollHeight - clientHeight;
      if (scrollable <= 0) return;
      const pct = Math.round((scrollTop / scrollable) * 100);
      saveProgress(pct);
    });
  }, [readerMode, saveProgress]);

  // Fetch article content from backend reader API
  const loadReaderView = async () => {
    if (readerLoading) return;
    setReaderLoading(true);
    setReaderError(null);
    try {
      const res = await fetch(`${API_BASE}/reader?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to extract article');
      setReaderContent(data);
      setReaderMode(true);
      // Scroll to top on load
      setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, 50);
    } catch (err) {
      setReaderError(err.message);
      setReaderMode(true);
    } finally {
      setReaderLoading(false);
    }
  };

  if (!isOpen || !article) return null;

  const bookmarked = isBookmarked(url);

  const handleShare = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    saveProgress(readPercent);
    onClose();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return dateStr; }
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Progress bar */}
        <div style={styles.progressTrack}>
          <div style={{
            ...styles.progressFill,
            width: `${readPercent}%`,
            backgroundColor: readPercent === 100 ? 'var(--accent-warm)' : 'var(--accent-primary)',
          }} />
        </div>

        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.toolbarLeft}>
            <span
              className="badge badge-accent"
              onClick={() => {
                handleClose();
                if (onSelectChannel) onSelectChannel(sourceName);
              }}
              style={{ cursor: 'pointer' }}
              title={`View all news from ${sourceName}`}
            >
              {sourceName}
            </span>
            {readPercent > 0 && (
              <span style={styles.pctBadge}>
                {readPercent === 100 ? '✓ Fully Read' : `${readPercent}% read`}
              </span>
            )}
          </div>
          <div style={styles.actions}>
            {/* Reader View toggle */}
            <button
              onClick={readerMode ? () => setReaderMode(false) : loadReaderView}
              style={{ ...styles.iconBtn, ...(readerMode ? styles.readerBtnActive : {}) }}
              title={readerMode ? 'Exit Reader View' : 'Open Reader View'}
            >
              {readerLoading
                ? <Loader size={17} className="spinner" />
                : <BookOpen size={17} color={readerMode ? 'var(--accent-primary)' : 'var(--text-muted)'} />
              }
            </button>
            <button onClick={() => toggleBookmark(article)} style={styles.iconBtn} title={bookmarked ? 'Remove Bookmark' : 'Bookmark'}>
              <Bookmark size={18} fill={bookmarked ? 'var(--accent-primary)' : 'none'} color={bookmarked ? 'var(--accent-primary)' : 'var(--text-muted)'} />
            </button>
            <button onClick={handleShare} style={styles.iconBtn} title="Copy Link">
              {copied ? <Check size={18} color="#22c55e" /> : <Share2 size={18} color="var(--text-muted)" />}
            </button>
            <button onClick={handleClose} style={styles.closeBtn} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={styles.body} ref={bodyRef} onScroll={handleScroll} className="hide-scrollbar">

          {/* ── READER VIEW ── */}
          {readerMode && readerContent && (
            <div style={styles.readerWrap}>
              <p style={styles.readerSource}>
                {readerContent.source} · {formatDate(readerContent.published || publishedAt)}
              </p>
              <h1 style={styles.title}>{readerContent.title || title}</h1>
              {readerContent.author && (
                <div style={styles.metaRow}>
                  <div style={styles.authorInfo}>
                    <div style={styles.avatar}><User size={14} color="#fff" /></div>
                    <span style={styles.authorName}>{readerContent.author}</span>
                  </div>
                </div>
              )}
              {/* Sanitised article HTML */}
              <div
                className="reader-body"
                dangerouslySetInnerHTML={{ __html: readerContent.content }}
              />
              <div style={styles.readerFooter}>
                <a href={url} target="_blank" rel="noopener noreferrer" style={styles.readerSourceLink}>
                  View on {readerContent.source} <ExternalLink size={13} style={{ verticalAlign: 'middle' }} />
                </a>
              </div>
            </div>
          )}

          {/* ── READER ERROR ── */}
          {readerMode && readerError && (
            <div style={styles.readerErrorWrap}>
              <AlertTriangle size={32} color="var(--accent-warm)" />
              <p style={styles.readerErrorTitle}>Reader View unavailable</p>
              <p style={styles.readerErrorMsg}>{readerError}</p>
              <p style={styles.readerErrorHint}>
                This site blocks automated reading. Open the original article directly instead.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button onClick={() => setReaderMode(false)} className="btn btn-secondary" style={{ fontSize: '0.84rem' }}>
                  Back to preview
                </button>
                <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '0.84rem' }}>
                  Open article <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {/* ── DEFAULT PREVIEW (when not in reader mode) ── */}
          {!readerMode && (
            <>
              <h1 style={styles.title}>{title}</h1>
              <div style={styles.metaRow}>
                <div style={styles.authorInfo}>
                  <div style={styles.avatar}><User size={14} color="#fff" /></div>
                  <span style={styles.authorName}>{author}</span>
                </div>
                <div style={styles.timeInfo}>
                  <Clock size={14} color="var(--text-muted)" />
                  <span>{formatDate(publishedAt)}</span>
                </div>
              </div>

              {urlToImage && (
                <div style={styles.imageWrap}>
                  <img
                    src={(() => {
                      let src = urlToImage;
                      if (src.includes('localhost:5000/api')) {
                        src = src.replace('http://localhost:5000/api', API_BASE);
                      }
                      return src.includes('/api/proxy/image') || src.startsWith('data:') ? src : `${API_BASE}/proxy/image?url=${encodeURIComponent(src)}`;
                    })()}
                    alt={title}
                    style={styles.image}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='26' fill='%2394a3b8'%3ENews Article%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              )}

              <div style={styles.articleBody}>
                <p style={styles.leadParagraph}>{description}</p>
              </div>

              {/* Reader View CTA */}
              <div style={styles.readerCTA}>
                <div style={styles.readerCTALeft}>
                  <BookOpen size={20} color="var(--accent-primary)" />
                  <div>
                    <p style={styles.readerCTATitle}>Read the full article</p>
                    <p style={styles.readerCTASubtitle}>Reader View fetches the actual article text and tracks your scroll progress — just like a book.</p>
                  </div>
                </div>
                <button
                  onClick={loadReaderView}
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap', fontSize: '0.84rem' }}
                  disabled={readerLoading}
                >
                  {readerLoading ? <><Loader size={14} className="spinner" /> Loading…</> : 'Open Reader View'}
                </button>
              </div>

              {/* External fallback */}
              <div style={styles.sourceFooter}>
                <div>
                  <p style={styles.sourceNote}>Originally published by <strong>{sourceName}</strong></p>
                  <p style={styles.sourceUrl}>{url}</p>
                </div>
                <a
                  href={url} target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary" style={styles.externalBtn}
                >
                  <span>Open Original Site</span>
                  <ExternalLink size={15} />
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  },
  modal: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-light)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
    width: '100%', maxWidth: '760px',
    maxHeight: '92vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  progressTrack: {
    height: '3px', backgroundColor: 'var(--border-light)', flexShrink: 0,
  },
  progressFill: {
    height: '100%', transition: 'width 0.3s ease',
  },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border-light)',
    flexShrink: 0,
  },
  toolbarLeft: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  pctBadge: {
    fontSize: '0.75rem', fontWeight: '700',
    color: 'var(--accent-primary)',
    backgroundColor: 'rgba(136, 19, 55, 0.08)',
    padding: '3px 10px', borderRadius: '999px',
  },
  actions: { display: 'flex', alignItems: 'center', gap: '6px' },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '7px', borderRadius: 'var(--radius-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  readerBtnActive: {
    backgroundColor: 'rgba(136, 19, 55, 0.08)',
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '7px', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
    transition: 'background 0.15s',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px 32px',
    WebkitOverflowScrolling: 'touch',
    transform: 'translateZ(0)',
    willChange: 'scroll-position',
  },

  // Default preview
  title: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '1.6rem', fontWeight: '700',
    color: 'var(--text-primary)', lineHeight: '1.35',
    marginBottom: '18px',
  },
  metaRow: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap',
    gap: '10px', marginBottom: '20px',
  },
  authorInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
  avatar: {
    width: '28px', height: '28px', borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  authorName: { fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)' },
  timeInfo: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '0.82rem', color: 'var(--text-muted)',
  },
  imageWrap: { borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '20px' },
  image: { width: '100%', maxHeight: '380px', objectFit: 'cover', display: 'block' },
  articleBody: { marginBottom: '24px' },
  leadParagraph: {
    fontSize: '1.05rem', lineHeight: '1.75',
    color: 'var(--text-secondary)', fontFamily: "'Lora', Georgia, serif",
  },

  // Reader CTA card
  readerCTA: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '18px 20px',
    backgroundColor: 'rgba(136, 19, 55, 0.04)',
    border: '1px solid rgba(136, 19, 55, 0.15)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  readerCTALeft: { display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 },
  readerCTATitle: {
    fontWeight: '700', fontSize: '0.95rem',
    color: 'var(--text-primary)', marginBottom: '3px',
  },
  readerCTASubtitle: {
    fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5',
  },

  // Source footer
  sourceFooter: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '16px',
    padding: '16px 0', borderTop: '1px solid var(--border-light)',
    flexWrap: 'wrap',
  },
  sourceNote: { fontSize: '0.82rem', color: 'var(--text-muted)' },
  sourceUrl: { fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' },
  externalBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '0.84rem', flexShrink: 0,
  },

  // Reader view
  readerWrap: { paddingBottom: '40px' },
  readerSource: {
    fontSize: '0.78rem', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    marginBottom: '12px', fontWeight: '600',
  },
  readerBody: {
    fontSize: '1.05rem', lineHeight: '1.85',
    color: 'var(--text-secondary)',
    fontFamily: "'Lora', Georgia, serif",
    marginTop: '20px',
  },
  readerFooter: {
    marginTop: '32px', paddingTop: '16px',
    borderTop: '1px solid var(--border-light)',
    textAlign: 'center',
  },
  readerSourceLink: {
    fontSize: '0.82rem', color: 'var(--accent-primary)',
    textDecoration: 'none', fontWeight: '600',
  },

  // Reader error
  readerErrorWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', textAlign: 'center',
    padding: '40px 24px', gap: '10px',
  },
  readerErrorTitle: {
    fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)',
  },
  readerErrorMsg: {
    fontSize: '0.88rem', color: 'var(--accent-warm)', fontWeight: '500',
  },
  readerErrorHint: {
    fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: '1.6',
  },
};
