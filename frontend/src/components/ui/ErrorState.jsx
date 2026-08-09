import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Shared ErrorState component — consistent error UI across all pages.
 * Usage: <ErrorState message="..." onRetry={fetchFn} />
 */
const ErrorState = ({ message = 'Something went wrong. Please try again.', onRetry }) => (
  <div className="flex items-center justify-center min-h-[40vh] p-8">
    <div className="glass-panel p-8 max-w-sm w-full text-center space-y-4 border-rose-500/20">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Failed to Load Data</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-slate-900 rounded-xl font-semibold text-xs transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  </div>
);

export default ErrorState;
