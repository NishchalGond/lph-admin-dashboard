import React from 'react';

/**
 * Shared SkeletonTable component — animated loading skeleton for table pages.
 * Usage: <SkeletonTable rows={10} cols={6} />
 */
const SkeletonTable = ({ rows = 8, cols = 5 }) => (
  <div className="animate-pulse">
    {/* Table header skeleton */}
    <div className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-white/5 px-4 py-3 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-slate-200 dark:bg-white/10 flex-1"
          style={{ maxWidth: i === 0 ? 80 : undefined }}
        />
      ))}
    </div>

    {/* Table row skeletons */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div
        key={rowIdx}
        className="border-b border-slate-100 dark:border-white/5 px-4 py-3.5 flex gap-4 items-center"
        style={{ opacity: 1 - rowIdx * (0.5 / rows) }}
      >
        {Array.from({ length: cols }).map((_, colIdx) => (
          <div
            key={colIdx}
            className="h-3 rounded bg-slate-100 dark:bg-white/5 flex-1"
            style={{
              maxWidth: colIdx === 0 ? 80 : colIdx === 1 ? 200 : undefined,
              width: colIdx === 0 ? 80 : undefined,
            }}
          />
        ))}
      </div>
    ))}
  </div>
);

export default SkeletonTable;
