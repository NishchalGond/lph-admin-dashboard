import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X, ArrowUpRight, Building2, MapPin, Phone, Mail, User,
  DollarSign, FileSpreadsheet, Code2, Layers, BedDouble,
  Hash, Calendar, Globe2, ShieldCheck, Copy, Check,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { getRecordDetails } from '../../services/api';
import Badge from './Badge';

/* ────────────────────────────────────────────
   Tab definitions
──────────────────────────────────────────── */
const TABS = [
  { id: 'all',       label: 'All Details', icon: Layers           },
  { id: 'property',  label: 'Property',   icon: Building2      },
  { id: 'owner',     label: 'Owner',       icon: User           },
  { id: 'financial', label: 'Financials',  icon: DollarSign     },
  { id: 'lineage',   label: 'Lineage',     icon: FileSpreadsheet },
  { id: 'raw',       label: 'Raw JSON',    icon: Code2          },
];

/* ────────────────────────────────────────────
   Small info card
──────────────────────────────────────────── */
const InfoCard = ({ label, value, mono = false, accent = false }) => (
  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/50 space-y-1">
    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">
      {label}
    </span>
    <span className={`block text-sm font-semibold break-words leading-snug ${
      accent
        ? 'text-emerald-600 dark:text-emerald-400 font-mono'
        : mono
        ? 'font-mono text-slate-700 dark:text-slate-200'
        : 'text-slate-900 dark:text-white'
    }`}>
      {value || <span className="text-slate-300 dark:text-slate-600 font-normal">—</span>}
    </span>
  </div>
);

/* ────────────────────────────────────────────
   Skeleton
──────────────────────────────────────────── */
const PanelSkeleton = () => (
  <div className="flex flex-col h-full animate-pulse p-6 space-y-5">
    <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-xl" />
    <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-lg" />
    <div className="h-px bg-slate-200 dark:bg-slate-700" />
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      ))}
    </div>
  </div>
);

