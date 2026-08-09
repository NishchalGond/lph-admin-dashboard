import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBatchDetails } from '../services/api';
import { Layers, ArrowLeft, FileSpreadsheet, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import ErrorState from '../components/ui/ErrorState';

const BatchDetailsSkeleton = () => (
  <div className="p-6 space-y-6 max-w-6xl animate-pulse">
    <div className="h-4 w-40 bg-slate-200 dark:bg-white/10 rounded" />
    <div className="glass-panel p-6 space-y-6 skeleton-shimmer rounded-2xl h-80" />
  </div>
);

const BatchDetails = () => {
  const { batchId } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchDetails = () => {
    setLoading(true);
    setError(null);
    getBatchDetails(batchId)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to retrieve batch details.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetails();
  }, [batchId]);

  if (loading) return <BatchDetailsSkeleton />;
  if (error)   return <ErrorState message={error} onRetry={fetchDetails} />;

  const batch = data.batch;

  return (
    <div className="p-6 space-y-6 max-w-6xl page-enter">
      <Link
        to="/batches"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Batch Explorer</span>
      </Link>

      <div className="glass-panel p-6 space-y-6 rounded-2xl">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Batch #{String(batch.batch_number).padStart(3, '0')}
              </h1>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{batch.batch_name}</p>
            </div>
          </div>
          <Badge status={batch.status} dot size="xs" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 font-medium block">Workbooks Ingested</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">{data.files_count} files</span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 font-medium block">Extracted Rows</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">{data.records_count?.toLocaleString()}</span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 font-medium block">Processing Time</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">{batch.processing_time_seconds ? `${batch.processing_time_seconds}s` : '—'}</span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 font-medium block">Failed Files</span>
            <span className="font-bold text-rose-500 font-mono text-sm">{data.failed_files_count || 0}</span>
          </div>
        </div>

        {/* Ingested Workbooks */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Ingested Source Files ({data.files.length})</h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th scope="col" className="p-3">File Code</th>
                  <th scope="col" className="p-3">File Name</th>
                  <th scope="col" className="p-3">Directory Folder</th>
                  <th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3">Duplicate</th>
                  <th scope="col" className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {data.files.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-semibold text-sky-600 dark:text-sky-400">{f.record_id}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{f.file_name}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{f.original_directory}</td>
                    <td className="p-3">
                      <Badge status={f.processing_status} dot size="xs" />
                    </td>
                    <td className="p-3">
                      <Badge status={f.duplicate_status} size="xs" />
                    </td>
                    <td className="p-3 text-right">
                      <Link to={`/files/${f.id}`} className="text-sky-600 dark:text-sky-400 font-bold hover:underline">
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
    </div>
  );
};

export default BatchDetails;
