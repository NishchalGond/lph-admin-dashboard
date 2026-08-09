import React from 'react';
import {
  Building2, Database, ShieldCheck, Download, Columns, RefreshCw, LayoutGrid, SlidersHorizontal
} from 'lucide-react';

const RecordHeader = ({
  totalRecords = 0,
  totalFields = 23,
  queryTimeMs = 63,
  lastUpdated = 'Today • 09:42 AM',
  onOpenExport = () => {},
  onOpenColumnManager = () => {},
  onToggleDensity = () => {},
  density = 'comfortable',
  onRefresh = () => {},
  isRefreshing = false,
  activePreset = 'all',
  onSelectPreset = () => {}
}) => {
  return (
    <div className="space-y-4">
      {/* Top Banner / Breadcrumb + Metadata */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-500/10 dark:bg-sky-400/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
              <Database className="w-3 h-3" /> DLD Dubai Engine
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> FTS5 WAL Active
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
              Last Synced: {lastUpdated}
            </span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-sky-500" />
              Property Ledger
            </h1>
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
              Dubai Land Department Consolidated Database
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 shadow-xs transition-all disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-500' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Density Toggle */}
          <button
            onClick={onToggleDensity}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 shadow-xs transition-all"
            title={`Density: ${density}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="capitalize hidden sm:inline">{density}</span>
          </button>

          {/* Column Manager */}
          <button
            onClick={onOpenColumnManager}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 shadow-xs transition-all"
          >
            <Columns className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Columns</span>
          </button>

          {/* Export Center */}
          <button
            onClick={onOpenExport}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Preset View Switcher Bar */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200/80 dark:border-slate-800 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <LayoutGrid className="w-3 h-3 text-slate-500" /> Views:
          </span>
          {[
            { id: 'all', label: 'All Records' },
            { id: 'villas', label: 'Villas & Townhouses' },
            { id: 'apartments', label: 'Apartments Only' },
            { id: 'emaar', label: 'Emaar Properties' },
            { id: 'high_value', label: 'High Value (AED 5M+)' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap ${
                activePreset === preset.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-mono font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <strong>{totalRecords.toLocaleString()}</strong> Rows
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            <strong>{totalFields}</strong> Columns
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="text-sky-600 dark:text-sky-400 font-bold">
            FTS Query: {queryTimeMs}ms
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecordHeader;
