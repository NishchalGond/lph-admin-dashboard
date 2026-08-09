import React, { useEffect, useRef } from 'react';
import { User, Phone, MessageSquare, Mail, Copy, Filter, ExternalLink, FileText } from 'lucide-react';

const LedgerContextMenu = ({ position, record, onClose, onViewProfile, onCopyDetails, onFilterCommunity }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!position || !record) return null;

  const ownerName = record.name || record.customer_name || 'Owner';
  const phone = record.mobile_1 || '';
  const email = record.email_address || '';

  const handleCopyPhone = () => {
    if (phone) navigator.clipboard.writeText(phone);
    onClose();
  };

  const handleWhatsApp = () => {
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(ownerName)},%20regarding%20Unit%20${record.unit_number || ''}`, '_blank');
    }
    onClose();
  };

  const handleEmail = () => {
    if (email) window.open(`mailto:${email}?subject=Inquiry%20Regarding%20Unit%20${record.unit_number || ''}`, '_blank');
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      className="fixed z-[1000] w-56 py-1.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl text-xs font-semibold text-slate-200 animate-in fade-in zoom-in-95"
    >
      <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
        Unit {record.unit_number || '—'} • {ownerName}
      </div>

      <button
        onClick={() => { onViewProfile(record.id); onClose(); }}
        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-800 text-sky-400"
      >
        <ExternalLink className="w-3.5 h-3.5" /> View Property Profile
      </button>

      <button
        onClick={handleCopyPhone}
        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-800 text-slate-200"
      >
        <Phone className="w-3.5 h-3.5 text-emerald-400" /> Copy Phone Number
      </button>

      <button
        onClick={handleWhatsApp}
        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-800 text-slate-200"
      >
        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> Send WhatsApp Message
      </button>

      <button
        onClick={handleEmail}
        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-800 text-slate-200"
      >
        <Mail className="w-3.5 h-3.5 text-purple-400" /> Send Email
      </button>

      <div className="my-1 border-t border-slate-800"></div>

      <button
        onClick={() => { onCopyDetails(record); onClose(); }}
        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-800 text-slate-200"
      >
        <Copy className="w-3.5 h-3.5 text-amber-400" /> Copy Record Details
      </button>

      {record.community && (
        <button
          onClick={() => { onFilterCommunity(record.community); onClose(); }}
          className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-800 text-slate-200"
        >
          <Filter className="w-3.5 h-3.5 text-indigo-400" /> Filter by {record.community}
        </button>
      )}
    </div>
  );
};

export default LedgerContextMenu;
