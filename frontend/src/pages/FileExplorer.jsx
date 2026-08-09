import React, { useState, useEffect, useCallback } from 'react';
import { getFiles } from '../services/api';
import { FolderTree, Search } from 'lucide-react';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import SkeletonTable from '../components/ui/SkeletonTable';
import { Link } from 'react-router-dom';

const inputClass = "w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors";
const selectClass = "px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors";

const FileExplorer = () => {
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const [duplicateStatus, setDuplicateStatus] = useState('');

  const fetchFilesList = useCallback(() => {
    setLoading(true);
    setError(null);
    getFiles({
      page,
      page_size: 15,
      search: search || undefined,
      processing_status: processingStatus || undefined,
      duplicate_status: duplicateStatus || undefined
    })
      .then((res) => {
        setFiles(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.total_pages);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load source files. Please check backend connectivity.');
        setLoading(false);
      });
  }, [page, processingStatus, duplicateStatus]);

  useEffect(() => {
    fetchFilesList();
  }, [fetchFilesList]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFilesList();
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Source File Explorer"
        subtitle={`Browse, filter, and inspect every Excel file ingested across all workflow batches (${total.toLocaleString()} total files).`}
      />

      {/* Filter Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search filename or file code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search source files"
            className={inputClass}
          />
        </form>

        <label className="sr-only" htmlFor="processing-status-filter">Filter by processing status</label>
        <select
          id="processing-status-filter"
          value={processingStatus}
          onChange={(e) => { setProcessingStatus(e.target.value); setPage(1); }}
          aria-label="Filter by processing status"
          className={selectClass}
        >
          <option value="">All Processing Statuses</option>
          <option value="Success">Success</option>
          <option value="Warning">Warning</option>
          <option value="Failed">Failed</option>
        </select>

        <label className="sr-only" htmlFor="duplicate-status-filter">Filter by duplicate status</label>
        <select
          id="duplicate-status-filter"
          value={duplicateStatus}
          onChange={(e) => { setDuplicateStatus(e.target.value); setPage(1); }}
          aria-label="Filter by duplicate status"
          className={selectClass}
        >
          <option value="">All Duplicate Types</option>
          <option value="Unique">Unique</option>
          <option value="Duplicate Hash">Duplicate Hash</option>
          <option value="Duplicate Filename">Duplicate Filename</option>
        </select>
      </div>

      {/* File Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <SkeletonTable rows={10} cols={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchFilesList} />
        ) : files.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No files found"
            description={processingStatus || duplicateStatus || search
              ? 'No files match your current filters. Try adjusting your search criteria.'
              : 'No source files have been ingested yet.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" role="table">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold tracking-wider border-b border-slate-200 dark:border-white/5 sticky top-0">
                <tr>
                  <th scope="col" className="p-3.5 whitespace-nowrap">File Code</th>
                  <th scope="col" className="p-3.5">File Name</th>
                  <th scope="col" className="p-3.5">Directory</th>
                  <th scope="col" className="p-3.5">Size</th>
                  <th scope="col" className="p-3.5">Batch</th>
                  <th scope="col" className="p-3.5">Status</th>
                  <th scope="col" className="p-3.5">Duplicate</th>
                  <th scope="col" className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-xs font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                      {file.record_id}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-white max-w-[240px]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{file.file_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase flex-shrink-0">
                          {file.extension}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                      {file.original_directory}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
                      {(file.file_size_bytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 font-semibold text-xs whitespace-nowrap">
                      Batch #{file.batch_number}
                    </td>
                    <td className="p-3.5">
                      <Badge status={file.processing_status} dot size="xs" />
                    </td>
                    <td className="p-3.5">
                      <Badge status={file.duplicate_status} dot size="xs" />
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/files/${file.id}`}
                        className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && files.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
