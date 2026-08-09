import React, { useState, useEffect } from 'react';
import { Sparkles, Search, SlidersHorizontal, User, Home, Building2, MapPin, Hash, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import IntelligentSearchBar from './IntelligentSearchBar';

const SAMPLE_PROMPTS = [
  { label: 'Who owns the apartment in Park Horizon Tower 2?', category: 'Owner Query' },
  { label: 'Show me villas in Dubai Hills', category: 'Community Search' },
  { label: 'Find the owner of Unit 507', category: 'Unit Lookup' },
  { label: 'Show me the apartment owned by Mohammed Ibrahim', category: 'Owner + Unit' },
  { label: 'Find Russian owners in Dubai Hills', category: 'Nationality Intent' },
  { label: 'Show me apartments larger than 2,000 sqft', category: 'Size Filter' },
  { label: 'Find the villa with Unit 1804', category: 'Villa Lookup' },
  { label: 'Show all properties owned by someone named Mohammed', category: 'Name Search' },
];

const INTENT_BADGE_META = {
  property_type:   { label: 'Type',        icon: Home,       color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  community:       { label: 'Community',   icon: MapPin,     color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  building_cluster:{ label: 'Building',    icon: Building2,  color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  tower:           { label: 'Tower',       icon: Building2,  color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  unit_number:     { label: 'Unit',        icon: Hash,       color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  owner_name:      { label: 'Owner',       icon: User,       color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  nationality:     { label: 'Nationality', icon: Globe,      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  developer:       { label: 'Developer',   icon: Building2,  color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
};

const AISearchAssistant = ({
  query,
  onQueryChange,
  onSearchSubmit,
  intent = null,
  isSearching = false
}) => {
  const [activeSampleIndex, setActiveSampleIndex] = useState(-1);

  const handlePromptClick = (promptText) => {
    onQueryChange(promptText);
    if (onSearchSubmit) {
      onSearchSubmit(promptText);
    }
  };

  // Active parsed intent items
  const intentEntries = intent ? Object.entries(intent).filter(([k, v]) => v && INTENT_BADGE_META[k]) : [];

  return (
    <div className="space-y-4">
      {/* Search Prompt Header Container */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl relative overflow-hidden bg-gradient-to-b from-white to-slate-50/50 dark:from-[#0B0F19] dark:to-[#070A10]">
        
        {/* Glowing background accent blur */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/10 dark:bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>AI Semantic Property Assistant</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 uppercase tracking-widest">
                    Natural Language NLU
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Describe any property in plain English. The AI automatically parses intent, maps database fields, and ranks relevance.
                </p>
              </div>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative z-30">
            <IntelligentSearchBar
              value={query}
              onChange={onQueryChange}
              onSearch={onSearchSubmit}
              placeholder="Ask anything (e.g. 'Who owns the apartment in Park Horizon Tower 2?', 'Show villas in Dubai Hills')..."
              className="w-full text-base shadow-inner"
              autoFocus
            />
          </div>

          {/* Extracted AI Intent Breakdown Strip */}
          {intentEntries.length > 0 && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 animate-fade-up">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Detected AI Intent:</span>
                </span>
                {intentEntries.map(([key, val]) => {
                  const meta = INTENT_BADGE_META[key];
                  const Icon = meta.icon;
                  return (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color} transition-all hover:scale-105 shadow-sm`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{meta.label}:</span>
                      <span className="font-bold">{val}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sample Prompts Pills */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Try asking:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(p.label)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100/80 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200/80 dark:border-slate-700/60 hover:border-sky-500/30 whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 group flex-shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-sky-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISearchAssistant;
