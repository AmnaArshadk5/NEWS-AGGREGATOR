import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalArticles = 0,
  pageSize = 12,
  onPageSizeChange
}) {
  if (totalPages <= 1 && totalArticles <= pageSize) return null;

  const startItem = totalArticles > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalArticles);

  // Generate page numbers range for clean navigation buttons
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div style={styles.container}>
      {/* Items count summary */}
      <div style={styles.infoText}>
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalArticles}</strong> articles
        <span style={styles.pageBadge}>Page {currentPage} of {totalPages}</span>
      </div>

      {/* Page Navigation Controls */}
      <div style={styles.controlsWrap}>
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={styles.navBtn}
          title="First Page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={styles.navBtn}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
          <span style={styles.btnLabel}>Prev</span>
        </button>

        {/* Numbered Page Buttons */}
        <div style={styles.numberGroup}>
          {pageNumbers[0] > 1 && (
            <>
              <button onClick={() => onPageChange(1)} style={styles.numBtn}>1</button>
              {pageNumbers[0] > 2 && <span style={styles.ellipsis}>…</span>}
            </>
          )}

          {pageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              style={{
                ...styles.numBtn,
                ...(num === currentPage ? styles.numBtnActive : {})
              }}
            >
              {num}
            </button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span style={styles.ellipsis}>…</span>}
              <button onClick={() => onPageChange(totalPages)} style={styles.numBtn}>{totalPages}</button>
            </>
          )}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={styles.navBtn}
          title="Next Page"
        >
          <span style={styles.btnLabel}>Next</span>
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={styles.navBtn}
          title="Last Page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* Page size selector */}
      {onPageSizeChange && (
        <div style={styles.sizeWrap}>
          <span style={styles.sizeLabel}>Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={styles.sizeSelect}
          >
            <option value={12}>12 articles</option>
            <option value={24}>24 articles</option>
            <option value={36}>36 articles</option>
            <option value={48}>48 articles</option>
          </select>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    padding: '20px 24px',
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-sm)',
    marginTop: '32px',
    marginBottom: '24px',
  },
  infoText: {
    fontSize: '0.86rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  pageBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    color: 'var(--accent-primary)',
    fontWeight: '700',
    fontSize: '0.76rem',
    padding: '3px 9px',
    borderRadius: '12px',
  },
  controlsWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  navBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '7px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.84rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnLabel: {
    display: 'inline-block',
  },
  numberGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    margin: '0 4px',
  },
  numBtn: {
    minWidth: '34px',
    height: '34px',
    padding: '0 8px',
    borderRadius: '8px',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: '0.86rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  numBtnActive: {
    backgroundColor: 'var(--accent-primary)',
    color: '#ffffff',
    borderColor: 'var(--accent-primary)',
    boxShadow: '0 3px 10px rgba(59, 130, 246, 0.3)',
    fontWeight: '800',
  },
  ellipsis: {
    color: 'var(--text-muted)',
    padding: '0 4px',
    fontSize: '0.9rem',
  },
  sizeWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sizeLabel: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  sizeSelect: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    fontWeight: '600',
    outline: 'none',
    cursor: 'pointer',
  },
};
