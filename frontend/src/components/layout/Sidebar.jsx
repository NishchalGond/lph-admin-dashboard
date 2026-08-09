import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  FolderTree,
  Table,
  Layers,
  Copy,
  Activity,
  FileText,
  BarChart3,
  FileCheck,
  Building2,
  LogOut,
  Zap,
  Shield,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    group: 'Operations',
    items: [
      { label: 'Overview',        path: '/',          icon: LayoutDashboard },
      { label: 'Global Search',   path: '/search',    icon: Search,          shortcut: '⌘K' },
      { label: 'Property Ledger', path: '/records',   icon: Table,           badge: '23 Cols' },
      { label: 'Batch Explorer',  path: '/batches',   icon: Layers },
    ],
  },
  {
    group: 'Data Pipeline',
    items: [
      { label: 'File Explorer',   path: '/files',      icon: FolderTree },
      { label: 'Duplicates',      path: '/duplicates', icon: Copy },
      { label: 'Workflow Monitor',path: '/monitor',    icon: Activity,        badge: 'Live', live: true },
      { label: 'System Logs',     path: '/logs',       icon: FileText },
      { label: 'Analytics',       path: '/analytics',  icon: BarChart3 },
      { label: 'Summary',         path: '/summary',    icon: FileCheck },
    ],
  },
];

const ROLE_COLORS = {
  admin:     { from: '#0EA5E9', to: '#6366F1', label: 'Administrator' },
  ceo:       { from: '#F59E0B', to: '#EF4444', label: 'Chief Executive' },
  marketing: { from: '#10B981', to: '#0EA5E9', label: 'Marketing Lead' },
  developer: { from: '#8B5CF6', to: '#EC4899', label: 'Lead Developer' },
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [hoveredPath, setHoveredPath] = useState(null);

  const roleConfig = ROLE_COLORS[user?.role?.toLowerCase()] || ROLE_COLORS.admin;
  const initials = (user?.username || 'AD').slice(0, 2).toUpperCase();

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-screen sticky top-0 z-30 transition-colors duration-300 bg-white/95 dark:bg-[#070A14]/98 border-r border-slate-200/80 dark:border-white/10 select-none"
    >
      {/* ── Brand Header ── */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-sky-500/20"
              style={{ background: `linear-gradient(135deg, ${roleConfig.from}, ${roleConfig.to})` }}
            >
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 shadow-sm" />
          </div>

          <div className="min-w-0">
            <h1 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight truncate">
              LPH Real Estate
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Dubai Engine
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.group}>
            <p className="px-2.5 mb-1.5 text-[9px] font-bold tracking-[0.1em] uppercase text-slate-400 dark:text-slate-500">
              {section.group}
            </p>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                const isHovered = hoveredPath === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    aria-label={item.label}
                    onMouseEnter={() => setHoveredPath(item.path)}
                    onMouseLeave={() => setHoveredPath(null)}
                    className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-150 group ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent'
                    }`}
                  >
                    {/* Left accent bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-sky-500" />
                    )}

                    <div className={`relative flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    }`}>
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>

                    <span className="relative flex-1 truncate">{item.label}</span>

                    {item.live && (
                      <span className="relative flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    )}
                    {item.badge && !item.live && (
                      <span className="relative flex-shrink-0 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400 text-[9px] font-mono font-bold">
                        {item.badge}
                      </span>
                    )}
                    {item.shortcut && !item.badge && !item.live && (
                      <kbd className="relative flex-shrink-0 px-1 py-0.5 text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded">
                        {item.shortcut}
                      </kbd>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer Status Bar ── */}
      <div className="px-3 pb-4 space-y-3 border-t border-slate-200/60 dark:border-white/5 pt-3">
        {/* n8n Status */}
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
          <span className="text-[10px] flex-1 truncate">n8n Webhook Active</span>
          <Shield className="w-3 h-3 text-emerald-500 flex-shrink-0" />
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2.5 px-2">
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md"
            style={{ background: `linear-gradient(135deg, ${roleConfig.from}, ${roleConfig.to})` }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-slate-900 dark:text-white leading-tight truncate">
              {user?.full_name || user?.username || 'Administrator'}
            </p>
            <p className="text-[9px] font-mono uppercase text-slate-400 dark:text-slate-500 tracking-wide">
              {roleConfig.label}
            </p>
          </div>

          <button
            onClick={logout}
            aria-label="Sign out of LPH Real Estate CRM"
            title="Sign out"
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
