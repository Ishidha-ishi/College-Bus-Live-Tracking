import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Clock, Radio, Send, X } from 'lucide-react';

export const DelayNotificationModal: React.FC<{
  onClose: () => void;
  defaultBusId?: string;
}> = ({ onClose, defaultBusId }) => {
  const { routes, buses, sendDelayNotification } = useApp();

  const [selectedBusId, setSelectedBusId] = useState(defaultBusId || buses[0].id);
  const bus = buses.find(b => b.id === selectedBusId) || buses[0];
  const [selectedRouteId, setSelectedRouteId] = useState(bus.routeId);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [reason, setReason] = useState('Heavy traffic congestion on main arterial corridor');

  const presetReasons = [
    'Heavy traffic congestion on main arterial corridor',
    'Sudden mechanical maintenance / tyre check',
    'Road construction barricades and forced detour',
    'Severe rain waterlogging near underpass',
    'Emergency medical assistance provided to commuter',
  ];

  const handleBusChange = (busId: string) => {
    setSelectedBusId(busId);
    const b = buses.find(item => item.id === busId);
    if (b) setSelectedRouteId(b.routeId);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendDelayNotification(selectedRouteId, selectedBusId, delayMinutes, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Broadcast Delay Push Notification</h3>
              <p className="text-xs text-slate-400">Sends instant alert to all registered students & faculty</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-5 space-y-4">
          {/* Target Bus Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Affected Bus</label>
            <select
              value={selectedBusId}
              onChange={(e) => handleBusChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 font-semibold"
            >
              {buses.map(b => {
                const r = routes.find(item => item.id === b.routeId);
                return (
                  <option key={b.id} value={b.id}>
                    {b.busNumber} — {r?.code} ({r?.name}) - Driver: {b.driverName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Delay Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Estimated Delay Duration</span>
              <span className="text-amber-400 font-extrabold">+{delayMinutes} Minutes</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[5, 10, 15, 25, 40].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDelayMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    delayMinutes === mins
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>+{mins}m</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preset quick reasons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Reason Template</label>
            <div className="flex flex-wrap gap-1.5">
              {presetReasons.map((pReason) => (
                <button
                  key={pReason}
                  type="button"
                  onClick={() => setReason(pReason)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border text-left transition ${
                    reason === pReason
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pReason}
                </button>
              ))}
            </div>
          </div>

          {/* Reason text */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Notification Message Preview</label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Broadcast alert preview box */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="leading-snug text-[11px]">
              This notification will immediately trigger push banners and arrival recalculations on all passenger devices for this route.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 font-extrabold text-xs text-slate-950 shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
