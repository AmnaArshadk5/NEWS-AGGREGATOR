import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalArticles = 0,
  pageSize = 12,
  onPageSizeChange
}) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (totalPages <= 1 && totalArticles <= pageSize) return null;

  const startItem = totalArticles > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalArticles);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = isMobile ? 3 : 5;

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
    <div className="pagination-card">
      {/* Top row: Status info */}
      <div className="pagination-status">
        <span className="pagination-status-text">
          Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalArticles}</strong>
        </span>
        <span className="pagination-badge">Page {currentPage}/{totalPages}</span>
      </div>

      {/* Middle row: Controls */}
      <div className="pagination-buttons">
        {!isMobile && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="pag-btn pag-btn-nav"
            title="First Page"
          >
            <ChevronsLeft size={16} />
          </button>
        )}

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pag-btn pag-btn-nav"
          title="Previous Page"
        >
          <ChevronLeft size={16} />
          <span className="pag-btn-label">Prev</span>
        </button>

        <div className="pag-numbers">
          {!isMobile && pageNumbers[0] > 1 && (
            <>
              <button onClick={() => onPageChange(1)} className="pag-btn pag-btn-num">1</button>
              {pageNumbers[0] > 2 && <span className="pag-dots">…</span>}
            </>
          )}

          {pageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              className={`pag-btn pag-btn-num ${num === currentPage ? 'active' : ''}`}
            >
              {num}
            </button>
          ))}

          {!isMobile && pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="pag-dots">…</span>}
              <button onClick={() => onPageChange(totalPages)} className="pag-btn pag-btn-num">{totalPages}</button>
            </>
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pag-btn pag-btn-nav"
          title="Next Page"
        >
          <span className="pag-btn-label">Next</span>
          <ChevronRight size={16} />
        </button>

        {!isMobile && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="pag-btn pag-btn-nav"
            title="Last Page"
          >
            <ChevronsRight size={16} />
          </button>
        )}
      </div>

      {/* Bottom row: Per page dropdown */}
      {onPageSizeChange && (
        <div className="pagination-select-wrap">
          <span className="pagination-select-label">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="pagination-select"
          >
            <option value={12}>12 / page</option>
            <option value={24}>24 / page</option>
            <option value={36}>36 / page</option>
            <option value={48}>48 / page</option>
          </select>
        </div>
      )}
    </div>
  );
}
