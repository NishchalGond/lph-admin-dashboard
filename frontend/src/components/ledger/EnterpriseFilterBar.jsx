import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown, Check, RotateCcw, MapPin, Layers, Home, UserCheck, Bed, Search } from 'lucide-react';
import { getFilterOptions } from '../../services/api';

const DEFAULT_COMMUNITIES = ['MUDON', 'DAMAC HILLS', 'ARABELLA 2', 'DUBAI LAND RESIDENCES', 'TOWN SQUARE', 'DUBAI HILLS', 'DOWNTOWN DUBAI', 'BUSINESS BAY', 'PALM JUMEIRAH', 'DUBAI MARINA'];
const DEFAULT_DEVELOPERS = ['DAMAC Properties', 'Dubai Properties', 'Emaar Properties', 'Nakheel', 'Sobha Realty', 'Binghatti', 'Meraas', 'Deyaar'];
const PROPERTY_TYPES = ['Residential', 'Villa', 'Townhouse', 'Apartment', 'Commercial'];
const BEDROOMS = ['Studio', '1', '2', '3', '4', '5+'];
const BUYER_SELLER = ['Buyer', 'Seller'];

const EnterpriseFilterBar = ({
  community,
  developer,
  propertyType,
  bedroom,
  buyerSeller,
  onChangeFilter,
  onClearAll,
  activeSort,
  onChangeSort
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Dynamic filter options state
  const [communities, setCommunities] = useState(DEFAULT_COMMUNITIES);
  const [developers, setDevelopers] = useState(DEFAULT_DEVELOPERS);

  // Search inside dropdown filters
  const [communitySearch, setCommunitySearch] = useState('');
  const [developerSearch, setDeveloperSearch] = useState('');

  useEffect(() => {
    getFilterOptions()
      .then((res) => {
        if (res.data?.communities?.length > 0) setCommunities(res.data.communities);
        if (res.data?.developers?.length > 0) setDevelopers(res.data.developers);
      })
      .catch(() => {
        // Fallback to default lists on connection error
      });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredCommunities = communities.filter(c => c.toLowerCase().includes(communitySearch.toLowerCase()));
  const filteredDevelopers = developers.filter(d => d.toLowerCase().includes(developerSearch.toLowerCase()));

  const hasActiveFilters = !!(community || developer || propertyType || bedroom || buyerSeller);

  return (
    <div ref={dropdownRef} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left Filter Pickers */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-sky-500" /> Filters:
          </span>

          {/* Dynamic Community Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'community' ? null : 'community')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                community
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              <span>{community || 'Community'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activeDropdown === 'community' && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1">
                <div className="relative mb-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search community..."
                    value={communitySearch}
                    onChange={(e) => setCommunitySearch(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {filteredCommunities.length === 0 ? (
                    <div className="p-2 text-[11px] text-slate-400 text-center">No community found</div>
                  ) : (
                    filteredCommunities.map((c) => (
                      <button
                        key={c}
                        onClick={() => { onChangeFilter('community', c === community ? '' : c); setActiveDropdown(null); }}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        <span className="truncate">{c}</span>
                        {c === community && <Check className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Developer Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'developer' ? null : 'developer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                developer
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>{developer || 'Developer'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activeDropdown === 'developer' && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1">
                <div className="relative mb-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search developer..."
                    value={developerSearch}
                    onChange={(e) => setDeveloperSearch(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {filteredDevelopers.length === 0 ? (
                    <div className="p-2 text-[11px] text-slate-400 text-center">No developer found</div>
                  ) : (
                    filteredDevelopers.map((d) => (
                      <button
                        key={d}
                        onClick={() => { onChangeFilter('developer', d === developer ? '' : d); setActiveDropdown(null); }}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        <span className="truncate">{d}</span>
                        {d === developer && <Check className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Property Type Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'propertyType' ? null : 'propertyType')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                propertyType
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-emerald-500" />
              <span>{propertyType || 'Type'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activeDropdown === 'propertyType' && (
              <div className="absolute top-full left-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                {PROPERTY_TYPES.map((pt) => (
                  <button
                    key={pt}
                    onClick={() => { onChangeFilter('propertyType', pt === propertyType ? '' : pt); setActiveDropdown(null); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <span>{pt}</span>
                    {pt === propertyType && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bedrooms Filter */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'bedroom' ? null : 'bedroom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                bedroom
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <Bed className="w-3.5 h-3.5 text-indigo-500" />
              <span>{bedroom ? `${bedroom} Bed` : 'Beds'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activeDropdown === 'bedroom' && (
              <div className="absolute top-full left-0 mt-1.5 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                {BEDROOMS.map((b) => (
                  <button
                    key={b}
                    onClick={() => { onChangeFilter('bedroom', b === bedroom ? '' : b); setActiveDropdown(null); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <span>{b} Bed</span>
                    {b === bedroom && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buyer / Seller Toggle */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'buyerSeller' ? null : 'buyerSeller')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                buyerSeller
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>{buyerSeller || 'Buyer/Seller'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activeDropdown === 'buyerSeller' && (
              <div className="absolute top-full left-0 mt-1.5 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                {BUYER_SELLER.map((bs) => (
                  <button
                    key={bs}
                    onClick={() => { onChangeFilter('buyerSeller', bs === buyerSeller ? '' : bs); setActiveDropdown(null); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <span>{bs}</span>
                    {bs === buyerSeller && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sort:</span>
          <select
            value={activeSort}
            onChange={(e) => onChangeSort(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer"
          >
            <option value="id_desc">Newest First</option>
            <option value="id_asc">Oldest First</option>
            <option value="value_desc">Value: High to Low</option>
            <option value="value_asc">Value: Low to High</option>
            <option value="unit_asc">Unit Number A-Z</option>
          </select>
        </div>
      </div>

      {/* Active Filter Strip */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Filters:</span>
          {community && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
              Community: {community}
              <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => onChangeFilter('community', '')} />
            </span>
          )}
          {developer && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              Developer: {developer}
              <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => onChangeFilter('developer', '')} />
            </span>
          )}
          {propertyType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Type: {propertyType}
              <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => onChangeFilter('propertyType', '')} />
            </span>
          )}
          {bedroom && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
              Beds: {bedroom}
              <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => onChangeFilter('bedroom', '')} />
            </span>
          )}
          {buyerSeller && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Role: {buyerSeller}
              <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => onChangeFilter('buyerSeller', '')} />
            </span>
          )}

          <button
            onClick={onClearAll}
            className="text-[11px] font-semibold text-red-500 dark:text-red-400 hover:underline ml-auto flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default EnterpriseFilterBar;
