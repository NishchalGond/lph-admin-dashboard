import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  subtitle,
  color = 'sky',
  sparklineData = []
}) => {
  const colorStyles = {
    sky: {
      bg: 'from-sky-500/10 via-sky-500/5 to-transparent',
      text: 'text-sky-600 dark:text-sky-400',
      badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      glow: 'group-hover:border-sky-500/40 shadow-sky-500/5',
      fill: '#0284C7',
    },
    emerald: {
      bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      glow: 'group-hover:border-emerald-500/40 shadow-emerald-500/5',
      fill: '#10B981',
    },
    amber: {
      bg: 'from-amber-500/10 via-amber-500/5 to-transparent',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      glow: 'group-hover:border-amber-500/40 shadow-amber-500/5',
      fill: '#F59E0B',
    },
    indigo: {
      bg: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
      text: 'text-indigo-600 dark:text-indigo-400',
      badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      glow: 'group-hover:border-indigo-500/40 shadow-indigo-500/5',
      fill: '#6366F1',
    },
    rose: {
      bg: 'from-rose-500/10 via-rose-500/5 to-transparent',
      text: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      glow: 'group-hover:border-rose-500/40 shadow-rose-500/5',
      fill: '#F43F5E',
    },
  };

  const style = colorStyles[color] || colorStyles.sky;

  return (
    <div className={`glass-panel p-5 relative overflow-hidden group glass-card-hover ${style.glow}`}>
      {/* Background Subtle Gradient Glow */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${style.bg} blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </div>
        </div>

        <div className={`p-3 rounded-2xl border ${style.badge} backdrop-blur-md shadow-sm`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>

      {/* Footer Info / Trend */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs relative z-10">
        {trendValue !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
              trend === 'up'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : trend === 'down'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
            }`}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend === 'neutral' && <Minus className="w-3 h-3" />}
              {trendValue}
            </span>
            <span className="text-slate-500 dark:text-slate-400">vs last period</span>
          </div>
        ) : (
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">{subtitle}</span>
        )}

        {/* Mini Sparkline Bar SVG */}
        {sparklineData.length > 0 && (
          <div className="flex items-end gap-1 h-5">
            {sparklineData.map((val, i) => (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-300 group-hover:opacity-100"
                style={{
                  height: `${Math.max(20, (val / Math.max(...sparklineData)) * 100)}%`,
                  backgroundColor: style.fill,
                  opacity: 0.6 + (i / sparklineData.length) * 0.4
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
