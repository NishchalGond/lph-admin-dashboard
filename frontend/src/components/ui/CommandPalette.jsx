import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, LayoutDashboard, Table, Layers, FolderTree, BarChart3, 
  ArrowRight, CornerDownLeft, X, Sparkles
} from 'lucide-react';

const COMMAND_ITEMS = [
  { id: 'home', label: 'Go to Overview Dashboard', path: '/', group: 'Navigation', icon: LayoutDashboard, shortcut: 'G H' },
  { id: 'records', label: 'Open Property Ledger (23 Headers)', path: '/records', group: 'Navigation', icon: Table, shortcut: 'G R' },
  { id: 'batches', label: 'View Consolidated Batches', path: '/batches', group: 'Navigation', icon: Layers, shortcut: 'G B' },
  { id: 'files', label: 'Explore File Manager', path: '/files', group: 'Navigation', icon: FolderTree, shortcut: 'G F' },
  { id: 'analytics', label: 'View System Analytics', path: '/analytics', group: 'System', icon: BarChart3, shortcut: 'G A' },
];

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Filter commands by search query
  const filtered = COMMAND_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.group.toLowerCase().includes(query.toLowerCase())
  );

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          navigate(filtered[selectedIndex].path);
          onClose();
        } else if (query.trim()) {
          navigate(`/search?q=${encodeURIComponent(query)}`);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, query, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#05070D]/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
    >
      <div
        className="w-full max-w-2xl glass-panel border border-white/15 shadow-2xl rounded-2xl overflow-hidden space-y-0 text-white"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-white/10 p-4 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-sky-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search property records..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-base font-medium text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Items List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">No exact command matches</p>
              <button
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(query)}`);
                  onClose();
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:underline pt-2 cursor-pointer"
              >
                <span>Search all records for &quot;{query}&quot;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-500/15 text-white border border-sky-500/30 shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-white text-sm">{item.label}</span>
                      <span className="text-[11px] text-slate-400 font-normal">{item.group}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white/5 border border-white/10 rounded-md">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && <CornerDownLeft className="w-4 h-4 text-sky-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 border-t border-white/5 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-white/10 px-1 py-0.5 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-white/10 px-1 py-0.5 rounded">↵</kbd> Select</span>
            <span><kbd className="font-mono bg-white/10 px-1 py-0.5 rounded">ESC</kbd> Close</span>
          </div>
          <span className="flex items-center gap-1 text-sky-400 font-semibold">
            <Sparkles className="w-3 h-3" /> Command Bar
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
