import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Generate page number buttons (show max 5 around current)
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    const delta = 2;
    const left  = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const btnBase = "flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all duration-150 border";
  const btnActive = `${btnBase} bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-500/20`;
  const btnInactive = `${btnBase} bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700`;
  const btnDisabled = `${btnBase} border-slate-100 dark:border-slate-800/50 text-slate-300 dark:text-slate-700 cursor-not-allowed`;
  const btnNav = `${btnBase} border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:border-slate-100 dark:disabled:border-slate-800/50 disabled:text-slate-300 dark:disabled:text-slate-700 disabled:cursor-not-allowed`;

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/40 backdrop-blur-sm rounded-b-xl">
      <div className="text-xs text-slate-400 dark:text-slate-500">
        Page <span className="font-bold text-slate-700 dark:text-slate-300">{page}</span> of{' '}
        <span className="font-bold text-slate-700 dark:text-slate-300">{totalPages}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className={btnNav}
          aria-label="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous */}
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={btnNav}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Numbers */}
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="text-slate-400 text-xs px-1">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={p === page ? btnActive : btnInactive}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={btnNav}
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className={btnNav}
          aria-label="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
