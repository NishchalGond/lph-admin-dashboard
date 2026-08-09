import React, { useState, useEffect, useCallback } from 'react';
import { getDuplicates } from '../services/api';
import { Copy, AlertCircle } from 'lucide-react';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { Link } from 'react-router-dom';

const DuplicateSkeletonCard = () => (
  <div className="glass-panel p-5 animate-pulse space-y-4">
    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="space-y-1.5">
          <div className="h-3 w-32 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="h-2.5 w-48 bg-slate-100 dark:bg-white/5 rounded" />
        </div>
      </div>
      <div className="h-2.5 w-28 bg-slate-100 dark:bg-white/5 rounded" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[0, 1].map((i) => (
        <div key={i} className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 space-y-2">
          <div className="h-2.5 w-28 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="h-3 w-48 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="h-2.5 w-40 bg-slate-100 dark:bg-white/5 rounded" />
          <div className="h-2.5 w-36 bg-slate-100 dark:bg-white/5 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const DuplicateCenter = () => {
  const [duplicates, setDuplicates] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDuplicates = useCallback(() => {
    setLoading(true);
    setError(null);
    getDuplicates({ page, page_size: 10 })
      .then((res) => {
        setDuplicates(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.total_pages);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load duplicate records. Please check backend connectivity.');
        setLoading(false);
      });
  }, [page]);

  useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Duplicate Records Center"
        subtitle={`Dedicated hub for analyzing duplicate source files detected by SHA-256 hash matching, filename matching, and size comparison. ${total > 0 ? `(${total.toLocaleString()} duplicates flagged)` : ''}`}
        badge={total > 0 ? `${total} Flagged` : undefined}
        badgeColor="amber"
      />

      {/* Safety notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 dark:bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong className="font-bold">Workflow Guard:</strong> All duplicate files are isolated in consolidated reports.
          Original records remain fully traceable. Duplicates are flagged for review — never auto-deleted.
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <DuplicateSkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDuplicates} />
      ) : duplicates.length === 0 ? (
        <EmptyState
          icon={Copy}
          title="No duplicates detected"
          description="The system has not flagged any duplicate source files. This means all ingested files are unique."
        />
      ) : (
        <div className="space-y-4">
          {duplicates.map((dup) => (
            <div key={dup.id} className="glass-panel p-5 space-y-4 glass-card-hover">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/20">
                    #{dup.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{dup.duplicate_type}</h4>
                      <Badge status={dup.duplicate_type === 'Hash Match' ? 'Duplicate Hash' : 'Duplicate Filename'} dot size="xs" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Method: <span className="font-medium">{dup.detection_method}</span>
                      {' '}· Similarity: <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{(dup.similarity_score * 100).toFixed(0)}%</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  Detected: {new Date(dup.created_at).toLocaleString()}
                </span>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
                    ✓ Master Original File
                  </span>
                  {dup.original_file ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{dup.original_file.file_name}</p>
                      <p className="text-xs text-slate-500 truncate">Path: {dup.original_file.original_directory}</p>
                      <p className="text-xs font-mono text-slate-400">Hash: {dup.original_file.file_hash?.slice(0, 16)}…</p>
                      <div className="pt-1">
                        <Link
                          to={`/files/${dup.original_file.id}`}
                          className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                        >
                          Inspect Master File →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">File record missing</p>
                  )}
                </div>

                {/* Duplicate */}
                <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-2">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
                    ⚠ Duplicate Flagged File
                  </span>
                  {dup.duplicate_file ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{dup.duplicate_file.file_name}</p>
                      <p className="text-xs text-slate-500 truncate">Path: {dup.duplicate_file.original_directory}</p>
                      <p className="text-xs font-mono text-slate-400">Hash: {dup.duplicate_file.file_hash?.slice(0, 16)}…</p>
                      <div className="pt-1">
                        <Link
                          to={`/files/${dup.duplicate_file.id}`}
                          className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                        >
                          Inspect Duplicate →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">File record missing</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && duplicates.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
      )}
    </div>
  );
};

export default DuplicateCenter;
