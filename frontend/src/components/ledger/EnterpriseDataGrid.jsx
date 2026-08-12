import React, { useState } from 'react';
import { Table, ChevronRight, Eye } from 'lucide-react';
import HighlightText from '../ui/HighlightText';
import Badge from '../ui/Badge';
import SkeletonTable from '../ui/SkeletonTable';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';
import LedgerContextMenu from './LedgerContextMenu';

const DEFAULT_VISIBLE_COLUMNS = [
  'community',
  'name',
  'mobile_1',
  'pi_number',
  'building_cluster',
  'unit_number',
  'property_type',
];

const ALL_COLUMNS = [
  { id: 'community', label: 'Community', minWidth: '160px' },
  { id: 'name', label: 'Name / Owner Name', minWidth: '220px' },
  { id: 'mobile_1', label: 'Phone / Mobile', minWidth: '140px' },
  { id: 'pi_number', label: 'PID / PI Number', minWidth: '130px' },
  { id: 'building_cluster', label: 'Building / Cluster', minWidth: '180px' },
  { id: 'unit_number', label: 'Unit Number', minWidth: '110px' },
  { id: 'property_type', label: 'Property Type', minWidth: '130px' },
  { id: 'sub_community', label: 'Sub-Community', minWidth: '150px' },
  { id: 'size', label: 'Size (sq ft)', minWidth: '110px' },
  { id: 'plot_reg_no', label: 'Plot Reg No', minWidth: '130px' },
  { id: 'plot_number', label: 'Plot No.', minWidth: '110px' },
  { id: 'dmno', label: 'DMNO', minWidth: '110px' },
  { id: 'dmsubno', label: 'DMsubno', minWidth: '110px' },
  { id: 'bedroom', label: 'Bedrooms', minWidth: '95px' },
  { id: 'buyer_seller_type', label: 'Buyer/Seller Type', minWidth: '120px' },
  { id: 'mobile_2', label: 'Mobile 2', minWidth: '130px' },
  { id: 'mobile_3', label: 'Mobile 3', minWidth: '130px' },
  { id: 'email_address', label: 'Email', minWidth: '190px' },
  { id: 'nationality', label: 'Nationality', minWidth: '130px' },
  { id: 'procedure_value', label: 'Value (AED)', minWidth: '160px' },
  { id: 'developer', label: 'Developer', minWidth: '150px' },
  { id: 'project', label: 'Project', minWidth: '150px' },
];

