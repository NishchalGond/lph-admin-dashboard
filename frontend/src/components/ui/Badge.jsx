import React from 'react';

/**
 * Unified Badge component — consistent status styling across all pages.
 * Usage: <Badge status="Success" /> or <Badge status="Failed" variant="dot" />
 */
const STATUS_MAP = {
  // Processing statuses
  Success:   { color: 'emerald', label: 'Success' },
  Warning:   { color: 'amber',   label: 'Warning' },
  Failed:    { color: 'rose',    label: 'Failed' },
  // Duplicate statuses
  Unique:    { color: 'slate',   label: 'Unique' },
  'Duplicate Hash':     { color: 'amber', label: 'Duplicate Hash' },
  'Duplicate Filename': { color: 'amber', label: 'Duplicate Filename' },
  // Record type
  Buyer:     { color: 'indigo',  label: 'Buyer' },
  Seller:    { color: 'purple',  label: 'Seller' },
  // Batch statuses
  Completed: { color: 'emerald', label: 'Completed' },
  'In Progress': { color: 'sky', label: 'In Progress' },
  // Severity
  INFO:    { color: 'sky',   label: 'INFO' },
  WARNING: { color: 'amber', label: 'WARNING' },
  ERROR:   { color: 'rose',  label: 'ERROR' },
  // n8n Statuses
  RUNNING:   { color: 'emerald', label: 'Running' },
  COMPLETED: { color: 'sky',     label: 'Completed' },
  FAILED:    { color: 'rose',    label: 'Failed' },
  IDLE:      { color: 'slate',   label: 'Idle' },
  PENDING:   { color: 'amber',   label: 'Pending' },
};

const COLOR_CLASSES = {
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  amber:   'bg-amber-500/10   text-amber-700   dark:text-amber-400   border-amber-500/25',
  rose:    'bg-rose-500/10    text-rose-700    dark:text-rose-400    border-rose-500/25',
  sky:     'bg-sky-500/10     text-sky-700     dark:text-sky-400     border-sky-500/25',
  indigo:  'bg-indigo-500/10  text-indigo-700  dark:text-indigo-400  border-indigo-500/25',
  purple:  'bg-purple-500/10  text-purple-700  dark:text-purple-400  border-purple-500/25',
  slate:   'bg-slate-200      text-slate-600   dark:bg-slate-800     dark:text-slate-400  border-slate-300 dark:border-slate-700',
};

const DOT_COLORS = {
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
  sky:     'bg-sky-500',
  indigo:  'bg-indigo-500',
  purple:  'bg-purple-500',
  slate:   'bg-slate-400',
};

const Badge = ({ status, label: labelOverride, color: colorOverride, dot = false, pulse = false, size = 'sm' }) => {
  const config = STATUS_MAP[status] || { color: colorOverride || 'slate', label: status || '—' };
  const color = colorOverride || config.color;
  const label = labelOverride || config.label;

  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeClass} ${COLOR_CLASSES[color] || COLOR_CLASSES.slate}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_COLORS[color]} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {label}
    </span>
  );
};

export default Badge;
