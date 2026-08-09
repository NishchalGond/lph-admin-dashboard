import React from 'react';

/**
 * Shared EmptyState component — consistent empty UI across all pages.
 * Usage: <EmptyState icon={Search} title="No records found" description="..." action={...} />
 */
const EmptyState = ({ icon: Icon, title = 'No data found', description, action }) => (
  <div className="flex flex-col items-center justify-center min-h-[32vh] py-16 px-8 text-center space-y-4">
    {Icon && (
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
    )}
    <div className="space-y-1.5">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">{description}</p>
      )}
    </div>
    {action && (
      <div className="pt-2">
        {action}
      </div>
    )}
  </div>
);

export default EmptyState;
