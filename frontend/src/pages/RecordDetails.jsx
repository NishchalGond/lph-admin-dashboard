import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecordDetails } from '../services/api';
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, User, DollarSign,
  FileSpreadsheet, Code2, Copy, Check, ExternalLink, ChevronRight,
  Home, Globe2, Hash, BedDouble, Calendar, Share2, Download,
  ShieldCheck, Layers, Sparkles
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import ErrorState from '../components/ui/ErrorState';

/* ────────────────────────────────────────────────────────────
   Tab config
──────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',  label: 'Overview & Unit', icon: Building2     },
  { id: 'owner',     label: 'Owner & Contact', icon: User          },
  { id: 'financial', label: 'Financials',      icon: DollarSign    },
  { id: 'lineage',   label: 'Data Lineage',    icon: FileSpreadsheet },
  { id: 'raw',       label: 'Raw JSON',        icon: Code2         },
];

/* ────────────────────────────────────────────────────────────
   Refined Stat Pill / Metric Box
──────────────────────────────────────────────────────────── */
const MetricCard = ({ label, value, subtext, icon: Icon, color = 'sky' }) => {
  const colorMap = {
    sky: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/40',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/40',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-3.5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]} flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <span className="block text-lg font-bold text-slate-900 dark:text-white truncate font-mono mt-0.5">
          {value || '—'}
        </span>
        {subtext && (
          <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Clean Property Attribute Cell
──────────────────────────────────────────────────────────── */
const AttributeCell = ({ label, value, mono = false, highlight = false }) => (
  <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-1">
    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">
      {label}
    </span>
    <span className={`block text-xs font-semibold break-words ${
      highlight
        ? 'text-sky-600 dark:text-sky-400 font-mono'
        : mono
        ? 'font-mono text-slate-700 dark:text-slate-300'
        : 'text-slate-900 dark:text-white'
    }`}>
      {value || <span className="text-slate-300 dark:text-slate-600 font-normal">—</span>}
    </span>
  </div>
);

/* ────────────────────────────────────────────────────────────
   Skeleton Loader
──────────────────────────────────────────────────────────── */
const RecordDetailsSkeleton = () => (
  <div className="p-6 space-y-6 max-w-6xl mx-auto animate-pulse">
    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
    <div className="h-44 bg-slate-100 dark:bg-slate-800/60 rounded-3xl" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
      ))}
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────
   RecordDetails Page Component
