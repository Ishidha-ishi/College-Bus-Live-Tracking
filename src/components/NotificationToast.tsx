import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Bell, CheckCircle2, Info, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { activeToast, dismissToast } = useApp();

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'delay':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'fee_reminder':
        return <Bell className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'incident_update':
        return <Info className="w-5 h-5 text-sky-400 shrink-0" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
    }
  };

  const getBg = () => {
    switch (activeToast.type) {
      case 'delay':
        return 'border-amber-500/50 bg-amber-950/90 text-amber-100';
      case 'fee_reminder':
        return 'border-rose-500/50 bg-rose-950/90 text-rose-100';
      case 'incident_update':
        return 'border-sky-500/50 bg-sky-950/90 text-sky-100';
      default:
        return 'border-slate-700 bg-slate-900/95 text-slate-100';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 ${getBg()}`}>
        <div className="p-2 rounded-xl bg-slate-950/40 border border-white/10">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-xs uppercase tracking-wider">{activeToast.title}</h4>
            <span className="text-[10px] opacity-70">Push Alert</span>
          </div>
          <p className="text-xs mt-1 leading-relaxed opacity-95">{activeToast.message}</p>
        </div>
        <button
          onClick={dismissToast}
          className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
