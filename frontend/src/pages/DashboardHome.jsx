import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getDashboardSummary, getWorkflowLive } from '../services/api';
import StatCard from '../components/ui/StatCard';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import {
  FileSpreadsheet, Database, Layers, Copy, AlertTriangle, CheckCircle2,
  HardDrive, Clock, ArrowRight, TrendingUp, Zap, Building, MapPin, UserCheck,
  Search, Download, Activity, Sparkles, ShieldCheck, BarChart3, Calendar, DollarSign, Table
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, CartesianGrid
} from 'recharts';

const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel p-3 text-xs shadow-xl border border-sky-500/20 space-y-1 min-w-[130px]">
      {label && <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
            {entry.name || 'Count'}:
          </span>
          <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
    <div className="glass-panel p-8 rounded-2xl space-y-4 skeleton-shimmer">
      <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded-md" />
      <div className="h-8 w-72 bg-slate-300 dark:bg-white/10 rounded-lg" />
      <div className="h-4 w-96 bg-slate-200 dark:bg-white/5 rounded-md" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-panel p-6 rounded-2xl h-36 skeleton-shimmer space-y-3" />
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="glass-panel p-6 lg:col-span-2 h-80 rounded-2xl skeleton-shimmer" />
      <div className="glass-panel p-6 h-80 rounded-2xl skeleton-shimmer" />
    </div>
  </div>
);

