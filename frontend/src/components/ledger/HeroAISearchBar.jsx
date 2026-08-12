import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, MapPin, User, Hash, Phone, Loader2, ArrowRight } from 'lucide-react';
import { getRecordSuggestions } from '../../services/api';

const TYPE_META = {
  Owner:     { icon: User,      color: 'text-sky-500',    bg: 'bg-sky-500/10'    },
  Phone:     { icon: Phone,     color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  Community: { icon: MapPin,    color: 'text-purple-500', bg: 'bg-purple-500/10'  },
  Building:  { icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/10'  },
  Unit:      { icon: Hash,      color: 'text-amber-500',  bg: 'bg-amber-500/10'   },
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const HeroAISearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search by Name, Phone Number, Community, Building, Unit, PID...',
  queryTimeMs = 63
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedValue = useDebounce(value, 200);

  // Focus keyboard shortcut '/' or 'Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch live search suggestions as user types
  useEffect(() => {
    if (!debouncedValue || debouncedValue.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    getRecordSuggestions(debouncedValue.trim(), 8)
      .then((res) => {
        setSuggestions(res.data.suggestions || []);
        setShowSuggestions(true);
        setActiveIndex(-1);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setIsLoading(false));
  }, [debouncedValue]);

  // Close outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectSuggestion = (val) => {
    onChange(val);
    setShowSuggestions(false);
    if (onSearch) onSearch(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[activeIndex].value);
      } else {
        setShowSuggestions(false);
        if (onSearch) onSearch(value);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2.5">
      {/* Main Fast Search Input */}
      <div className="relative group">
        <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500 transition-all">
          <div className="pl-4 pr-2 flex items-center gap-2 pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder={placeholder}
            className="w-full py-3.5 pr-24 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent outline-none"
          />

          {/* Right Actions & Search Trigger */}
          <div className="absolute right-3 flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            ) : value ? (
              <button
                onClick={() => { onChange(''); onSearch(''); inputRef.current?.focus(); }}
                className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                /
              </kbd>
            )}

            <button
              onClick={() => onSearch(value)}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span>Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Auto-Complete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 max-h-72 overflow-y-auto">
          <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <span>Matching Records</span>
            <span>Use ↑↓ to navigate</span>
          </div>

          {suggestions.map((s, i) => {
            const meta = TYPE_META[s.type] || TYPE_META.Owner;
            const Icon = meta.icon;
            return (
              <button
                key={i}
                onClick={() => handleSelectSuggestion(s.value)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                  i === activeIndex
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                  </div>
                  <span className="font-semibold truncate">{s.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${meta.bg} ${meta.color}`}>
                  {s.type}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HeroAISearchBar;
