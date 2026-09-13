import React, { useState } from 'react';
import { Bus, Plus, Users, MapPin, Gauge, Radio, Shield, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { api } from '../../services/api';

interface FleetBusesTabProps {
  buses: any[];
  routes: any[];
  drivers: any[];
  onRefresh: () => void;
  onOpenDelayBroadcast: (busId?: string) => void;
}

export const FleetBusesTab: React.FC<FleetBusesTabProps> = ({
  buses,
  routes,
  drivers,
  onRefresh,
  onOpenDelayBroadcast,
}) => {
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [busNumber, setBusNumber] = useState('');
  const [registration, setRegistration] = useState('TN-30-AA-');
  const [capacity, setCapacity] = useState(48);
  const [driverId, setDriverId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busNumber.trim() || !registration.trim()) {
      alert('Bus number and registration are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.buses.create({
        busNumber: busNumber.trim(),
        registrationNumber: registration.trim(),
        capacity: Number(capacity),
        assignedDriverId: driverId || undefined,
        assignedRouteId: routeId || undefined,
      });
      setShowAddBusModal(false);
      setBusNumber('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create bus');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (bus: any) => {
    const newStatus = bus.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    try {
      await api.buses.update(bus.id, { status: newStatus });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update bus status');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <Bus className="w-5 h-5 text-amber-400" />
            <span>Campus Fleet Management & Bus Database</span>
          </h3>
          <p className="text-xs text-slate-400">
            Monitor bus telemetry, fleet capacities, and active driver-to-route assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenDelayBroadcast()}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Broadcast Delay</span>
          </button>

          <button
            onClick={() => setShowAddBusModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Fleet Bus</span>
          </button>
        </div>
      </div>

      {/* Buses Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buses.map((bus) => {
          const occupancy = bus.current_occupancy || bus.currentOccupancy || 0;
          const cap = bus.capacity || 48;
          const pct = Math.round((occupancy / cap) * 100);
          const isActive = bus.status === 'ACTIVE';

          return (
            <div
              key={bus.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition"
            >
              {/* Bus Card Top */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-lg">
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-white">{bus.bus_number || bus.busNumber}</h4>
                    <p className="text-xs text-slate-400 font-mono">{bus.registration_number || bus.registrationNumber}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {bus.status || 'ACTIVE'}
                </span>
              </div>

              {/* Assignment details */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Assigned Driver:</span>
                  <span className="text-white font-bold">{bus.driver_name || bus.driverName || 'Depot Standby'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Assigned Route:</span>
                  <span className="text-amber-400 font-semibold">
                    {bus.route_code ? `${bus.route_code}: ${bus.route_name?.split('&')[0]}` : 'General Depot'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Speed Telemetry:</span>
                  <span className="text-white font-mono">{bus.speed || 0} km/h (Live GPS)</span>
                </div>
              </div>

              {/* Occupancy Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Passenger Occupancy</span>
                  <span className="text-white font-bold">{occupancy} / {cap} Seats ({pct}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2 text-xs">
                <button
                  onClick={() => handleToggleStatus(bus)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{isActive ? 'Mark Maintenance' : 'Set Active'}</span>
                </button>

                <button
                  onClick={() => onOpenDelayBroadcast(bus.id)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Push Delay</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Bus Modal */}
      {showAddBusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 animate-fadeIn shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Bus className="w-5 h-5 text-amber-400" />
              <span>Register New Fleet Bus</span>
            </h4>

            <form onSubmit={handleCreateBus} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Bus Number (Identifier)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bus #05"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">RTO Registration Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TN-30-AA-1005"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assign Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Standby / No Driver Assigned --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} (License: {d.license_number || 'Valid'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assign Route</label>
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- No Route Assigned --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.route_code || r.code}: {r.route_name || r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBusModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow"
                >
                  Register Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
