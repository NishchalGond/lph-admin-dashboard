import React from 'react';

/**
 * Shared PageHeader component — consistent page heading across all pages.
 * Usage:
 *   <PageHeader
 *     title="Property Ledger"
 *     subtitle="23 real estate columns..."
 *     badge="23 Headers"
 *     actions={<button>Export</button>}
 *   />
 */
const PageHeader = ({ title, subtitle, badge, badgeColor = 'sky', actions }) => {
  const badgeColors = {
    sky:     'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber:   'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose:    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    indigo:  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h1>
          {badge && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColors[badgeColor] || badgeColors.sky}`}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