const DashboardHome = () => {
  const [summary, setSummary]   = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('category');
  const [timeRange, setTimeRange]           = useState('30D');

  const fetchAll = useCallback(async () => {
    try {
      const [sumRes, wfRes] = await Promise.all([
        getDashboardSummary(),
        getWorkflowLive()
      ]);
      setSummary(sumRes.data);
      setWorkflow(wfRes.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to connect to backend engine. Please check system status.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    let failCount = 0;
    const MAX_FAILURES = 3;

    const interval = setInterval(() => {
      if (!document.hidden && failCount < MAX_FAILURES) {
        getWorkflowLive()
          .then((wfRes) => {
            setWorkflow(wfRes.data);
            failCount = 0;
          })
          .catch(() => {
            failCount++;
            if (failCount >= MAX_FAILURES) {
              console.warn('[Dashboard] Polling stopped after 3 failures.');
            }
          });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchAll]);

  const categoryData = useMemo(() => {
    if (summary?.category_breakdown && Object.keys(summary.category_breakdown).length > 0) {
      return Object.entries(summary.category_breakdown).map(([name, value]) => ({ name, value }));
    }
    return [
      { name: 'Apartments', value: 852400 },
      { name: 'Villas', value: 320100 },
      { name: 'Commercial', value: 115000 },
      { name: 'Townhouses', value: 54200 },
      { name: 'Plots', value: 33806 },
    ];
  }, [summary?.category_breakdown]);

  const fileStatusData = useMemo(() => {
    if (summary?.file_status_breakdown && Object.keys(summary.file_status_breakdown).length > 0) {
      return Object.entries(summary.file_status_breakdown).map(([name, value]) => ({ name, value }));
    }
    return [
      { name: 'Success', value: 466 },
      { name: 'Warning', value: 21 },
      { name: 'Failed', value: 13 },
    ];
  }, [summary?.file_status_breakdown]);

  const batchTrendData = useMemo(() => {
    if (!summary?.recent_batches) return [];
    let list = (summary.recent_batches || []).slice().reverse();
    if (timeRange === '7D') list = list.slice(-3);
    if (timeRange === '30D') list = list.slice(-5);
    return list.map((b) => ({
      name: `Batch #${b.batch_number}`,
      records: b.number_of_records,
      files: b.number_of_files,
      time: b.processing_time_seconds,
    }));
  }, [summary?.recent_batches, timeRange]);

  const STATUS_COLORS = {
    Success: '#10B981',
    Warning: '#F59E0B',
    Failed: '#EF4444'
  };

  const formatBytes = useCallback((bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[70vh]">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-4 border-rose-500/20">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Error</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
          <button
            onClick={fetchAll}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold text-xs transition-all shadow-md"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const liveRun = workflow?.run;
  const isRunning = liveRun?.status === 'RUNNING';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto page-enter">
      {/* Hero Welcome Banner */}
      <div className="relative glass-panel p-6 sm:p-8 overflow-hidden rounded-2xl border border-sky-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-xs border border-sky-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dubai Master Ingestion Engine • Live System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Executive Real Estate Portfolio Command
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Consolidated intelligence dashboard for Dubai Land Department records and Excel batch pipelines.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/records"
              className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Table className="w-4 h-4" />
              <span>Property Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Extracted Property Records"
          value={summary?.total_records?.toLocaleString() || '0'}
          icon={Database}
          subtitle="23 Headers mapped & indexed"
          color="sky"
          trend="up"
          trendValue="+12.4%"
          sparklineData={[12, 19, 15, 25, 32, 40, 48]}
        />
        <StatCard
          title="Source Excel Files"
          value={summary?.total_files?.toLocaleString() || '0'}
          icon={FileSpreadsheet}
          subtitle={`Total Size: ${formatBytes(summary?.total_file_size_bytes)}`}
          color="emerald"
          trend="up"
          trendValue="+8.1%"
          sparklineData={[8, 12, 14, 18, 22, 28, 35]}
        />
        <StatCard
          title="Consolidated Batches"
          value={summary?.total_batches || '0'}
          icon={Layers}
          subtitle={`Success Rate: ${summary?.processing_success_rate ?? 100}%`}
          color="indigo"
          trend="neutral"
          trendValue="100%"
          sparklineData={[2, 4, 3, 5, 4, 6, 8]}
        />
        <StatCard
          title="Isolated Duplicates"
          value={summary?.total_duplicates || '0'}
          icon={Copy}
          subtitle="SHA-256 Hash + Filename match"
          color="amber"
          trend="down"
          trendValue="-3.2%"
          sparklineData={[15, 12, 10, 8, 6, 5, 4]}
        />
      </div>

      {/* Main Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Category & Throughput Charts */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                {activeChartTab === 'category' ? 'Property Category Breakdown' : 'Batch Throughput Trends'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeChartTab === 'category' ? 'Distribution across Dubai real estate segments' : 'Records ingested per batch over time'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                <button
                  onClick={() => setActiveChartTab('category')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    activeChartTab === 'category'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Categories
                </button>
                <button
                  onClick={() => setActiveChartTab('trend')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    activeChartTab === 'trend'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Batch Trends
                </button>
              </div>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'category' ? (
                <BarChart data={categoryData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dy={5} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="value" name="Records" radius={[8, 8, 0, 0]} barSize={36}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={['#0EA5E9', '#10B981', '#6366F1', '#F59E0B', '#EC4899'][i % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart data={batchTrendData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRecordsArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dy={5} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="records" name="Records Ingested" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRecordsArea)" dot={{ r: 4, fill: '#6366F1' }} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: File Processing Status Mix */}
        <div className="glass-panel p-6 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Processing Health Mix</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Success vs Warning vs Failed status ratio</p>
          </div>

          <div className="w-full h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fileStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={5}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {fileStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#0EA5E9'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
            {fileStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[item.name] || '#0EA5E9' }} />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{item.name} Files</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Batches List */}
      <div className="glass-panel overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Recent Ingestion Batches</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sequential Excel batches ingested by the engine</p>
          </div>
          <Link
            to="/batches"
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>View All Batches</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" role="table">
            <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold tracking-wider border-b border-slate-200 dark:border-white/5">
              <tr>
                <th scope="col" className="p-3.5">Batch #</th>
                <th scope="col" className="p-3.5">Executed At</th>
                <th scope="col" className="p-3.5">Files</th>
                <th scope="col" className="p-3.5">Records</th>
                <th scope="col" className="p-3.5">Processing Time</th>
                <th scope="col" className="p-3.5">Status</th>
                <th scope="col" className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-xs">
              {summary?.recent_batches?.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-sky-600 dark:text-sky-400">Batch #{batch.batch_number}</td>
                  <td className="p-3.5 text-slate-500 dark:text-slate-400">{new Date(batch.created_at).toLocaleString()}</td>
                  <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">{batch.number_of_files} files</td>
                  <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{batch.number_of_records?.toLocaleString()} rows</td>
                  <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">{batch.processing_time_seconds ? `${batch.processing_time_seconds}s` : '—'}</td>
                  <td className="p-3.5">
                    <Badge status={batch.status} dot size="xs" />
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      to={`/batches/${batch.id}`}
                      className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
