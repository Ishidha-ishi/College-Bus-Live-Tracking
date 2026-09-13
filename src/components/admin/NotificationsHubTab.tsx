import React, { useState } from 'react';
import { Bell, Send, AlertTriangle, Clock, CheckCircle2, Radio, Filter, Users, Bus } from 'lucide-react';
import { api } from '../../services/api';

interface NotificationsHubTabProps {
  notifications: any[];
  onRefresh: () => void;
  onOpenBroadcast: () => void;
}

export const NotificationsHubTab: React.FC<NotificationsHubTabProps> = ({
  notifications,
  onRefresh,
  onOpenBroadcast,
}) => {
  const [filterType, setFilterType] = useState('ALL');

  const filtered = notifications.filter(n => {
    return filterType === 'ALL' || n.type === filterType;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <span>Central Transport Dispatch & Notifications Desk</span>
          </h3>
          <p className="text-xs text-slate-400">
            Push real-time proximity alerts, bottleneck delay announcements, and fee payment deadlines via SSE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBroadcast}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>+ Broadcast Alert</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        {['ALL', 'BUS_NEAR_STOP', 'BUS_DELAY', 'FEE_REMINDER', 'EMERGENCY', 'SYSTEM'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              filterType === type
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Notification Stream Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
            No notifications logged under this category.
          </div>
        ) : (
          filtered.map((item) => {
            const isNearStop = item.type === 'BUS_NEAR_STOP';
            const isDelay = item.type === 'BUS_DELAY' || item.type === 'DELAY';
            const isFee = item.type === 'FEE_REMINDER';
            const isUrgent = item.priority === 'urgent' || item.priority === 'high';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-3xl bg-slate-900 border shadow-lg flex flex-wrap items-start justify-between gap-3 transition ${
                  isNearStop
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : isUrgent
                      ? 'border-rose-500/40 bg-rose-950/20'
                      : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-[260px]">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isNearStop
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isDelay
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : isFee
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isNearStop ? <Radio className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white">{item.title}</h4>
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                        item.priority === 'urgent'
                          ? 'bg-rose-500 text-white'
                          : item.priority === 'high'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.priority || 'Normal'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                      <span>Target: <b className="text-slate-400 uppercase">{item.target_role || 'All Passengers'}</b></span>
                      <span>•</span>
                      <span>Type: <b className="text-slate-400">{item.type}</b></span>
                      {item.bus_number && (
                        <>
                          <span>•</span>
                          <span>Bus: <b className="text-amber-400">{item.bus_number}</b></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono">
                  {item.created_at || 'Just now'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
