import React, { useState } from 'react';
import { Table, ChevronRight, Eye, Phone, MapPin, Mail } from 'lucide-react';
import HighlightText from '../ui/HighlightText';
import Badge from '../ui/Badge';
import SkeletonTable from '../ui/SkeletonTable';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';
import LedgerContextMenu from './LedgerContextMenu';

const DEFAULT_VISIBLE_COLUMNS = [
  'name',
  'email_address',
  'property_address',
  'city',
  'mobile_1',
  'buyer_seller_type',
];

const ALL_COLUMNS = [
  { id: 'name', label: 'Full Name', minWidth: '240px' },
  { id: 'email_address', label: 'Email', minWidth: '200px' },
  { id: 'property_address', label: 'Property Address', minWidth: '280px' },
  { id: 'city', label: 'City', minWidth: '130px' },
  { id: 'mobile_1', label: 'Mobile', minWidth: '160px' },
  { id: 'buyer_seller_type', label: 'Customer Type', minWidth: '140px' },
  { id: 'community', label: 'Community', minWidth: '220px' },
  { id: 'sub_community', label: 'Sub-Community', minWidth: '160px' },
  { id: 'building_cluster', label: 'Building / Cluster', minWidth: '180px' },
  { id: 'unit_number', label: 'Unit Number', minWidth: '120px' },
  { id: 'property_type', label: 'Property Type', minWidth: '130px' },
  { id: 'size', label: 'Size (sq ft)', minWidth: '120px' },
  { id: 'plot_reg_no', label: 'Plot Reg No', minWidth: '130px' },
  { id: 'plot_number', label: 'Plot No.', minWidth: '110px' },
  { id: 'dmno', label: 'DMNO', minWidth: '110px' },
  { id: 'dmsubno', label: 'DMsubno', minWidth: '110px' },
  { id: 'bedroom', label: 'Bedrooms', minWidth: '95px' },
  { id: 'mobile_2', label: 'Mobile 2', minWidth: '145px' },
  { id: 'mobile_3', label: 'Mobile 3', minWidth: '145px' },
  { id: 'pi_number', label: 'PID / PI Number', minWidth: '135px' },
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

const formatPhoneNumber = (phoneStr) => {
  if (!phoneStr) return null;
  let clean = String(phoneStr).trim();
  if (!clean) return null;

  if (clean.includes('|')) {
    const parts = clean.split('|');
    if (parts.length === 2) {
      const code = parts[0].trim();
      const rest = parts[1].trim();
      clean = `+${code} ${rest}`;
    } else {
      clean = clean.replace(/\|/g, ' ');
    }
  } else if (clean.startsWith('971') && clean.length >= 10 && !clean.startsWith('+')) {
    clean = `+${clean}`;
  }

  return clean;
};

const formatPropertyAddress = (rec) => {
  if (!rec) return null;
  
  const addr1 = rec.address_1 ? String(rec.address_1).trim() : null;
  const addr2 = rec.address_2 ? String(rec.address_2).trim() : null;

  if (addr1 && addr2) return `${addr1}, ${addr2}`;
  if (addr1) return addr1;
  if (addr2) return addr2;

  // Fallback: Combine unit, building, sub-community, community
  const locParts = [
    rec.unit_number ? `Apt ${rec.unit_number}` : null,
    rec.building_cluster,
    rec.sub_community,
    rec.community
  ].filter(Boolean);

  if (locParts.length > 0) return locParts.join(', ');

  return null;
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

  const renderNull = () => <span className="text-slate-300 dark:text-slate-600 font-normal">—</span>;

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
      <div className="overflow-x-auto overflow-y-auto min-h-[380px] max-h-[680px] custom-scrollbar">
        <table className="w-full text-left text-xs whitespace-nowrap border-separate border-spacing-0">
          {/* Table Header */}
          <thead className="bg-slate-50/95 dark:bg-slate-800/95 sticky top-0 z-30 backdrop-blur-xs">
            <tr>
              {orderedColumns.map((col, idx) => (
                <th
                  key={col.id}
                  scope="col"
                  style={{ minWidth: col.minWidth }}
                  className={`py-3.5 ${idx === 0 ? 'pl-6 sm:pl-8 pr-4' : 'px-4'} text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 ${
                    col.id === 'procedure_value' ? 'text-right pr-4' : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="font-medium text-slate-800 dark:text-slate-200">
            {records.map((rec, index) => {
              const rawOwnerName = rec.name || rec.customer_name || rec.full_name;
              const ownerName = rawOwnerName ? rawOwnerName.trim() : 'Unspecified Owner';
              const initials = getInitials(ownerName);
              const val = rec.procedure_value ? Number(rec.procedure_value) : null;
              const sizeSqft = rec.size ? Math.round(Number(rec.size)) : null;
              const isEven = index % 2 === 0;

              const primaryMobile = formatPhoneNumber(rec.mobile_1 || rec.mobile_2 || rec.mobile_3);
              const propertyAddress = formatPropertyAddress(rec);
              const cityName = rec.city || rec.region || 'Dubai';
              const customerType = rec.buyer_seller_type || rec.customer_type || rec.status || 'Owner';

              return (
                <tr
                  key={rec.id || index}
                  onClick={() => onSelectRecord(rec.id)}
                  onContextMenu={(e) => handleContextMenu(rec, e)}
                  className={`cursor-pointer transition-colors group relative ${
                    isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-900/40'
                  } hover:bg-sky-50/70 dark:hover:bg-sky-950/40`}
                >
                  {orderedColumns.map((col, idx) => {
                    const colId = col.id;
                    const isFirst = idx === 0;
                    const cellPadding = isFirst ? 'pl-6 sm:pl-8 pr-4' : 'px-4';

                    if (colId === 'name') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 max-w-[240px]`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-black flex items-center justify-center flex-shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <span title={ownerName} className="truncate text-slate-900 dark:text-white font-bold block min-w-0">
                              <HighlightText text={ownerName} highlight={appliedSearch} />
                            </span>
                          </div>
                        </td>
                      );
                    }

                    if (colId === 'email_address') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60 max-w-[200px] truncate`}>
                          {rec.email_address ? (
                            <a
                              href={`mailto:${rec.email_address}`}
                              onClick={(e) => e.stopPropagation()}
                              title={rec.email_address}
                              className="hover:text-sky-600 dark:hover:text-sky-400 font-medium truncate block hover:underline"
                            >
                              <HighlightText text={rec.email_address} highlight={appliedSearch} />
                            </a>
                          ) : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'property_address') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-medium text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 max-w-[320px] truncate`}>
                          {propertyAddress ? (
                            <span title={propertyAddress} className="truncate block font-semibold text-slate-800 dark:text-slate-200">
                              <HighlightText text={propertyAddress} highlight={appliedSearch} />
                            </span>
                          ) : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'city') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60`}>
                          <HighlightText text={cityName} highlight={appliedSearch} />
                        </td>
                      );
                    }

                    if (colId === 'mobile_1') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-mono text-slate-800 dark:text-slate-200 font-semibold border-b border-slate-100 dark:border-slate-800/60`}>
                          {primaryMobile ? (
                            <span className="inline-flex items-center gap-1 text-slate-900 dark:text-white font-bold font-mono">
                              <HighlightText text={primaryMobile} highlight={appliedSearch} />
                            </span>
                          ) : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'buyer_seller_type') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} border-b border-slate-100 dark:border-slate-800/60`}>
                          <Badge status={customerType} color="sky" size="xs" />
                        </td>
                      );
                    }

                    if (colId === 'community') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-semibold text-sky-700 dark:text-sky-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.community ? (
                            <span className="font-bold text-sky-700 dark:text-sky-400">
                              <HighlightText text={rec.community} highlight={appliedSearch} />
                            </span>
                          ) : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'building_cluster') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.building_cluster ? <HighlightText text={rec.building_cluster} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'unit_number') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-mono font-bold border-b border-slate-100 dark:border-slate-800/60 min-w-[120px]`}>
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
                        <td key={colId} className={`${cellPadding} ${pyClass} font-bold border-b border-slate-100 dark:border-slate-800/60`}>
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
                        <td key={colId} className={`${cellPadding} ${pyClass} text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.sub_community ? <HighlightText text={rec.sub_community} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'size') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-mono text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60`}>
                          {sizeSqft ? `${sizeSqft.toLocaleString()} sq ft` : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'plot_reg_no') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-mono text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.plot_reg_no ? <HighlightText text={rec.plot_reg_no} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'plot_number') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-mono text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.plot_number ? rec.plot_number : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'dmno') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.dmno ? <HighlightText text={rec.dmno} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'dmsubno') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.dmsubno ? rec.dmsubno : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'bedroom') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-bold text-center text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.bedroom ? rec.bedroom : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'mobile_2') {
                      const formattedPhone2 = formatPhoneNumber(rec.mobile_2);
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {formattedPhone2 ? formattedPhone2 : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'mobile_3') {
                      const formattedPhone3 = formatPhoneNumber(rec.mobile_3);
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {formattedPhone3 ? formattedPhone3 : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'pi_number') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-mono font-bold border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.pi_number ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 font-bold">
                              <HighlightText text={rec.pi_number} highlight={appliedSearch} />
                            </span>
                          ) : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'nationality') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.nationality ? rec.nationality : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'procedure_value') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} text-right pr-4 font-extrabold font-mono text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 min-w-[150px]`}>
                          {val ? `AED ${val.toLocaleString()}` : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'developer') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} font-semibold text-purple-700 dark:text-purple-400 border-b border-slate-100 dark:border-slate-800/60`}>
                          {rec.developer ? <HighlightText text={rec.developer} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    if (colId === 'project') {
                      return (
                        <td key={colId} className={`${cellPadding} ${pyClass} text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60 max-w-[160px] truncate`}>
                          {rec.project ? <HighlightText text={rec.project} highlight={appliedSearch} /> : renderNull()}
                        </td>
                      );
                    }

                    return null;
                  })}
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

export { DEFAULT_VISIBLE_COLUMNS, ALL_COLUMNS, formatPhoneNumber, formatPropertyAddress };
export default EnterpriseDataGrid;

