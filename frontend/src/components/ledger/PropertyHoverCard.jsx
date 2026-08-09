import React from 'react';
import { User, Phone, Mail, MapPin, Building2, Home, ExternalLink, ShieldCheck } from 'lucide-react';

const PropertyHoverCard = ({ record, position }) => {
  if (!record) return null;

  const ownerName = record.name || record.customer_name || 'Unspecified Owner';
  const unit = record.unit_number || '—';
  const community = record.community || 'Dubai Hub';
  const building = record.building_cluster || '—';
  const developer = record.developer || 'DLD Registered';
  const val = record.procedure_value ? `AED ${Number(record.procedure_value).toLocaleString()}` : 'Valuation N/A';

  return (
    <div
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      className="fixed z-[999] w-80 p-4 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl text-white pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">
              Unit {unit}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {record.property_type || 'Apartment'}
            </span>
          </div>
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5 truncate max-w-[200px]">
            <User className="w-3.5 h-3.5 text-sky-400" /> {ownerName}
          </h4>
        </div>
        <div className="text-right">
          <div className="text-xs font-black text-emerald-400 font-mono">{val}</div>
          <div className="text-[10px] text-slate-400 font-medium">Est. Value</div>
        </div>
      </div>

      {/* Property Context Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Community</span>
          <span className="font-semibold text-slate-200 truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 text-sky-400" /> {community}
          </span>
        </div>
        <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Building</span>
          <span className="font-semibold text-slate-200 truncate flex items-center gap-1">
            <Building2 className="w-3 h-3 text-purple-400" /> {building}
          </span>
        </div>
      </div>

      {/* Owner Contact */}
      <div className="space-y-1.5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono">{record.mobile_1 || 'No Phone Registered'}</span>
        </div>
        <div className="flex items-center gap-2 truncate">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">{record.email_address || 'No Email Registered'}</span>
        </div>
      </div>

      {/* Footer helper */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-semibold text-slate-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified DLD Record
        </span>
        <span className="text-sky-400 flex items-center gap-0.5">
          Click to View Profile <ExternalLink className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
};

export default PropertyHoverCard;
