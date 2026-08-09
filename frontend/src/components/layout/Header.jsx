import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import CommandPalette from '../ui/CommandPalette';
import { Sun, Moon, Search, ChevronRight, Bell, Command } from 'lucide-react';

const ROUTE_META = {
  '/':           { title: 'Overview',           subtitle: 'Executive Dashboard' },
  '/search':     { title: 'Global Search',       subtitle: 'Property Records' },
  '/records':    { title: 'Property Ledger',     subtitle: '23 Real Estate Headers' },
  '/files':      { title: 'File Explorer',       subtitle: 'Source Files' },
  '/batches':    { title: 'Batch Explorer',      subtitle: 'Consolidated Runs' },
  '/duplicates': { title: 'Duplicate Center',    subtitle: 'Detection Engine' },
  '/monitor':    { title: 'Workflow Monitor',    subtitle: 'n8n Live Engine' },
  '/logs':       { title: 'System Logs',         subtitle: 'Audit Trail' },
  '/analytics':  { title: 'Analytics',           subtitle: 'Throughput & Trends' },
  '/summary':    { title: 'Workflow Summary',    subtitle: 'Executive Report' },
};

const Header = () => {
  const { darkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Detect scroll for elevated header effect
  useEffect(() => {
    const onScroll = (e) => setScrolled(e.target.scrollTop > 8);
    const main = document.querySelector('main');
    main?.addEventListener('scroll', onScroll);
    return () => main?.removeEventListener('scroll', onScroll);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const meta = ROUTE_META[location.pathname] || { title: 'Dashboard', subtitle: 'LPH Real Estate' };

  return (
    <>
      <header
        className={`h-14 px-6 flex items-center justify-between sticky top-0 z-20 select-none transition-all duration-300 ${
          scrolled
            ? 'bg-white/98 dark:bg-[#060912]/98 backdrop-blur-xl shadow-sm border-b border-black/[0.06] dark:border-white/[0.06]'
            : 'bg-white/95 dark:bg-[#060912]/95 backdrop-blur-md border-b border-black/[0.05] dark:border-white/[0.05]'
        }`}
      >
        {/* ── Left: Breadcrumb ── */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-600">
            <span className="font-medium">LPH</span>
            <ChevronRight className="w-3 h-3" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13.5px] font-bold text-slate-900 dark:text-white tracking-tight truncate leading-none">
              {meta.title}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5 hidden sm:block">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* ── Center: Command Bar ── */}
        <button
          onClick={() => setIsCommandOpen(true)}
          aria-label="Open command palette (Ctrl+K)"
          className="hidden md:flex items-center gap-3 w-80 xl:w-96 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500 border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.025] dark:bg-white/[0.025] hover:border-sky-500/40 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-sky-500/[0.03] transition-all duration-200 group"
        >
          <Search className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-sky-400 transition-colors flex-shrink-0" />
          <span className="flex-1 text-left truncate">Search records, units, plots…</span>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded text-slate-300 dark:text-slate-600">
              ⌘
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded text-slate-300 dark:text-slate-600">
              K
            </kbd>
          </div>
        </button>

        {/* ── Right: Controls ── */}
        <div className="flex items-center gap-2">
          {/* Mobile search trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            aria-label="Open search"
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-black/[0.06] dark:bg-white/[0.06]" />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-transparent hover:border-black/[0.06] dark:hover:border-white/[0.06] transition-all duration-200"
          >
            {darkMode
              ? <Sun  className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-black/[0.06] dark:bg-white/[0.06]" />

          {/* User chip */}
          <div className="flex items-center gap-2 pl-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #6366F1)' }}
            >
              {(user?.username || 'AD').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[100px]">
                {user?.full_name?.split(' ')[0] || user?.username || 'Admin'}
              </p>
              <p className="text-[9px] font-mono uppercase text-slate-300 dark:text-slate-600 mt-0.5">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </header>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
};

export default Header;