const getInitials = (name) => {
  if (!name) return 'UN';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const EnterpriseDataGrid = ({
  records = [],
  loading = false,
  error = null,
  appliedSearch = '',
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
  density = 'comfortable',
  onSelectRecord = () => {},
  onRetry = () => {},
  onFilterCommunity = () => {}
}) => {
  const [contextMenu, setContextMenu] = useState(null);

  // Padding based on density
  const pyClass = density === 'compact' ? 'py-2.5' : density === 'spacious' ? 'py-4' : 'py-3.5';

  const handleContextMenu = (record, e) => {
    e.preventDefault();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      record
    });
  };

  const renderNull = () => <span className="text-slate-300 dark:text-slate-600">-</span>;

  if (loading) return <SkeletonTable rows={12} cols={8} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (records.length === 0) {
    return (
      <EmptyState
        icon={Table}
        title="No records match your search criteria"
        description="Try adjusting your search terms or clearing active filters."
      />
    );
  }

  // Active columns ordered by user selection or default catalog
  const orderedColumns = ALL_COLUMNS.filter(c => visibleColumns.includes(c.id));

  return (
    <div className="relative w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Scrollable Data Grid Container */}
      <div className="overflow-x-auto overflow-y-auto min-h-[380px] max-h-[650px] custom-scrollbar">
        <table className="w-full text-left text-xs whitespace-nowrap border-separate border-spacing-0">
          {/* Table Header */}
          <thead className="bg-slate-50/90 dark:bg-slate-800/90 sticky top-0 z-30 backdrop-blur-xs">
            <tr>
              {orderedColumns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  style={{ minWidth: col.minWidth }}
                  className={`px-4 ${pyClass} text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 ${
                    col.id === 'procedure_value' ? 'text-right pr-4' : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}

              <th scope="col" className={`px-4 ${pyClass} text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-right pr-4 min-w-[100px]`}>
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="font-medium text-slate-800 dark:text-slate-200">
            {records.map((rec, index) => {
              const rawOwnerName = rec.name || rec.customer_name;
              const ownerName = rawOwnerName ? rawOwnerName.trim() : 'Unspecified Owner';
              const initials = getInitials(ownerName);
              const val = rec.procedure_value ? Number(rec.procedure_value) : null;
              const sizeSqft = rec.size ? Math.round(Number(rec.size)) : null;
              const isEven = index % 2 === 0;

              return (
                <tr
                  key={rec.id || index}
                  onClick={() => onSelectRecord(rec.id)}
                  onContextMenu={(e) => handleContextMenu(rec, e)}
                  className={`cursor-pointer transition-colors group relative ${
                    isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-900/40'
                  } hover:bg-sky-50/70 dark:hover:bg-sky-950/40`}
                >
                  {orderedColumns.map((col) => {
                    const colId = col.id;

                    if (colId === 'community') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-semibold text-sky-700 dark:text-sky-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.community ? <HighlightText text={rec.community} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'name') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 min-w-[220px] max-w-[260px] truncate`}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-black flex items-center justify-center flex-shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <span className="truncate text-slate-900 dark:text-white font-bold">
                              <HighlightText text={ownerName} highlight={appliedSearch} />
                            </span>
                          </div>
                        </td>
                      );
                    }

                    if (colId === 'mobile_1') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-mono text-slate-800 dark:text-slate-200 font-semibold border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.mobile_1 ? (
                            <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
                              <HighlightText text={rec.mobile_1} highlight={appliedSearch} />
                            </span>
                          ) : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'pi_number') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-mono font-bold border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.pi_number ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 font-bold">
                              <HighlightText text={rec.pi_number} highlight={appliedSearch} />
                            </span>
                          ) : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'building_cluster') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 max-w-[200px] truncate`}>
                          {rec.building_cluster ? <HighlightText text={rec.building_cluster} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'unit_number') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-mono font-bold border-b border-slate-100 dark:border-slate-800/60 min-w-[110px]`}>
                          {rec.unit_number ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold font-mono">
                              <HighlightText text={rec.unit_number} highlight={appliedSearch} />
                            </span>
                          ) : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'property_type') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-bold border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.property_type ? (
                            <Badge status={rec.property_type} color="emerald" size="xs" />
                          ) : (
                            <Badge status="Apartment" color="sky" size="xs" />
                          )}
                        </td>
                      );
                    }

                    if (colId === 'sub_community') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.sub_community ? <HighlightText text={rec.sub_community} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'size') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-mono text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60`}>
                          {sizeSqft ? `${sizeSqft.toLocaleString()} sq ft` : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'plot_reg_no') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-mono text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.plot_reg_no ? <HighlightText text={rec.plot_reg_no} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'plot_number') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-mono text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.plot_number ? rec.plot_number : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'dmno') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.dmno ? <HighlightText text={rec.dmno} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'dmsubno') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.dmsubno ? rec.dmsubno : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'bedroom') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-bold text-center text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.bedroom ? rec.bedroom : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'buyer_seller_type') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} border-b border-slate-100 dark:border-slate-800/60`}>
                          <Badge status={rec.buyer_seller_type || 'Buyer'} size="xs" />
                        </td>
                      );
                    }

                    if (colId === 'mobile_2') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.mobile_2 ? rec.mobile_2 : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'mobile_3') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.mobile_3 ? rec.mobile_3 : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'email_address') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60 max-w-[180px] truncate`}>
                          {rec.email_address ? <HighlightText text={rec.email_address} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'nationality') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.nationality ? rec.nationality : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'procedure_value') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} text-right pr-4 font-extrabold font-mono text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 min-w-[150px]`}>
                          {val ? `AED ${val.toLocaleString()}` : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'developer') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} font-semibold text-purple-700 dark:text-purple-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.developer ? <HighlightText text={rec.developer} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'project') {
                      return (
                        <td key={colId} className={`px-4 ${pyClass} text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60 max-w-[150px] truncate`}>
                          {rec.project ? <HighlightText text={rec.project} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    return null;
                  })}

                  {/* Row Actions Column */}
                  <td className={`px-4 ${pyClass} text-right pr-4 border-b border-slate-100 dark:border-slate-800/60`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecord(rec.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800/80 transition-all shadow-2xs group-hover:bg-sky-500 group-hover:text-white group-hover:border-sky-500"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Enterprise Context Menu */}
      {contextMenu && (
        <LedgerContextMenu
          position={contextMenu.position}
          record={contextMenu.record}
          onClose={() => setContextMenu(null)}
          onViewProfile={onSelectRecord}
          onCopyDetails={(r) => navigator.clipboard.writeText(JSON.stringify(r, null, 2))}
          onFilterCommunity={onFilterCommunity}
        />
      )}
    </div>
  );
};

export { DEFAULT_VISIBLE_COLUMNS, ALL_COLUMNS };
export default EnterpriseDataGrid;

