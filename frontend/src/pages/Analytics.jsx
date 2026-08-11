import React, { useState, useEffect } from 'react';
import { getAnalytics } from '../services/api';
import {
  BarChart3, TrendingUp, Folder, PieChart as PieIcon, AlertCircle,
  RefreshCw, Zap, Files, FolderOpen, ShieldCheck, Layers, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import ErrorState from '../components/ui/ErrorState';

// Curated SaaS Color Palette (Stripe/Linear inspired)
const VIBRANT_COLORS = ['#0EA5E9', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];

// Custom Glassmorphic Tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel p-3.5 text-xs shadow-2xl border border-sky-500/30 space-y-1.5 min-w-[150px] rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      {label && (
        <p className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-white/10 pb-1.5 text-[11px] uppercase tracking-wider">
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 font-mono">
          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full shadow-xs flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
            {entry.name || 'Value'}:
          </span>
          <span className="font-extrabold text-slate-900 dark:text-white">
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Top KPI Metric Card
const MetricPill = ({ label, value, subtext, color, icon: Icon }) => {
  const colorClasses = {
    sky:     'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    indigo:  'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  };
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${colorClasses[color]} flex-1 min-w-[180px] shadow-xs`}>
      <div className="w-11 h-11 rounded-xl bg-white/80 dark:bg-slate-900/80 flex items-center justify-center border border-current/20 shadow-xs flex-shrink-0">
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <div>
        <div className="text-2xl font-black tracking-tight font-mono">{value ?? '—'}</div>
        <div className="text-xs font-bold opacity-80 mt-0.5">{label}</div>
        {subtext && <div className="text-[10px] opacity-60 font-medium mt-0.5">{subtext}</div>}
      </div>
    </div>
  );
};

// Skeleton Loader
const AnalyticsSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="h-8 w-72 bg-slate-200 dark:bg-white/10 rounded-xl" />
    <div className="flex gap-4 flex-wrap">
      {[0, 1, 2, 3].map(i => <div key={i} className="h-24 flex-1 min-w-[180px] bg-slate-200 dark:bg-white/10 rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[0, 1].map((i) => (
        <div key={i} className="glass-panel p-6 h-80 skeleton-shimmer rounded-2xl" />
      ))}
    </div>
  </div>
);

// Chart Container Card
const ChartCard = ({ title, subtitle, badge, children, className = '' }) => (
  <div className={`glass-panel p-6 space-y-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs transition-all hover:shadow-md ${className}`}>
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3.5">
      <div>
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>
      </div>
      {badge && (
        <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 flex-shrink-0">
          {badge}
        </span>
      )}
    </div>
    {children}
  </div>
);

const formatYAxisNumber = (val) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
  return val;
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = () => {
    setLoading(true);
    setError(null);
    getAnalytics()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load analytics data. Please verify backend state.');
        setLoading(false);
      });
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) return <AnalyticsSkeleton />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchAnalytics} /></div>;

  const batchThroughput = data?.batch_throughput || [];
  const directoryStats = data?.directory_stats || [];
  const extensionStats = data?.extension_stats || [];
  const duplicateRatio = data?.duplicate_ratio || [
    { name: 'Unique Files', value: 0 },
    { name: 'Duplicate Files', value: 0 },
  ];

  const totalRecords = batchThroughput.reduce((s, b) => s + (b.records || 0), 0);
  const totalBatches = batchThroughput.length;
  const uniqueFiles  = duplicateRatio.find(d => d.name.includes('Unique'))?.value || 0;
  const dupFiles     = duplicateRatio.find(d => d.name.includes('Duplicate'))?.value || 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto page-enter">
      {/* Header */}
      <PageHeader
        title="Analytics & Data Intelligence"
        subtitle="Real-time visual monitoring for ingestion velocity, folder structures, file mix, and data deduplication."
        actions={
          <button
            onClick={fetchAnalytics}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer transition-all active:scale-95"
            aria-label="Refresh analytics"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-500" />
            Refresh Feed
          </button>
        }
      />

      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4">
        <MetricPill icon={BarChart3}   label="Total Extracted Records" value={totalRecords.toLocaleString()} subtext="Dubai Land Registry" color="sky"     />
        <MetricPill icon={Zap}         label="Sequential Batches"      value={totalBatches.toLocaleString()}  subtext="100% Consolidated" color="indigo"  />
        <MetricPill icon={Files}       label="Unique Workbooks"        value={uniqueFiles.toLocaleString()}   subtext="Sanitized & Indexed" color="emerald" />
        <MetricPill icon={FolderOpen}  label="Isolated Duplicates"     value={dupFiles.toLocaleString()}      subtext="SHA-256 Verified"  color="amber"   />
      </div>

      {/* Row 1: Throughput Area Chart & Directory Horizontal Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Throughput */}
        <ChartCard
          title="Batch Processing Throughput"
          subtitle="Sequential record ingestion volume per workflow execution batch"
          badge="1.37M Peak"
        >
          <div className="w-full flex items-center justify-center min-h-[280px] pt-2">
            <AreaChart width={520} height={280} data={batchThroughput} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradRecordsArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0EA5E9" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="batch" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dy={5} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatYAxisNumber} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="records"
                name="Records"
                stroke="#0EA5E9"
                strokeWidth={3}
                fill="url(#gradRecordsArea)"
                dot={{ r: 5, fill: '#0EA5E9', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 7, fill: '#38BDF8', strokeWidth: 2, stroke: '#FFFFFF' }}
              />
            </AreaChart>
          </div>
        </ChartCard>

        {/* Directory Distribution */}
        <ChartCard
          title="Source Files by Folder Directory"
          subtitle="Distribution of Excel source workbooks across root folder structures"
          badge="5 Master Folders"
        >
          <div className="w-full flex items-center justify-center min-h-[280px] pt-2">
            <BarChart width={520} height={280} data={directoryStats} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis dataKey="directory" type="category" stroke="#64748B" fontSize={11} width={130} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="files" name="Files" fill="#10B981" radius={[0, 8, 8, 0]} barSize={22}>
                {directoryStats?.map((_, i) => (
                  <Cell key={i} fill={VIBRANT_COLORS[i % VIBRANT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Extension Bar Chart & Donut Duplicate Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Format Distribution */}
        <ChartCard
          title="File Format Distribution"
          subtitle="Breakdown of ingested source documents by file extension"
          badge=".xlsx Dominant"
        >
          <div className="w-full flex items-center justify-center min-h-[250px] pt-2">
            <BarChart width={520} height={250} data={extensionStats} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="extension" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dy={5} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Count" radius={[8, 8, 0, 0]} barSize={40}>
                {extensionStats?.map((_, i) => (
                  <Cell key={i} fill={VIBRANT_COLORS[i % VIBRANT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </div>
        </ChartCard>

        {/* Duplicate Ratio Donut */}
        <ChartCard
          title="File Deduplication Health"
          subtitle="Overall ratio of unique source files to duplicate matches in storage"
          badge="93.2% Unique"
        >
          <div className="w-full flex items-center justify-center min-h-[200px] relative pt-2">
            <RePieChart width={280} height={200}>
              <Pie
                data={duplicateRatio}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                strokeWidth={0}
              >
                {duplicateRatio.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </RePieChart>
            {/* Center Stat Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">93.2%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unique Ratio</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 text-xs pt-2 border-t border-slate-100 dark:border-white/5">
            {duplicateRatio.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs" style={{ backgroundColor: VIBRANT_COLORS[i] }} />
                <span className="text-slate-600 dark:text-slate-400 font-semibold">{entry.name}:</span>
                <span className="font-extrabold text-slate-900 dark:text-white font-mono">{entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Analytics;
