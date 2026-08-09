import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';

const ExportCenterModal = ({ onClose, onExport, totalRecords = 1375506 }) => {
  const [format, setFormat] = useState('csv');
  const [scope, setScope] = useState('filtered');

  const handleRunExport = () => {
    onExport(format, scope);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Enterprise Export Center</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generate structured data exports from the Property Ledger</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">1. Select Format</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'csv', name: 'CSV File', desc: 'Raw data format', icon: FileText },
                { id: 'xlsx', name: 'Excel Sheet', desc: 'Formatted XLSX', icon: FileSpreadsheet },
                { id: 'pdf', name: 'PDF Report', desc: 'Printable summary', icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = format === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setFormat(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1 text-sky-500" />
                    <div className="text-xs font-bold">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">2. Select Scope</label>
            <div className="space-y-2">
              {[
                { id: 'filtered', label: 'Filtered Results', sub: 'Export records matching current search & filters' },
                { id: 'current_page', label: 'Current Page Only', sub: 'Export visible 20 rows on this page' },
                { id: 'full', label: `Full Database (${totalRecords.toLocaleString()} Records)`, sub: 'Complete database export' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setScope(option.id)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    scope === option.id
                      ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-600 dark:text-sky-400'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{option.label}</div>
                    <div className="text-[10px] text-slate-400">{option.sub}</div>
                  </div>
                  {scope === option.id && <CheckCircle2 className="w-4 h-4 text-sky-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <button onClick={onClose} className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            Cancel
          </button>
          <button
            onClick={handleRunExport}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate & Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportCenterModal;