/* ────────────────────────────────────────────
   Main Panel Component
──────────────────────────────────────────── */
const PropertyDeepDivePanel = ({ recordId, onClose }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [copied, setCopied] = useState(false);

  const fetchRecord = useCallback(() => {
    if (!recordId) return;
    setLoading(true);
    setError(null);
    setData(null);

    getRecordDetails(recordId)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load record details.');
        setLoading(false);
      });
  }, [recordId]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  // Lock background scrolling when drawer is open
  useEffect(() => {
    const mainEl = document.querySelector('main');
    const overflowEls = document.querySelectorAll('.overflow-y-auto');
    const originalBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    if (mainEl) mainEl.style.overflow = 'hidden';
    overflowEls.forEach((el) => {
      if (!el.closest('aside')) {
        el.style.overflow = 'hidden';
      }
    });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      if (mainEl) mainEl.style.overflow = '';
      overflowEls.forEach((el) => {
        if (!el.closest('aside')) {
          el.style.overflow = '';
        }
      });
    };
  }, []);

  // Keyboard: Escape closes panel
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const copyJson = () => {
    if (data?.record?.raw_data_json) {
      navigator.clipboard.writeText(data.record.raw_data_json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goFullPage = () => {
    navigate(`/records/${recordId}`);
    onClose();
  };

  const rec = data?.record;
  const rawObj = rec?.raw_data_json ? (() => {
    try { return JSON.parse(rec.raw_data_json); } catch { return {}; }
  })() : {};

  if (!recordId) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-40"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Property record details"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl flex flex-col h-full h-dvh
                   bg-white dark:bg-[#0D1117] shadow-2xl border-l border-slate-200 dark:border-slate-800
                   animate-slide-in-right overflow-hidden overscroll-contain"
        style={{
          animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* ── Panel Header ── */}
        <header className="flex-shrink-0 flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1117]">
          {loading || !rec ? (
            <div className="space-y-2 flex-1 animate-pulse">
              <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-3.5 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded">
                  PI #{rec.pi_number || 'N/A'}
                </span>
                <Badge status={rec.buyer_seller_type || 'Buyer'} size="xs" />
                {rec.property_type && <Badge status={rec.property_type} color="emerald" size="xs" />}
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                {rec.name || rec.customer_name || 'Unknown Owner'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {[rec.building_cluster, rec.community, rec.unit_number ? `Unit ${rec.unit_number}` : null]
                  .filter(Boolean).join(' · ')}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            {!loading && rec && (
              <button
                onClick={goFullPage}
                title="Open full page"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Full Page
              </button>
            )}
            <button
              onClick={onClose}
              title="Close panel (Esc)"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ── Value Banner ── */}
        {!loading && rec && (
          <div className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-emerald-200/60 dark:border-emerald-800/30 flex items-center justify-between">
            <div>
              <span className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                {rec.procedure_value
                  ? `AED ${Number(rec.procedure_value).toLocaleString()}`
                  : 'N/A'}
              </span>
              {rec.size && (
                <span className="ml-2 text-xs text-emerald-600/80 dark:text-emerald-500 font-medium">
                  · {rec.size} sqft
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">{rec.developer || '—'}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{rec.project || '—'}</span>
            </div>
          </div>
        )}

        {/* ── Tab Bar ── */}
        {!loading && rec && (
          <div className="flex-shrink-0 flex border-b border-slate-200 dark:border-slate-800 px-4 bg-white dark:bg-[#0D1117] overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all -mb-px ${
                  activeTab === id
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
          {loading ? (
            <PanelSkeleton />
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-500 dark:text-red-400 font-medium">{error}</p>
              <button onClick={fetchRecord} className="mt-2 text-xs text-sky-600 dark:text-sky-400 hover:underline">
                Try again
              </button>
            </div>
          ) : (
            <div className="p-6">

              {/* All Record Fields Organized into Clear Category Cards */}
              {activeTab === 'all' && (
                <div className="space-y-6">
                  {/* 1. Owner Profile & Contact Channels */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <User className="w-4 h-4 text-sky-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Owner & Contact Details
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="col-span-2 sm:col-span-3">
                        <InfoCard label="Full Legal Name" value={rec.name || rec.customer_name} />
                      </div>
                      <InfoCard label="PI Number / PID" value={rec.pi_number} mono accent />
                      <InfoCard label="Buyer / Seller Type" value={rec.buyer_seller_type} />
                      <InfoCard label="Nationality" value={rec.nationality} />
                      <InfoCard label="Mobile 1" value={rec.mobile_1} mono />
                      <InfoCard label="Mobile 2" value={rec.mobile_2} mono />
                      <InfoCard label="Mobile 3" value={rec.mobile_3} mono />
                      <div className="col-span-2 sm:col-span-3">
                        <InfoCard label="Email Address" value={rec.email_address} />
                      </div>
                    </div>
                  </div>

                  {/* 2. Property & Location Identifiers */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <MapPin className="w-4 h-4 text-purple-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Property & Location Identifiers
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <InfoCard label="Community" value={rec.community} />
                      <InfoCard label="Sub-Community" value={rec.sub_community} />
                      <InfoCard label="Building / Cluster" value={rec.building_cluster} />
                      <InfoCard label="Unit Number" value={rec.unit_number} mono accent />
                      <InfoCard label="Property Type" value={rec.property_type} />
                      <InfoCard label="Bedrooms" value={rec.bedroom} />
                      <InfoCard label="Size" value={rec.size ? `${rec.size} sqft` : null} mono />
                      <InfoCard label="Plot Reg. No" value={rec.plot_reg_no} mono />
                      <InfoCard label="Plot Number" value={rec.plot_number} mono />
                      <InfoCard label="DM No. (DMNO)" value={rec.dmno} mono />
                      <InfoCard label="DM Sub No. (DMsubno)" value={rec.dmsubno} mono />
                    </div>
                  </div>

                  {/* 3. Valuation & Project Specs */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Valuation & Development Specs
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="col-span-2 sm:col-span-3 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Procedure Value</span>
                        <span className="block text-2xl font-black font-mono text-emerald-800 dark:text-emerald-300 mt-0.5">
                          {rec.procedure_value ? `AED ${Number(rec.procedure_value).toLocaleString()}` : 'Unstated'}
                        </span>
                      </div>
                      <InfoCard label="Developer" value={rec.developer} />
                      <InfoCard label="Project" value={rec.project} />
                      <InfoCard label="Registration Date" value={rec.date ? new Date(rec.date).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: '2-digit' }) : null} />
                    </div>
                  </div>

                  {/* 4. Ingestion Lineage & Source Workbook */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Source Ingestion Lineage
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="col-span-2 sm:col-span-3">
                        <InfoCard label="Original Workbook File" value={rec.original_workbook} mono />
                      </div>
                      <InfoCard label="Sheet Name" value={rec.sheet_name} />
                      <InfoCard label="Row Index" value={rec.row_number ? `#${rec.row_number}` : null} mono />
                      <InfoCard label="Batch Number" value={data?.batch ? `#${data.batch.batch_number}` : null} mono />
                    </div>
                  </div>
                </div>
              )}

              {/* Property & Unit Info */}
              {activeTab === 'property' && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Location & Unit</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoCard label="Community" value={rec.community} />
                    <InfoCard label="Sub-Community" value={rec.sub_community} />
                    <InfoCard label="Building / Cluster" value={rec.building_cluster} />
                    <InfoCard label="Unit Number" value={rec.unit_number} mono accent />
                    <InfoCard label="Plot Reg. No" value={rec.plot_reg_no} mono />
                    <InfoCard label="Plot Number" value={rec.plot_number} mono />
                    <InfoCard label="DMNO" value={rec.dmno} mono />
                    <InfoCard label="DMsubno" value={rec.dmsubno} mono />
                  </div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-2">Property Details</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <InfoCard label="Property Type" value={rec.property_type} />
                    <InfoCard label="Bedroom" value={rec.bedroom} />
                    <InfoCard label="Size" value={rec.size ? `${rec.size} sqft` : null} />
                    <InfoCard label="Developer" value={rec.developer} />
                    <InfoCard label="Project" value={rec.project} />
                    <InfoCard label="Date" value={rec.date ? new Date(rec.date).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: '2-digit' }) : null} />
                  </div>
                </div>
              )}

              {/* Owner & Contact */}
              {activeTab === 'owner' && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Owner Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <InfoCard label="Full Name" value={rec.name || rec.customer_name} />
                    </div>
                    <InfoCard label="Nationality" value={rec.nationality} />
                    <InfoCard label="Type" value={rec.buyer_seller_type} />
                    <InfoCard label="PI Number" value={rec.pi_number} mono />
                  </div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-2">Contact Details</h3>
                  <div className="space-y-2">
                    {[rec.mobile_1, rec.mobile_2, rec.mobile_3].filter(Boolean).map((m, i) => (
                      <a key={i} href={`tel:${m}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                        <Phone className="w-4 h-4 text-sky-500 flex-shrink-0" />
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white flex-1">{m}</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-sky-500 transition-colors">Mobile {i + 1}</span>
                      </a>
                    ))}
                    {rec.email_address && (
                      <a href={`mailto:${rec.email_address}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <Mail className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white flex-1 truncate">{rec.email_address}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Financials */}
              {activeTab === 'financial' && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Valuation</h3>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/30 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-500 mb-1">Procedure Value</p>
                    <p className="text-4xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                      {rec.procedure_value
                        ? `AED ${Number(rec.procedure_value).toLocaleString()}`
                        : 'N/A'}
                    </p>
                    {rec.size && rec.procedure_value && (
                      <p className="text-sm text-emerald-600/70 dark:text-emerald-500 mt-2 font-medium">
                        ≈ AED {Math.round(Number(rec.procedure_value) / Number(rec.size)).toLocaleString()} / sqft
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoCard label="Developer" value={rec.developer} />
                    <InfoCard label="Project" value={rec.project} />
                    <InfoCard label="Transaction Date" value={rec.date ? new Date(rec.date).toLocaleDateString('en-AE') : null} />
                    <InfoCard label="Buyer / Seller" value={rec.buyer_seller_type} />
                    <InfoCard label="Property Size" value={rec.size ? `${rec.size} sqft` : null} />
                    <InfoCard label="Bedrooms" value={rec.bedroom} />
                  </div>
                </div>
              )}

              {/* Ingestion Lineage */}
              {activeTab === 'lineage' && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Source Workbook</h3>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Workbook</span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white break-all">{rec.original_workbook || '—'}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Sheet: <b className="text-slate-700 dark:text-slate-200">{rec.sheet_name || '—'}</b></span>
                      <span>Row: <b className="text-slate-700 dark:text-slate-200">#{rec.row_number || '—'}</b></span>
                    </div>
                    {data?.source_file && (
                      <button
                        onClick={() => { navigate(`/files/${data.source_file.id}`); onClose(); }}
                        className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        Inspect Source File <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Batch Lineage</h3>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Batch</span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        #{data?.batch?.batch_number} — {data?.batch?.batch_name || '—'}
                      </p>
                    </div>
                    {data?.batch && (
                      <button
                        onClick={() => { navigate(`/batches/${data.batch.id}`); onClose(); }}
                        className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        View Batch Details <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Raw JSON */}
              {activeTab === 'raw' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Raw Ingestion JSON</h3>
                    <button
                      onClick={copyJson}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy JSON'}
                    </button>
                  </div>
                  <pre className="bg-slate-950 text-emerald-400 font-mono text-[11px] p-4 rounded-xl overflow-x-auto border border-slate-800 max-h-[calc(100vh-320px)] leading-relaxed">
                    {JSON.stringify(rawObj, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Panel Footer ── */}
        {!loading && rec && (
          <footer className="flex-shrink-0 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-[#0D1117]">
            <span>Record ID: <b className="font-mono text-slate-600 dark:text-slate-300">#{rec.id}</b></span>
            <button
              onClick={goFullPage}
              className="flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Open full record page <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </footer>
        )}
      </aside>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.7; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>,
    document.body
  );
};

export default PropertyDeepDivePanel;
