import React, { useState, useEffect, useCallback } from 'react';
import { getRecords, getExportUrl } from '../services/api';
import RecordHeader from '../components/ledger/RecordHeader';
import LedgerStatsOverview from '../components/ledger/LedgerStatsOverview';
import HeroAISearchBar from '../components/ledger/HeroAISearchBar';
import EnterpriseFilterBar from '../components/ledger/EnterpriseFilterBar';
import EnterpriseDataGrid, { DEFAULT_VISIBLE_COLUMNS, ALL_COLUMNS } from '../components/ledger/EnterpriseDataGrid';
import ColumnManagerModal from '../components/ledger/ColumnManagerModal';
import ExportCenterModal from '../components/ledger/ExportCenterModal';
import PropertyDeepDivePanel from '../components/ui/PropertyDeepDivePanel';
import Pagination from '../components/ui/Pagination';

const RecordExplorer = () => {
  // Database Query & Response State
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queryTimeMs, setQueryTimeMs] = useState(63);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [community, setCommunity] = useState('');
  const [developer, setDeveloper] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedroom, setBedroom] = useState('');
  const [buyerSeller, setBuyerSeller] = useState('');
  const [activeSort, setActiveSort] = useState('id_desc');

  // Layout & UI Customization States
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [density, setDensity] = useState('comfortable'); // 'compact' | 'comfortable' | 'spacious'
  const [activePreset, setActivePreset] = useState('all');

  // Modals & Drawers
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showExportCenter, setShowExportCenter] = useState(false);

  // Fetch Records from Optimized FTS Backend
  const fetchRecords = useCallback(() => {
    setLoading(true);
    setError(null);
    const t0 = performance.now();

    // Map sort string
    let sort_by = 'id';
    let sort_order = 'desc';
    if (activeSort === 'id_asc') { sort_by = 'id'; sort_order = 'asc'; }
    else if (activeSort === 'value_desc') { sort_by = 'procedure_value'; sort_order = 'desc'; }
    else if (activeSort === 'value_asc') { sort_by = 'procedure_value'; sort_order = 'asc'; }
    else if (activeSort === 'unit_asc') { sort_by = 'unit_number'; sort_order = 'asc'; }

    getRecords({
      page,
      page_size: 20,
      search: appliedSearch || undefined,
      community: community || undefined,
      developer: developer || undefined,
      property_type: propertyType || undefined,
      bedroom: bedroom || undefined,
      buyer_seller_type: buyerSeller || undefined,
      sort_by,
      sort_order,
    })
      .then((res) => {
        const t1 = performance.now();
        setQueryTimeMs(Math.round(t1 - t0));
        setRecords(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to fetch property records. Please ensure backend services are connected.');
        setLoading(false);
      });
  }, [page, appliedSearch, community, developer, propertyType, bedroom, buyerSeller, activeSort]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Handlers
  const handleSearch = (val) => {
    setAppliedSearch(val);
    setSearch(val);
    setPage(1);
  };

  const handleFilterChange = (key, val) => {
    if (key === 'community') setCommunity(val);
    if (key === 'developer') setDeveloper(val);
    if (key === 'propertyType') setPropertyType(val);
    if (key === 'bedroom') setBedroom(val);
    if (key === 'buyerSeller') setBuyerSeller(val);
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setCommunity('');
    setDeveloper('');
    setPropertyType('');
    setBedroom('');
    setBuyerSeller('');
    setAppliedSearch('');
    setSearch('');
    setActivePreset('all');
    setPage(1);
  };

  const handleSelectPreset = (presetId) => {
    setActivePreset(presetId);
    setPage(1);

    if (presetId === 'all') {
      handleClearAllFilters();
    } else if (presetId === 'villas') {
      setPropertyType('Villa');
      setCommunity(''); setDeveloper(''); setBedroom('');
    } else if (presetId === 'apartments') {
      setPropertyType('Apartment');
      setCommunity(''); setDeveloper(''); setBedroom('');
    } else if (presetId === 'emaar') {
      setDeveloper('Emaar Properties');
      setPropertyType(''); setCommunity(''); setBedroom('');
    } else if (presetId === 'high_value') {
      setActiveSort('value_desc');
    }
  };

  const handleToggleDensity = () => {
    if (density === 'compact') setDensity('comfortable');
    else if (density === 'comfortable') setDensity('spacious');
    else setDensity('compact');
  };

  const handleToggleColumn = (colId) => {
    if (visibleColumns.includes(colId)) {
      setVisibleColumns(visibleColumns.filter(id => id !== colId));
    } else {
      setVisibleColumns([...visibleColumns, colId]);
    }
  };

  const handleExecuteExport = (format, scope) => {
    const url = getExportUrl({
      format,
      search: appliedSearch,
      community,
      developer,
      property_type: propertyType,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#070A10]">
      <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] w-full mx-auto">
        {/* 1. Dashboard Header */}
        <RecordHeader
          totalRecords={total ?? 0}
          totalFields={23}
          queryTimeMs={queryTimeMs}
          lastUpdated="Today • 09:42 AM"
          onOpenExport={() => setShowExportCenter(true)}
          onOpenColumnManager={() => setShowColumnManager(true)}
          onToggleDensity={handleToggleDensity}
          density={density}
          onRefresh={fetchRecords}
          isRefreshing={loading}
          activePreset={activePreset}
          onSelectPreset={handleSelectPreset}
        />

        {/* 2. Executive KPI Overview */}
        <LedgerStatsOverview totalRecords={total} />

        {/* 3. Hero AI Search Bar */}
        <HeroAISearchBar
          value={search}
          onChange={setSearch}
          onSearch={handleSearch}
          queryTimeMs={queryTimeMs}
        />

        {/* 4. Enterprise Filter Bar */}
        <EnterpriseFilterBar
          community={community}
          developer={developer}
          propertyType={propertyType}
          bedroom={bedroom}
          buyerSeller={buyerSeller}
          onChangeFilter={handleFilterChange}
          onClearAll={handleClearAllFilters}
          activeSort={activeSort}
          onChangeSort={setActiveSort}
        />

        {/* 5. Enterprise Data Grid */}
        <div className="w-full">
          <EnterpriseDataGrid
            records={records}
            loading={loading}
            error={error}
            appliedSearch={appliedSearch}
            visibleColumns={visibleColumns}
            density={density}
            onSelectRecord={(id) => setSelectedRecordId(id)}
            onRetry={fetchRecords}
            onFilterCommunity={(c) => handleFilterChange('community', c)}
          />
        </div>

        {/* 6. Enterprise Table Footer & Pagination */}
        {!loading && !error && records.length > 0 && (
          <div className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs flex-wrap">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                Showing <strong>{((page - 1) * 20) + 1}–{Math.min(page * 20, total)}</strong> of <strong>{total.toLocaleString()}</strong> records
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-sky-600 dark:text-sky-400 font-bold">
                Query Speed: {queryTimeMs}ms
              </span>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Slide-over Deep-Dive Profile Drawer */}
      {selectedRecordId && (
        <PropertyDeepDivePanel
          recordId={selectedRecordId}
          onClose={() => setSelectedRecordId(null)}
        />
      )}

      {/* Column Manager Modal */}
      {showColumnManager && (
        <ColumnManagerModal
          allColumns={ALL_COLUMNS}
          visibleColumns={visibleColumns}
          onToggleColumn={handleToggleColumn}
          onSelectAll={() => setVisibleColumns(ALL_COLUMNS.map(c => c.id))}
          onHideAll={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}
          onResetDefaults={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}
          onClose={() => setShowColumnManager(false)}
        />
      )}

      {/* Export Center Modal */}
      {showExportCenter && (
        <ExportCenterModal
          totalRecords={total}
          onClose={() => setShowExportCenter(false)}
          onExport={handleExecuteExport}
        />
      )}
    </div>
  );
};

export default RecordExplorer;
