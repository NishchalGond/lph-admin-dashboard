import React from 'react';
import { X, Columns, Check, Eye, EyeOff, RotateCcw } from 'lucide-react';

const ColumnManagerModal = ({
  allColumns,
  visibleColumns,
  onToggleColumn,
  onSelectAll,
  onHideAll,
  onResetDefaults,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Columns className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Column Manager</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Customize visible columns in your Property Ledger workspace</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="px-2.5 py-1 rounded-lg font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              Select All
            </button>
            <button
              onClick={onHideAll}
              className="px-2.5 py-1 rounded-lg font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              Hide All
            </button>
          </div>

          <button
            onClick={onResetDefaults}
            className="text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset Defaults
          </button>
        </div>

        {/* Columns Grid */}
        <div className="p-6 max-h-80 overflow-y-auto grid grid-cols-2 gap-2">
          {allColumns.map((col) => {
            const isVisible = visibleColumns.includes(col.id);
            const isPinned = col.pinned;
            return (
              <button
                key={col.id}
                disabled={isPinned}
                onClick={() => !isPinned && onToggleColumn(col.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  isPinned
                    ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : isVisible
                    ? 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                    : 'bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isVisible ? <Eye className="w-3.5 h-3.5 text-purple-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{col.label}</span>
                </div>
                {isPinned ? (
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pinned</span>
                ) : isVisible ? (
                  <Check className="w-3.5 h-3.5 text-purple-500" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {visibleColumns.length} of {allColumns.length} columns active
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all"
          >
            Apply Layout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnManagerModal;
