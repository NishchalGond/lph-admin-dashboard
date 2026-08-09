import React, { useState, useEffect, useCallback } from 'react';
import { getBatches } from '../services/api';
import { Layers, ArrowRight } from 'lucide-react';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { Link } from 'react-router-dom';

const BatchSkeletonCard = () => (
  <div className="glass-panel p-5 animate-pulse space-y-4 rounded-2xl">
    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
      <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded" />
      <div className="h-5 w-20 bg-slate-200 dark:bg-white/10 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-100 dark:bg-white/5 rounded-xl">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-1">
          <div className="h-2.5 w-16 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="h-3 w-20 bg-slate-200 dark:bg-white/10 rounded" />
        </div>
      ))}
    </div>
    <div className="h-4 w-28 bg-slate-100 dark:bg-white/5 rounded ml-auto" />
  </div>
);

const BatchExplorer = () => {
  const [batches, setBatches]       = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const fetchBatchesList = useCallback(() => {
    setLoading(true);
    setError(null);
    getBatches({ page, page_size: 12 })
      .then((res) => {
        setBatches(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.total_pages);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load batch runs. Please check backend status.');
        setLoading(false);
      });
  }, [page]);

  useEffect(() => {
    fetchBatchesList();
  }, [fetchBatchesList]);

  return (
    <div className="p-6 space-y-6 page-enter">
      <PageHeader
        title="Batch Execution Explorer"
        subtitle={`Workflow batch execution management (60 Excel files per batch run). Total ${total.toLocaleString()} batches logged.`}
        badge={`${total} Batches`}
        badgeColor="indigo"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => <BatchSkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBatchesList} />
      ) : batches.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No batches found"
          description="No execution batches have been recorded yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch) => (
            <div key={batch.id} className="glass-panel p-5 space-y-4 glass-card-hover flex flex-col justify-between rounded-2xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
                      #{batch.batch_number}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                      Batch #{String(batch.batch_number).padStart(3, '0')}
                    </span>
                  </div>
                  <Badge status={batch.status} dot size="xs" />
                </div>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">{batch.batch_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Workbooks</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{batch.number_of_files} files</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Extracted Rows</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{batch.number_of_records?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Duration</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{batch.processing_time_seconds ? `${batch.processing_time_seconds}s` : '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Started</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{new Date(batch.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">Consolidated Batch</span>
                <Link
                  to={`/batches/${batch.id}`}
                  className="font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Overview &rarr;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && batches.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
      )}
    </div>
  );
};

export default BatchExplorer;
