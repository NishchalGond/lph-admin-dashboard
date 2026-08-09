import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Building2, MapPin, User, Hash, Loader2, Sparkles } from 'lucide-react';
import { getRecordSuggestions } from '../../services/api';

const TYPE_META = {
  'AI Intent': { icon: Sparkles, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  Owner:       { icon: User,      color: 'text-sky-500',    bg: 'bg-sky-500/10'    },
  Community:   { icon: MapPin,    color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  Building:    { icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  Unit:        { icon: Hash,      color: 'text-amber-500',  bg: 'bg-amber-500/10'  },
};


function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const IntelligentSearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search records, units, plots…',
  className = '',
  autoFocus = false,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const debouncedValue = useDebounce(value, 300);

  // Fetch suggestions when debounced value changes
  useEffect(() => {
    if (!debouncedValue || debouncedValue.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    getRecordSuggestions(debouncedValue.trim(), 10)
      .then((res) => {
        if (controller.signal.aborted) return;
        setSuggestions(res.data.suggestions || []);
        setShowSuggestions(true);
        setActiveIndex(-1);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSuggestions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedValue]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = useCallback((suggestion) => {
    onChange(suggestion.value);
    setShowSuggestions(false);
    setActiveIndex(-1);
    if (onSearch) onSearch(suggestion.value);
    setTimeout(() => inputRef.current?.blur(), 0);
  }, [onChange, onSearch]);

  const handleKeyDown = useCallback((e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && onSearch) {
        e.preventDefault();
        onSearch(value);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        selectSuggestion(suggestions[activeIndex]);
      } else {
        setShowSuggestions(false);
        if (onSearch) onSearch(value);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }, [showSuggestions, suggestions, activeIndex, value, onSearch, selectSuggestion]);

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    if (onSearch) onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative group">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none z-10"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          autoFocus={autoFocus}
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          aria-label="Search property records"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          className="w-full pl-11 pr-10 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none [appearance:textfield] [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden"
        />
        {/* Right icon: loader or clear */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" aria-hidden="true" />
          ) : value ? (
            <button
              onClick={handleClear}
              aria-label="Clear search"
              className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3 text-slate-500 dark:text-slate-300" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-72 overflow-y-auto"
          style={{ boxShadow: '0 12px 40px -8px rgba(0,0,0,0.25), 0 4px 12px -2px rgba(0,0,0,0.12)' }}
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Suggestions
            </span>
          </div>
          {suggestions.map((s, i) => {
            const meta = TYPE_META[s.type] || TYPE_META.Owner;
            const Icon = meta.icon;
            return (
              <button
                key={`${s.type}-${s.value}-${i}`}
                id={`suggestion-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  i === activeIndex
                    ? 'bg-sky-50 dark:bg-sky-900/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {s.label}
                  </span>
                </span>
                <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                  {s.type}
                </span>
              </button>
            );
          })}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onMouseDown={(e) => { e.preventDefault(); setShowSuggestions(false); if (onSearch) onSearch(value); }}
              className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              Search all results for &ldquo;{value}&rdquo; →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentSearchBar;
