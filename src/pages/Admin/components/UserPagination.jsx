import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';

/**
 * UserPagination Component
 * Matches Figma Community design "User Management UI – Social Media Admin Dashboard":
 * - Left: Rows per page [ 10 ⌵ ] of X rows
 * - Right: « ‹ 1 2 3 ... N › » with circular active page button
 *
 * @param {Object} props
 * @param {number} props.currentPage - Active 1-indexed page
 * @param {number} props.totalPages - Total calculated pages
 * @param {number} props.totalUsers - Total items count
 * @param {number} props.pageSize - Items per page
 * @param {Function} props.onPageChange - Page change callback
 * @param {Function} [props.onPageSizeChange] - Page size change callback
 */
export const UserPagination = ({
  currentPage = 1,
  totalPages = 1,
  totalUsers = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange
}) => {
  if (totalUsers === 0) return null;

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between py-2.5 px-3 border-top user-figma-pagination">
      {/* ── Left: Rows per page [ 10 ⌵ ] of X rows ── */}
      <div className="d-flex align-items-center gap-2 fs-13 text-secondary user-select-none">
        <span>Rows per page</span>
        <Dropdown>
          <Dropdown.Toggle
            variant="custom"
            className="d-inline-flex align-items-center gap-1.5 px-2 py-0.5 fs-12 rounded-2 user-pagination-size-toggle"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              height: '26px'
            }}
          >
            <span>{pageSize}</span>
            <ChevronDown size={12} className="opacity-70" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-sm border py-1 user-pagination-size-menu">
            {[10, 20, 50, 100].map((sz) => (
              <Dropdown.Item
                key={sz}
                active={pageSize === sz}
                onClick={() => onPageSizeChange && onPageSizeChange(sz)}
                className="py-1 px-3 fs-12 text-light"
              >
                {sz}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
        <span>of {totalUsers} rows</span>
      </div>

      {/* ── Right: « ‹ 1 2 3 ... N › » Navigation Controls ── */}
      <nav aria-label="Table navigation" className="d-flex align-items-center gap-1">
        {/* First Page « */}
        <button
          type="button"
          className="btn btn-sm p-1 rounded-circle user-pagination-nav-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange && onPageChange(1)}
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Previous Page ‹ */}
        <button
          type="button"
          className="btn btn-sm p-1 rounded-circle user-pagination-nav-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page numbers */}
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 text-muted fs-12 user-select-none">
                ...
              </span>
            );
          }

          const isActive = currentPage === p;
          return (
            <button
              key={`page-${p}`}
              type="button"
              className={`btn btn-sm user-pagination-page-btn ${isActive ? 'active-page-btn' : ''}`}
              onClick={() => onPageChange && onPageChange(p)}
              aria-current={isActive ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}

        {/* Next Page › */}
        <button
          type="button"
          className="btn btn-sm p-1 rounded-circle user-pagination-nav-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>

        {/* Last Page » */}
        <button
          type="button"
          className="btn btn-sm p-1 rounded-circle user-pagination-nav-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange && onPageChange(totalPages)}
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        .user-figma-pagination {
          border-top-color: rgba(255, 255, 255, 0.08) !important;
          background-color: transparent;
        }
        .user-pagination-nav-btn {
          color: #94a3b8;
          border: none;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .user-pagination-nav-btn:hover:not(:disabled) {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.08);
        }
        .user-pagination-nav-btn:disabled {
          color: rgba(148, 163, 184, 0.35);
          cursor: not-allowed;
        }
        .user-pagination-page-btn {
          width: 28px;
          height: 28px;
          border-radius: 50% !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12.5px;
          font-weight: 500;
          color: #94a3b8;
          border: none;
          padding: 0;
          transition: all 0.15s ease;
        }
        .user-pagination-page-btn:hover:not(.active-page-btn) {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.08);
        }
        .user-pagination-page-btn.active-page-btn {
          background-color: #0284c7 !important;
          color: #ffffff !important;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.4);
        }
        .user-pagination-size-menu {
          background-color: #0f172a !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          min-width: 65px;
        }

        /* Light mode overrides */
        body.light-mode .user-figma-pagination {
          border-top-color: #e2e8f0 !important;
        }
        body.light-mode .user-pagination-size-toggle {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .user-pagination-size-menu {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .user-pagination-size-menu .dropdown-item {
          color: #0f172a !important;
        }
        body.light-mode .user-pagination-nav-btn {
          color: #64748b;
        }
        body.light-mode .user-pagination-nav-btn:hover:not(:disabled) {
          color: #0f172a;
          background-color: #f1f5f9;
        }
        body.light-mode .user-pagination-page-btn {
          color: #64748b;
        }
        body.light-mode .user-pagination-page-btn:hover:not(.active-page-btn) {
          color: #0f172a;
          background-color: #f1f5f9;
        }
        body.light-mode .user-pagination-page-btn.active-page-btn {
          background-color: #0f172a !important;
          color: #ffffff !important;
        }
      `}} />
    </div>
  );
};

export default UserPagination;
