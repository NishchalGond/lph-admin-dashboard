import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFileDetails } from '../services/api';
import { FileSpreadsheet, ArrowLeft, HardDrive, Layers, Hash, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import ErrorState from '../components/ui/ErrorState';

const FileDetailsSkeleton = () => (
  <div className="p-6 space-y-6 max-w-6xl animate-pulse">
    <div className="h-4 w-40 bg-slate-200 dark:bg-white/10 rounded" />
    <div className="glass-panel p-6 space-y-6 skeleton-shimmer rounded-2xl h-80" />
  </div>
);

const FileDetails = () => {
  const { fileId } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchDetails = () => {
    setLoading(true);
    setError(null);
    getFileDetails(fileId)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load file details.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetails();
  }, [fileId]);

  if (loading) return <FileDetailsSkeleton />;
  if (error)   return <ErrorState message={error} onRetry={fetchDetails} />;

  const file = data.file;

  return (
    <div className="p-6 space-y-6 max-w-6xl page-enter">
      <Link
        to="/files"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to File Explorer</span>
      </Link>

      <div className="glass-panel p-6 space-y-6 rounded-2xl">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{file.file_name}</h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono uppercase">
                  {file.extension}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                {file.record_id} • {file.original_directory}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge status={file.processing_status} dot size="xs" />
            <Badge status={file.duplicate_status} size="xs" />
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 font-medium block">File Size</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">{(file.file_size_bytes / 1024).toFixed(1)} KB</span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 font-medium block">Batch Lineage</span>
            <span className="font-bold text-sky-600 dark:text-sky-400 font-mono text-sm">Batch #{file.batch_number}</span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 font-medium block">Duplicate Type</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{file.duplicate_status}</span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 font-medium block">Last Modified</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{new Date(file.last_modified).toLocaleDateString()}</span>
          </div>
        </div>

        {/* SHA-256 Fingerprint */}
        <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 space-y-1 border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">SHA-256 Cryptographic Hash</span>
          <p className="break-all text-sky-400 font-bold">{file.file_hash}</p>
        </div>

        {/* Extracted Sample Rows */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Extracted Sample Rows ({data.records_sample.length} rows)</h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th scope="col" className="p-3">Customer Name</th>
                  <th scope="col" className="p-3">Community</th>
                  <th scope="col" className="p-3">Unit Number</th>
                  <th scope="col" className="p-3">Developer</th>
                  <th scope="col" className="p-3">Row #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {data.records_sample.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{r.name || r.customer_name}</td>
                    <td className="p-3 font-semibold text-sky-600 dark:text-sky-400">{r.community || '—'}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{r.unit_number || '—'}</td>
                    <td className="p-3 text-purple-600 dark:text-purple-400 font-semibold">{r.developer || '—'}</td>
                    <td className="p-3 font-mono text-slate-400">Row #{r.row_number}</td>
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

export default FileDetails;
