import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IncidentCategory } from '../types';
import { 
  AlertOctagon, Clock, ShieldAlert, Wrench, Navigation, 
  Sparkles, PackageSearch, Users, MessageSquare, X, Send 
} from 'lucide-react';

export const IncidentModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { currentUser, routes, buses, reportIncident } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('delay');
  const [routeId, setRouteId] = useState(currentUser.assignedRouteId || routes[0].id);
  const [busId, setBusId] = useState(buses[0].id);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [description, setDescription] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  const categories: { id: IncidentCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'delay', label: 'Heavy Delay / Traffic', icon: <Clock className="w-4 h-4" /> },
    { id: 'rash_driving', label: 'Rash / Overspeeding', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'breakdown', label: 'Engine / Mechanical Breakdown', icon: <Wrench className="w-4 h-4" /> },
    { id: 'cleanliness_ac', label: 'Cleanliness / AC Failure', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'route_deviation', label: 'Route Deviation / Skipped Stop', icon: <Navigation className="w-4 h-4" /> },
    { id: 'lost_and_found', label: 'Lost & Found Property', icon: <PackageSearch className="w-4 h-4" /> },
    { id: 'overcrowding', label: 'Severe Overcrowding', icon: <Users className="w-4 h-4" /> },
    { id: 'other', label: 'Other Grievance', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    reportIncident({
      title,
      category,
      description: hasPhoto ? `${description} [1 Photo Evidence Attached]` : description,
      routeId,
      busId,
      reportedByUserId: currentUser.id,
      reporterName: currentUser.name,
      reporterRole: currentUser.role,
      reporterPhone: currentUser.phone,
      priority,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Report Transit Incident / Feedback</h3>
              <p className="text-xs text-slate-400">Direct transmission to Transport Administration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 text-left transition ${
                    category === cat.id
                      ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className={category === cat.id ? 'text-rose-400' : 'text-slate-500'}>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Issue Headline</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Bus bypassed South Gate without halting"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Route & Bus selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Affected Route</label>
              <select
                value={routeId}
                onChange={(e) => {
                  setRouteId(e.target.value);
                  const bus = buses.find(b => b.routeId === e.target.value);
                  if (bus) setBusId(bus.id);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none"
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Vehicle / Bus</label>
              <select
                value={busId}
                onChange={(e) => setBusId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none"
              >
                {buses.map(b => (
                  <option key={b.id} value={b.id}>{b.busNumber}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority selector */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Urgency Level</label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    priority === p
                      ? p === 'urgent'
                        ? 'bg-rose-500 text-white'
                        : p === 'high'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-700 text-white ring-1 ring-white/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Detailed Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe exact time, stop location, license plate, driver details or specific assistance needed..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Photo attachment mock */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <p className="font-semibold text-white">Attach Photo or Video</p>
              <p className="text-[11px] text-slate-400">Helps administration verify vehicle condition</p>
            </div>
            <button
              type="button"
              onClick={() => setHasPhoto(!hasPhoto)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                hasPhoto ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {hasPhoto ? '✓ 1 Image Added' : '+ Add Photo'}
            </button>
          </div>

          {/* Reporter verification preview */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Reporting as: <b className="text-white">{currentUser.name} ({currentUser.studentOrStaffId})</b></span>
            <span>Callback: <b className="text-white">{currentUser.phone}</b></span>
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
              className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 font-extrabold text-xs text-white shadow-lg shadow-rose-500/20 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
