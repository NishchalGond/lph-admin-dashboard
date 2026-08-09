import React, { useState, useEffect, useCallback } from 'react';
import { getLogs, getLogStats, createLogEntry } from '../services/api';
import {
  FileText, Search, Terminal, AlertTriangle, Info, XCircle, Filter, RefreshCw,
  Play, Pause, Download, Copy, Check, ShieldCheck, Activity, Layers, Database, Code
} from 'lucide-react';
import Pagination from '../components/ui/Pagination';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import SkeletonTable from '../components/ui/SkeletonTable';
import HighlightText from '../components/ui/HighlightText';

const SEVERITY_CONFIG = {
  INFO:    { color: 'text-sky-600 dark:text-sky-400',    bg: 'bg-sky-500/10 border-sky-500/20',     icon: Info,           dot: 'bg-sky-500'    },
  WARNING: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertTriangle,   dot: 'bg-amber-500'  },
  ERROR:   { color: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20',   icon: XCircle,         dot: 'bg-rose-500'   },
};

const SOURCE_COLORS = {
  'Database FTS5': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  'n8n Webhook': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'Excel Processor': 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  'Export Engine': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  'API Gateway': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'System Health': 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
};

const SeverityBadge = ({ severity }) => {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.INFO;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold border ${config.bg} ${config.color} whitespace-nowrap`}>
      <Icon className="w-3 h-3" />
      {severity}
    </span>
  );
};

const LogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [severity, setSeverity] = useState('');
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [activeChip, setActiveChip] = useState('all');

  // Live Stream State
  const [isLive, setIsLive] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [queryTimeMs, setQueryTimeMs] = useState(12);

  // Fetch Stats & Logs
  const fetchLogStats = useCallback(() => {
    getLogStats()
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError(null);
    const t0 = performance.now();

    getLogs({
      page,
      page_size: 25,
      severity: severity || undefined,
      source: source || undefined,
      search: appliedSearch || undefined,
    })
      .then((res) => {
        const t1 = performance.now();
        setQueryTimeMs(Math.round(t1 - t0));
        setLogs(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to fetch system logs. Please check backend connectivity.');
        setLoading(false);
      });
  }, [page, severity, source, appliedSearch]);

  useEffect(() => {
    fetchLogStats();
    fetchLogs();
  }, [fetchLogs, fetchLogStats]);

  // Live Auto-Refresh Stream (every 3 seconds when Live Stream is enabled)
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      fetchLogs();
      fetchLogStats();
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive, fetchLogs, fetchLogStats]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(search);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSeverity('');
    setSource('');
    setSearch('');
    setAppliedSearch('');
    setActiveChip('all');
    setPage(1);
  };

  const handleSelectChip = (chipId) => {
    setActiveChip(chipId);
    setPage(1);
    if (chipId === 'all') {
      handleClearFilters();
    } else if (chipId === 'errors') {
      setSeverity('ERROR'); setSource(''); setAppliedSearch(''); setSearch('');
    } else if (chipId === 'fts') {
      setSource('Database FTS5'); setSeverity(''); setAppliedSearch(''); setSearch('');
    } else if (chipId === 'n8n') {
      setSource('n8n Webhook'); setSeverity(''); setAppliedSearch(''); setSearch('');
    } else if (chipId === 'exports') {
      setSource('Export Engine'); setSeverity(''); setAppliedSearch(''); setSearch('');
    }
  };

  const handleTriggerTestLog = () => {
    createLogEntry({
      severity: 'INFO',
      message: `Manual test log emitted by admin console at ${new Date().toLocaleTimeString()}`,
      source: 'API Gateway',
      batch_number: 102
    }).then(() => {
      fetchLogs();
      fetchLogStats();
    });
  };

  const handleCopyLog = (log) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `system_logs_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] w-full mx-auto min-h-screen bg-slate-50/50 dark:bg-[#070A10]">
      {/* 1. Header & Live Streaming Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
              isLive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isLive ? 'LIVE STREAMING ACTIVE' : 'STREAM PAUSED'}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
              Audit & Execution Telemetry
            </span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Terminal className="w-7 h-7 text-sky-500" />
              System Logs & Audit Intelligence
            </h1>
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
              Real-time events from FTS5 Engine, n8n Webhook, Excel Parser, and API Gateway
            </span>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Pause / Resume Stream */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-xs transition-all cursor-pointer ${
              isLive
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLive ? 'Pause Stream' : 'Resume Live'}</span>
          </button>

          {/* Trigger Test Log */}
          <button
            onClick={handleTriggerTestLog}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 shadow-xs transition-all cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-sky-500" />
            <span>Emit Event</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => { fetchLogs(); fetchLogStats(); }}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-500' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportLogs}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            title: 'Total Log Volume',
            value: stats ? stats.total_logs.toLocaleString() : total.toLocaleString(),
            subtext: 'Real-time feed active',
            icon: Layers,
            accentBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
          },
          {
            title: 'INFO Events',
            value: stats ? stats.info_count.toLocaleString() : '—',
            subtext: 'Normal operations',
            icon: Info,
            accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          },
          {
            title: 'WARNING Alerts',
            value: stats ? stats.warning_count.toLocaleString() : '—',
            subtext: 'Non-critical events',
            icon: AlertTriangle,
            accentBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          },
          {
            title: 'ERROR Exceptions',
            value: stats ? stats.error_count.toLocaleString() : '—',
            subtext: 'Requires attention',
            icon: XCircle,
            accentBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          },
          {
            title: 'Avg Processing Speed',
            value: `${queryTimeMs}ms`,
            subtext: 'FTS5 Indexed',
            icon: Activity,
            accentBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
          },
          {
            title: 'System Health',
            value: stats ? stats.system_status : '99.9%',
            subtext: 'All systems operational',
            icon: ShieldCheck,
            accentBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
          }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 truncate uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center border ${card.accentBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono">
                {card.value}
              </div>
              <div className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                {card.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Enterprise Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search log messages, sources, or batch numbers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 text-xs bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white font-medium placeholder-slate-400 transition-all outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Severity & Source Pickers */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Severity Select */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={severity}
                onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
                className="px-3 py-2 text-xs font-bold bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
              >
                <option value="">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            {/* Source Select */}
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs font-bold bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
            >
              <option value="">All Sources</option>
              <option value="Database FTS5">Database FTS5</option>
              <option value="n8n Webhook">n8n Webhook</option>
              <option value="Excel Processor">Excel Processor</option>
              <option value="Export Engine">Export Engine</option>
              <option value="API Gateway">API Gateway</option>
              <option value="System Health">System Health</option>
            </select>

            {/* Clear Filters */}
            {(severity || source || appliedSearch) && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Presets Pill Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
            Presets:
          </span>
          {[
            { id: 'all', label: 'All Logs' },
            { id: 'errors', label: '🔴 Exceptions & Errors' },
            { id: 'fts', label: '⚡ FTS5 Indexer' },
            { id: 'n8n', label: '🔄 n8n Webhook' },
            { id: 'exports', label: '📦 Export Jobs' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => handleSelectChip(chip.id)}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap ${
                activeChip === chip.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Terminal Log Stream Table */}
      <div className="rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-xl overflow-hidden font-mono">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-xs text-slate-400 font-bold ml-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              workflow-engine.log — Log Stream Viewer
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span><strong>{total.toLocaleString()}</strong> Total Logs</span>
            <span>•</span>
            <span className="text-sky-400 font-bold">Query: {queryTimeMs}ms</span>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-8">
            <SkeletonTable rows={8} cols={5} />
          </div>
        ) : error ? (
          <div className="p-8 bg-slate-900">
            <ErrorState message={error} onRetry={fetchLogs} />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50">
            <EmptyState
              icon={FileText}
              title="No log entries match your query"
              description="Adjust your search keywords or reset filter chips."
            />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[580px] custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-800 sticky top-0 z-20">
                <tr>
                  <th scope="col" className="p-3 pl-4">Timestamp</th>
                  <th scope="col" className="p-3">Severity</th>
                  <th scope="col" className="p-3">Source</th>
                  <th scope="col" className="p-3">Batch</th>
                  <th scope="col" className="p-3 pr-4">Log Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const isError = log.severity === 'ERROR';
                  const isWarn = log.severity === 'WARNING';
                  const sourceClass = SOURCE_COLORS[log.source] || 'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className={`cursor-pointer transition-colors ${
                          isError ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-200'
                          : isWarn ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-200'
                          : 'hover:bg-slate-900/80 text-slate-200'
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="p-3 pl-4 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>

                        {/* Severity */}
                        <td className="p-3">
                          <SeverityBadge severity={log.severity} />
                        </td>

                        {/* Source Tag */}
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${sourceClass}`}>
                            [{log.source}]
                          </span>
                        </td>

                        {/* Batch Number */}
                        <td className="p-3 text-slate-400 font-mono">
                          {log.batch_number ? `#${log.batch_number}` : '—'}
                        </td>

                        {/* Log Message */}
                        <td className="p-3 pr-4 text-slate-200 max-w-2xl truncate">
                          <HighlightText text={log.message} highlight={appliedSearch} />
                        </td>
                      </tr>

                      {/* Expanded Log Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-900/90 border-b border-slate-800">
                          <td colSpan={5} className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                                <Terminal className="w-4 h-4" /> Log Entry Metadata (ID #{log.id})
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopyLog(log); }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedId === log.id ? 'Copied Payload!' : 'Copy JSON'}
                              </button>
                            </div>

                            <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 text-xs overflow-x-auto border border-slate-800 font-mono">
                              {JSON.stringify(log, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Footer */}
        {!loading && !error && logs.length > 0 && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap text-slate-400 text-xs">
            <div>
              Showing <strong>{((page - 1) * 25) + 1}–{Math.min(page * 25, total)}</strong> of <strong>{total.toLocaleString()}</strong> log entries
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsViewer;
