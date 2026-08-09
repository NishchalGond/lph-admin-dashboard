import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { semanticSearch, globalSearch } from '../services/api';
import { Search, FileSpreadsheet, Database, Layers, ArrowRight, Building2, MapPin, Phone, Mail, User, Sparkles, CheckCircle2, ShieldCheck, Flame, Info } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import AISearchAssistant from '../components/ui/AISearchAssistant';
import PropertyDeepDivePanel from '../components/ui/PropertyDeepDivePanel';

const SearchSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-24 glass-panel skeleton-shimmer rounded-3xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-panel p-6 h-[500px] skeleton-shimmer rounded-3xl" />
      <div className="glass-panel p-6 h-[500px] skeleton-shimmer rounded-3xl" />
    </div>
  </div>
);

const MatchScoreBadge = ({ score }) => {
  let color = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  let label = 'Best Match';
  let icon = ShieldCheck;

  if (score < 80) {
    color = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    label = 'Partial Match';
    icon = Info;
  } else if (score < 95) {
    color = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    label = 'High Match';
    icon = CheckCircle2;
  }

  const IconComp = icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${color}`}>
      <IconComp className="w-3 h-3" />
      <span>{score}% {label}</span>
    </span>
  );
};

const GlobalSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [semanticResults, setSemanticResults] = useState(null);
  const [fileResults, setFileResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const handleSearchSubmit = (searchQuery) => {
    const q = searchQuery !== undefined ? searchQuery : query;
    if (q && q.trim()) {
      setSearchParams({ q: q.trim() });
    }
  };

  // 1. Debounce URL / search submit by ~300ms while user is typing
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed === queryParam) return;

    const timer = setTimeout(() => {
      setSearchParams({ q: trimmed }, { replace: true });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, queryParam, setSearchParams]);

  // 2. Execute API calls with AbortController cancellation for pending requests
  useEffect(() => {
    if (!queryParam || !queryParam.trim()) {
      setSemanticResults(null);
      setFileResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setQuery(queryParam);
    setLoading(true);
    setError(null);

    Promise.all([
      semanticSearch(queryParam, 1, 50),
      globalSearch(queryParam, 1)
    ])
      .then(([semRes, globRes]) => {
        if (controller.signal.aborted) return;
        setSemanticResults(semRes.data);
        setFileResults(globRes.data.files || []);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error(err);
        setError('Failed to perform AI semantic search. Please verify backend connection.');
        setLoading(false);
      });

    return () => controller.abort();
  }, [queryParam]);

  return (
    <div className="p-6 space-y-6 page-enter">
      <PageHeader
        title="AI Property Assistant Studio"
        subtitle="Natural language understanding across 23+ property fields, hidden metadata, dynamic JSON schemas, and imported workbooks."
        badge="NLU Semantic Engine"
        badgeColor="indigo"
      />

      {/* AI Prompt Assistant Input Bar */}
      <AISearchAssistant
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={handleSearchSubmit}
        intent={semanticResults?.intent}
        isSearching={loading}
      />

      {/* Zero query state */}
      {!queryParam && (
        <div className="glass-panel p-12 text-center space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 text-sky-500 flex items-center justify-center mx-auto border border-sky-500/30">
            <Sparkles className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Conversational Real Estate Database Search
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Type any natural prompt above. You can ask for owner names, unit numbers, towers, nationalities, or property types without selecting manual database filters.
          </p>
        </div>
      )}

      {loading && <SearchSkeleton />}

      {error && <ErrorState message={error} onRetry={() => setSearchParams({ q: query })} />}

      {semanticResults && !loading && !error && (
        <div className="space-y-6">
          {/* Metrics summary bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl glass-panel flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Semantic Matches</span>
                <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
                  {semanticResults.total.toLocaleString()}
                </span>
              </div>
              <Database className="w-6 h-6 text-sky-500 opacity-60" />
            </div>

            <div className="p-4 rounded-2xl glass-panel flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Matching Workbooks</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {fileResults.length.toLocaleString()}
                </span>
              </div>
              <FileSpreadsheet className="w-6 h-6 text-emerald-500 opacity-60" />
            </div>

            <div className="p-4 rounded-2xl glass-panel flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Parsed AI Entities</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {Object.values(semanticResults.intent).filter(Boolean).length}
                </span>
              </div>
              <Sparkles className="w-6 h-6 text-indigo-500 opacity-60" />
            </div>
          </div>

          {/* Main Results Studio Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main AI Ranked Property Records (Span 2) */}
            <div className="lg:col-span-2 glass-panel p-6 space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-500" />
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    AI Relevance Ranked Records
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-400">
                  Showing top {semanticResults.items.length} of {semanticResults.total}
                </span>
              </div>

              {semanticResults.items.length === 0 ? (
                <EmptyState
                  icon={Database}
                  title="No semantic property records match this prompt"
                  description="Try asking with different keywords or describing the community, unit number, or owner name."
                />
              ) : (
                <div className="space-y-4">
                  {semanticResults.items.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRecordId(rec.id)}
                      className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-sky-500/50 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer space-y-3 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                              {rec.name || rec.customer_name || 'Unnamed Owner'}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                              {rec.property_type || 'Residential'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-0.5 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{rec.community || 'Dubai'}</span>
                            {rec.building_cluster && <span>• {rec.building_cluster}</span>}
                          </p>
                        </div>
                        <MatchScoreBadge score={rec.match_score || 85} />
                      </div>

                      {/* Match Reasons Pill Strip */}
                      {rec.match_reasons && rec.match_reasons.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Match Rationale:</span>
                          {rec.match_reasons.map((r, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Unit Number</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{rec.unit_number || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Nationality</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{rec.nationality || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Developer</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">{rec.developer || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Value</span>
                          <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            {rec.procedure_value ? `AED ${Number(rec.procedure_value).toLocaleString()}` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Column: Matching Workbooks & Dynamic Suggestions */}
            <div className="space-y-6">
              {/* Dynamic Follow-up Suggestions */}
              {semanticResults.suggestions && semanticResults.suggestions.length > 0 && (
                <div className="glass-panel p-5 space-y-3 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Suggested Prompts</span>
                  </h4>
                  <div className="space-y-2">
                    {semanticResults.suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearchSubmit(sug)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-all flex items-center justify-between group"
                      >
                        <span className="truncate">{sug}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Excel Files */}
              <div className="glass-panel p-5 space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>Matching Excel Workbooks</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">{fileResults.length}</span>
                </div>

                {fileResults.length === 0 ? (
                  <EmptyState icon={FileSpreadsheet} title="No workbooks found" description="No files match this query." />
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {fileResults.map((file) => (
                      <div key={file.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">{file.file_name}</h4>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] uppercase">
                            {file.extension}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{file.original_directory}</p>
                        <div className="pt-1.5 flex justify-between items-center text-[11px]">
                          <span className="text-slate-400 font-mono">Batch #{file.batch_number}</span>
                          <Link to={`/files/${file.id}`} className="text-sky-600 dark:text-sky-400 font-bold hover:underline">
                            View File &rarr;
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Property Deep Dive Drawer */}
      {selectedRecordId && (
        <PropertyDeepDivePanel
          recordId={selectedRecordId}
          onClose={() => setSelectedRecordId(null)}
        />
      )}
    </div>
  );
};

export default GlobalSearch;
