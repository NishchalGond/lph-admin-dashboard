import React, { useState } from 'react';
import { Table, ChevronRight, Eye } from 'lucide-react';
import HighlightText from '../ui/HighlightText';
import Badge from '../ui/Badge';
import SkeletonTable from '../ui/SkeletonTable';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';
import LedgerContextMenu from './LedgerContextMenu';

const ALL_COLUMNS = [
  { id: 'name', label: 'Owner Name', pinned: true, minWidth: '220px' },
  { id: 'unit_number', label: 'Unit #', pinned: true, minWidth: '110px' },
  { id: 'community', label: 'Community', minWidth: '160px' },
  { id: 'sub_community', label: 'Sub-Community', minWidth: '150px' },
  { id: 'building_cluster', label: 'Building / Cluster', minWidth: '180px' },
  { id: 'size', label: 'Size (sq ft)', minWidth: '110px' },
  { id: 'plot_reg_no', label: 'Plot Reg No', minWidth: '130px' },
  { id: 'plot_number', label: 'Plot No.', minWidth: '110px' },
  { id: 'dmno', label: 'DMNO', minWidth: '110px' },
  { id: 'dmsubno', label: 'DMsubno', minWidth: '110px' },
  { id: 'bedroom', label: 'Bedrooms', minWidth: '95px' },
  { id: 'buyer_seller_type', label: 'Type', minWidth: '110px' },
  { id: 'mobile_1', label: 'Mobile 1', minWidth: '140px' },
  { id: 'mobile_2', label: 'Mobile 2', minWidth: '130px' },
  { id: 'mobile_3', label: 'Mobile 3', minWidth: '130px' },
  { id: 'email_address', label: 'Email', minWidth: '190px' },
  { id: 'pi_number', label: 'PI #', minWidth: '130px' },
  { id: 'nationality', label: 'Nationality', minWidth: '130px' },
  { id: 'property_type', label: 'Prop Type', minWidth: '130px' },
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
  visibleColumns = ALL_COLUMNS.map(c => c.id),
  density = 'comfortable',
  onSelectRecord = () => {},
  onRetry = () => {},
  onFilterCommunity = () => {}
}) => {
  const [contextMenu, setContextMenu] = useState(null);

  // Padding based on density
  const pyClass = density === 'compact' ? 'py-2' : density === 'spacious' ? 'py-4' : 'py-3';

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

  return (
    <div className="relative w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Scrollable Data Grid Container */}
      <div className="overflow-x-auto overflow-y-auto min-h-[380px] max-h-[600px] custom-scrollbar">
        <table className="w-full text-left text-xs whitespace-nowrap border-separate border-spacing-0">
          {/* Table Header */}
          <thead className="bg-slate-50 dark:bg-slate-800/90 sticky top-0 z-30">
            <tr>
              {/* Sticky Owner Name Header */}
              {visibleColumns.includes('name') && (
                <th scope="col" className={`px-4 ${pyClass} text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky top-0 left-0 z-40 bg-slate-50 dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 min-w-[220px]`}>
                  Owner Name
                </th>
              )}

              {/* Sticky Unit Header */}
              {visibleColumns.includes('unit_number') && (
                <th scope="col" className={`px-3 ${pyClass} text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky top-0 left-[220px] z-40 bg-slate-50 dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 min-w-[110px]`}>
                  Unit #
                </th>
              )}

              {/* Dynamic Columns Header */}
              {ALL_COLUMNS.filter(c => !c.pinned && visibleColumns.includes(c.id)).map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={`px-3.5 ${pyClass} text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 min-w-[130px] ${
                    col.id === 'procedure_value' ? 'text-right pr-4' : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}

              <th scope="col" className={`px-3.5 ${pyClass} text-[11px] font-bold uppercase tracking-wider text-slate-400 sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-right pr-4`}>
                Action
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
                  } hover:bg-sky-50/70 dark:hover:bg-sky-950/30`}
                >
                  {/* Sticky Owner Name Cell */}
                  {visibleColumns.includes('name') && (
                    <td className={`px-4 ${pyClass} font-bold text-slate-900 dark:text-white sticky left-0 z-20 ${
                      isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900'
                    } group-hover:bg-sky-50/90 dark:group-hover:bg-sky-950/50 border-b border-r border-slate-200/70 dark:border-slate-800 transition-colors min-w-[220px] max-w-[240px] truncate`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-black flex items-center justify-center flex-shrink-0 shadow-xs">
                          {initials}
                        </div>
                        <span className="truncate text-slate-900 dark:text-white font-bold">
                          <HighlightText text={ownerName} highlight={appliedSearch} />
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Sticky Unit # Cell */}
                  {visibleColumns.includes('unit_number') && (
                    <td className={`px-3 ${pyClass} font-mono font-bold sticky left-[220px] z-20 ${
                      isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900'
                    } group-hover:bg-sky-50/90 dark:group-hover:bg-sky-950/50 border-b border-r border-slate-200/70 dark:border-slate-800 transition-colors min-w-[110px]`}>
                      {rec.unit_number ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold font-mono">
                          <HighlightText text={rec.unit_number} highlight={appliedSearch} />
                        </span>
                      ) : renderNull()}
                    </td>
                  )}

                  {/* Dynamic Columns Cells */}
                  {visibleColumns.includes('community') && (
                    <td className={`px-3.5 ${pyClass} font-semibold text-sky-700 dark:text-sky-400 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.community ? <HighlightText text={rec.community} highlight={appliedSearch} /> : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('sub_community') && (
                    <td className={`px-3.5 ${pyClass} text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.sub_community ? <HighlightText text={rec.sub_community} highlight={appliedSearch} /> : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('building_cluster') && (
                    <td className={`px-3.5 ${pyClass} font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 max-w-[180px] truncate`}>
                      {rec.building_cluster ? <HighlightText text={rec.building_cluster} highlight={appliedSearch} /> : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('size') && (
                    <td className={`px-3.5 ${pyClass} font-mono text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60`}>
                      {sizeSqft ? `${sizeSqft.toLocaleString()} sq ft` : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('plot_reg_no') && (
                    <td className={`px-3.5 ${pyClass} font-mono text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.plot_reg_no ? <HighlightText text={rec.plot_reg_no} highlight={appliedSearch} /> : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('plot_number') && (
                    <td className={`px-3.5 ${pyClass} font-mono text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.plot_number ? rec.plot_number : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('dmno') && (
                    <td className={`px-3.5 ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.dmno ? <HighlightText text={rec.dmno} highlight={appliedSearch} /> : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('dmsubno') && (
                    <td className={`px-3.5 ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.dmsubno ? rec.dmsubno : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('bedroom') && (
                    <td className={`px-3.5 ${pyClass} font-bold text-center text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.bedroom ? rec.bedroom : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('buyer_seller_type') && (
                    <td className={`px-3.5 ${pyClass} border-b border-slate-100 dark:border-slate-800/60`}>
                      <Badge status={rec.buyer_seller_type || 'Buyer'} size="xs" />
                    </td>
                  )}

                  {visibleColumns.includes('mobile_1') && (
                    <td className={`px-3.5 ${pyClass} font-mono text-slate-800 dark:text-slate-200 font-semibold border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.mobile_1 ? <HighlightText text={rec.mobile_1} highlight={appliedSearch} /> : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('mobile_2') && (
                    <td className={`px-3.5 ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.mobile_2 ? rec.mobile_2 : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('mobile_3') && (
                    <td className={`px-3.5 ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.mobile_3 ? rec.mobile_3 : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('email_address') && (
                    <td className={`px-3.5 ${pyClass} text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60 max-w-[180px] truncate`}>
                      {rec.email_address ? <HighlightText text={rec.email_address} highlight={appliedSearch} /> : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('pi_number') && (
                    <td className={`px-3.5 ${pyClass} font-mono font-bold text-amber-700 dark:text-amber-400 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.pi_number ? <HighlightText text={rec.pi_number} highlight={appliedSearch} /> : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('nationality') && (
                    <td className={`px-3.5 ${pyClass} font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.nationality ? rec.nationality : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('property_type') && (
                    <td className={`px-3.5 ${pyClass} font-bold text-emerald-700 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.property_type ? rec.property_type : 'Apartment'}
                    </td>
                  )}

                  {visibleColumns.includes('procedure_value') && (
                    <td className={`px-3.5 ${pyClass} text-right pr-4 font-extrabold font-mono text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 min-w-[150px]`}>
                      {val ? `AED ${val.toLocaleString()}` : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('developer') && (
                    <td className={`px-3.5 ${pyClass} font-semibold text-purple-700 dark:text-purple-400 border-b border-slate-100 dark:border-slate-800/60`}>
                      {rec.developer ? <HighlightText text={rec.developer} highlight={appliedSearch} /> : renderNull()}
                    </td>
                  )}

                  {visibleColumns.includes('project') && (
                    <td className={`px-3.5 ${pyClass} text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60 max-w-[150px] truncate`}>
                      {rec.project ? <HighlightText text={rec.project} highlight={appliedSearch} /> : renderNull()}
                    </td>
                  )}

                  {/* Row Action Arrow */}
                  <td className={`px-3.5 ${pyClass} text-right pr-4 border-b border-slate-100 dark:border-slate-800/60`}>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-100/60 dark:group-hover:bg-sky-900/40 transition-all">
                      View <ChevronRight className="w-3.5 h-3.5 inline" />
                    </span>
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

export { ALL_COLUMNS };
export default EnterpriseDataGrid;
