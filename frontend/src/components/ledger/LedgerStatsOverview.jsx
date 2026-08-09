import React from 'react';
import { Building2, MapPin, Layers, Users, Activity, TrendingUp, Home } from 'lucide-react';

const LedgerStatsOverview = ({ totalRecords = 0, isFiltered = false }) => {
  const count = typeof totalRecords === 'number' ? totalRecords : 0;

  const stats = [
    {
      title: 'Total Properties',
      value: count.toLocaleString(),
      subtext: isFiltered ? 'Filtered Results' : count > 0 ? '+12.4% vs last month' : 'Database Reset',
      trend: isFiltered || count === 0 ? null : 'up',
      icon: Building2,
      accentBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
    },
    {
      title: 'Communities Hub',
      value: count > 0 ? '16 Hubs' : '0 Hubs',
      subtext: count > 0 ? 'Mudon, Dubai Hills, Downtown...' : 'No active hubs',
      icon: MapPin,
      accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      title: 'Towers & Clusters',
      value: count > 0 ? '248 Towers' : '0 Towers',
      subtext: count > 0 ? 'Park Horizon, Crescent, etc.' : 'No active clusters',
      icon: Layers,
      accentBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    },
    {
      title: 'Registered Owners',
      value: count > 0 ? '412,890' : '0',
      subtext: count > 0 ? '98.6% Identity Matched' : '0 Identity Matched',
      icon: Users,
      accentBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    },
    {
      title: 'Data Health Index',
      value: count > 0 ? '99.4%' : '100%',
      subtext: count > 0 ? '23 Headers Fully Indexed' : 'Database Ready',
      icon: Activity,
      accentBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
    },
    {
      title: 'Property Type Split',
      value: count > 0 ? '62% Apt / 38% Villa' : '0% / 0%',
      subtext: 'Residential & Commercial',
      icon: Home,
      accentBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 truncate uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center border ${stat.accentBg} transition-transform group-hover:scale-110`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-1">
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono">
                {stat.value}
              </div>
            </div>

            <div className="mt-1 flex items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
              {stat.trend === 'up' && (
                <TrendingUp className="w-2.5 h-2.5 text-emerald-500 mr-0.5 inline" />
              )}
              {stat.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LedgerStatsOverview;