──────────────────────────────────────────────────────────── */
const RecordDetails = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [copied, setCopied]   = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchDetails = () => {
    setLoading(true);
    setError(null);
    getRecordDetails(recordId)
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => { setError('Unable to retrieve property record details.'); setLoading(false); });
  };

  useEffect(() => { fetchDetails(); }, [recordId]);

  const copyJson = () => {
    if (data?.record?.raw_data_json) {
      navigator.clipboard.writeText(data.record.raw_data_json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <RecordDetailsSkeleton />;
  if (error)   return <ErrorState message={error} onRetry={fetchDetails} />;

  const rec = data.record;
  const rawObj = rec.raw_data_json ? (() => { try { return JSON.parse(rec.raw_data_json); } catch { return {}; } })() : {};

  // Financial calculations
  const numericVal = rec.procedure_value ? Number(rec.procedure_value) : null;
  const numericSize = rec.size ? parseFloat(String(rec.size).replace(/[^0-9.]/g, '')) : null;
  const pricePerSqFt = numericVal && numericSize ? Math.round(numericVal / numericSize) : null;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto page-enter">
      {/* ── Top Navigation & Actions ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={copyJson}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
        </div>
      </div>

      {/* ── Executive Hero Card ── */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Owner info & badges */}
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border border-sky-200/60 dark:border-sky-800/50 px-2.5 py-0.5 rounded-lg">
                PI #{rec.pi_number || 'N/A'}
              </span>
              <Badge status={rec.buyer_seller_type || 'Buyer'} size="xs" />
              {rec.property_type && <Badge status={rec.property_type} color="emerald" size="xs" />}
              {rec.community && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                  {rec.community}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 flex items-center justify-center text-xl font-extrabold select-none flex-shrink-0">
                {(rec.name || rec.customer_name || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                  {rec.name || rec.customer_name || 'Unknown Owner'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-1">
                  {[rec.building_cluster, rec.unit_number ? `Unit ${rec.unit_number}` : null, rec.project]
                    .filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
          </div>

          {/* Procedure Value Hero Banner */}
          <div className="lg:text-right p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white dark:from-slate-800/90 dark:to-slate-900/90 border border-slate-700/50 shadow-xl flex-shrink-0 min-w-[240px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-1">
              Procedure Value
            </span>
            <span className="text-2xl md:text-3xl font-black font-mono text-white block">
              {numericVal ? `AED ${numericVal.toLocaleString()}` : <span className="text-slate-400 text-lg font-sans">Value Unstated</span>}
            </span>
            {pricePerSqFt ? (
              <span className="text-xs font-semibold text-emerald-400/90 block mt-1">
                ≈ AED {pricePerSqFt.toLocaleString()} / sq.ft
              </span>
            ) : rec.developer ? (
              <span className="text-xs font-medium text-slate-400 block mt-1">
                Developer: {rec.developer}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Key Metrics Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Valuation"
          value={numericVal ? `AED ${(numericVal / 1000000).toFixed(2)}M` : 'Unstated'}
          subtext={numericVal ? `AED ${numericVal.toLocaleString()}` : 'No transaction record'}
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          label="Price / SqFt"
          value={pricePerSqFt ? `AED ${pricePerSqFt.toLocaleString()}` : '—'}
          subtext={numericSize ? `Based on ${numericSize.toLocaleString()} sq.ft` : 'Size unknown'}
          icon={Sparkles}
          color="amber"
        />
        <MetricCard
          label="Property Size"
          value={rec.size || '—'}
          subtext={rec.property_type || 'Residential'}
          icon={Home}
          color="sky"
        />
        <MetricCard
          label="Bedrooms"
          value={rec.bedroom || '—'}
          subtext={rec.buyer_seller_type ? `Role: ${rec.buyer_seller_type}` : 'Unit specs'}
          icon={BedDouble}
          color="purple"
        />
      </div>

      {/* ── Segmented Tab Bar ── */}
      <div className="glass-panel rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === id
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content Panels ── */}
      <div className="space-y-6">

        {/* Tab 1: Overview & Unit */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location & Unit References */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <MapPin className="w-4 h-4 text-sky-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Location & Unit Identifiers
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <AttributeCell label="Community" value={rec.community} />
                <AttributeCell label="Sub-Community" value={rec.sub_community} />
                <AttributeCell label="Building / Cluster" value={rec.building_cluster} />
                <AttributeCell label="Unit Number" value={rec.unit_number} highlight />
                <AttributeCell label="Plot Reg. No" value={rec.plot_reg_no} mono />
                <AttributeCell label="Plot Number" value={rec.plot_number} mono />
                <AttributeCell label="DMNO" value={rec.dmno} mono />
                <AttributeCell label="DMsubno" value={rec.dmsubno} mono />
              </div>
            </div>

            {/* Property Specifications */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Building2 className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Property Specifications
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <AttributeCell label="Property Type" value={rec.property_type} />
                <AttributeCell label="Bedrooms" value={rec.bedroom} />
                <AttributeCell label="Size" value={rec.size} />
                <AttributeCell label="Developer" value={rec.developer} />
                <AttributeCell label="Project" value={rec.project} />
                <AttributeCell
                  label="Registration Date"
                  value={rec.date ? new Date(rec.date).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: '2-digit' }) : null}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Owner & Contact */}
        {activeTab === 'owner' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner Identity */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <User className="w-4 h-4 text-sky-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Owner Profile
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <AttributeCell label="Full Legal Name" value={rec.name || rec.customer_name} />
                </div>
                <AttributeCell label="Nationality" value={rec.nationality} />
                <AttributeCell label="Role Type" value={rec.buyer_seller_type} />
                <AttributeCell label="PI Number" value={rec.pi_number} highlight />
                <AttributeCell label="Company" value={rec.company} />
              </div>
            </div>

            {/* Contact Channels */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Contact Channels
                  </h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Verified Contact
                </span>
              </div>
              <div className="space-y-3">
                {[rec.mobile_1, rec.mobile_2, rec.mobile_3].filter(Boolean).map((m, i) => (
                  <a
                    key={i}
                    href={`tel:${m}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-sky-300 dark:hover:border-sky-700 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {m}
                        </span>
                        <span className="block text-[10px] font-medium text-slate-400">
                          Mobile Line #{i + 1}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Call &rarr;
                    </span>
                  </a>
                ))}
                {rec.email_address && (
                  <a
                    href={`mailto:${rec.email_address}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {rec.email_address}
                        </span>
                        <span className="block text-[10px] font-medium text-slate-400">
                          Email Address
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Email &rarr;
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Financials */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Valuation Breakdown
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AttributeCell
                  label="Procedure Value"
                  value={numericVal ? `AED ${numericVal.toLocaleString()}` : null}
                  highlight
                />
                <AttributeCell
                  label="Price per SqFt"
                  value={pricePerSqFt ? `AED ${pricePerSqFt.toLocaleString()} / sq.ft` : null}
                />
                <AttributeCell label="Property Size" value={rec.size} />
                <AttributeCell label="Developer" value={rec.developer} />
                <AttributeCell label="Project" value={rec.project} />
                <AttributeCell
                  label="Transaction Date"
                  value={rec.date ? new Date(rec.date).toLocaleDateString('en-AE') : null}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Data Lineage */}
        {activeTab === 'lineage' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Workbook */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <FileSpreadsheet className="w-4 h-4 text-sky-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Source Excel Workbook
                </h2>
              </div>
              <div className="space-y-3">
                <AttributeCell label="Workbook Name" value={rec.original_workbook} highlight />
                <div className="grid grid-cols-2 gap-3">
                  <AttributeCell label="Sheet Name" value={rec.sheet_name} />
                  <AttributeCell label="Row Index" value={rec.row_number ? `#${rec.row_number}` : null} mono />
                </div>
                {data.source_file && (
                  <button
                    onClick={() => navigate(`/files/${data.source_file.id}`)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/40 text-sky-700 dark:text-sky-300 font-semibold text-xs hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                  >
                    <span>Inspect File #{data.source_file.record_id || data.source_file.id}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Batch Info */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Layers className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Ingestion Batch
                </h2>
              </div>
              <div className="space-y-3">
                <AttributeCell label="Batch Number" value={data.batch ? `Batch #${data.batch.batch_number}` : null} mono />
                <AttributeCell label="Batch Name" value={data.batch?.batch_name} />
                {data.batch && (
                  <button
                    onClick={() => navigate(`/batches/${data.batch.id}`)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 font-semibold text-xs hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <span>Inspect Batch Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Raw JSON */}
        {activeTab === 'raw' && (
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Raw Ingestion Data (JSON)
                </h2>
              </div>
              <button
                onClick={copyJson}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 text-emerald-400 font-mono text-xs p-6 rounded-2xl overflow-x-auto border border-slate-800 leading-relaxed max-h-[500px]">
              {JSON.stringify(rawObj, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
};

export default RecordDetails;
