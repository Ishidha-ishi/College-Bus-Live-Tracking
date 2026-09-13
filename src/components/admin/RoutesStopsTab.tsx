import React, { useState } from 'react';
import { Navigation, MapPin, Plus, Clock, ChevronDown, ChevronUp, Trash2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface RoutesStopsTabProps {
  routes: any[];
  onRefresh: () => void;
}

export const RoutesStopsTab: React.FC<RoutesStopsTabProps> = ({
  routes,
  onRefresh,
}) => {
  const [expandedRouteId, setExpandedRouteId] = useState<string>(routes[0]?.id || '');
  const [showAddStopModal, setShowAddStopModal] = useState<string | null>(null);

  // New Stop form
  const [stopName, setStopName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [morningPickup, setMorningPickup] = useState('07:45 AM');
  const [eveningDrop, setEveningDrop] = useState('05:15 PM');
  const [lat, setLat] = useState('11.6643');
  const [lng, setLng] = useState('78.1460');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddStopModal || !stopName.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedRoute = routes.find(r => r.id === showAddStopModal);
      const nextSequence = (selectedRoute?.stops?.length || 0) + 1;

      await api.routes.addStop(showAddStopModal, {
        stopName: stopName.trim(),
        landmark: landmark.trim(),
        latitude: parseFloat(lat) || 11.6643,
        longitude: parseFloat(lng) || 78.1460,
        stopSequence: nextSequence,
        morningPickupTime: morningPickup,
        eveningDropTime: eveningDrop,
      });

      setShowAddStopModal(null);
      setStopName('');
      setLandmark('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add stop');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    if (!confirm('Are you sure you want to remove this stop from the route?')) return;
    try {
      await api.routes.deleteStop(stopId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete stop');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-400" />
            <span>Campus Transit Corridors & Stop Management</span>
          </h3>
          <p className="text-xs text-slate-400">
            Configure pickup timing sequences, geolocation waypoints, and landmark checkpoints
          </p>
        </div>
      </div>

      {/* Routes List */}
      <div className="space-y-3">
        {routes.map((route) => {
          const isExpanded = expandedRouteId === route.id;
          const stops = route.stops || [];

          return (
            <div
              key={route.id}
              className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl"
            >
              {/* Route Summary Row */}
              <div
                onClick={() => setExpandedRouteId(isExpanded ? '' : route.id)}
                className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-850 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-12 rounded-full"
                    style={{ backgroundColor: route.color || '#F59E0B' }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-white text-base">
                        {route.route_code || route.code}
                      </span>
                      <span className="text-sm font-bold text-slate-200">
                        {route.route_name || route.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{route.start_location || route.startPoint}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span>{route.end_location || route.destination}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-white">{stops.length} Bus Stops</p>
                    <p className="text-slate-400">{route.total_distance_km || 22} km • ~{route.estimated_duration_mins || 45} mins</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddStopModal(route.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Stop</span>
                    </button>

                    <button className="p-2 rounded-xl bg-slate-800 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Stops Sequence */}
              {isExpanded && (
                <div className="p-5 bg-slate-950/70 border-t border-slate-800 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <h5 className="font-bold text-slate-300 uppercase tracking-wider">
                      Stops Sequence & Scheduled Times
                    </h5>
                    <span className="text-[11px] text-amber-400 font-medium">
                      Morning Arrival at Campus: 08:30 AM
                    </span>
                  </div>

                  <div className="space-y-2">
                    {stops.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 text-center">No stops configured for this route.</p>
                    ) : (
                      stops.map((stop: any, idx: number) => (
                        <div
                          key={stop.id}
                          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold flex items-center justify-center shrink-0">
                              {stop.stop_sequence || idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{stop.stop_name || stop.name}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                <span>{stop.landmark || 'Salem Highway'}</span>
                                <span className="font-mono text-slate-600">
                                  ({stop.latitude ? stop.latitude.toFixed(4) : '11.66'}, {stop.longitude ? stop.longitude.toFixed(4) : '78.14'})
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 font-mono">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                                Pickup: {stop.morning_pickup_time || stop.scheduledTime || '07:35 AM'}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[11px]">
                                Drop: {stop.evening_drop_time || '05:00 PM'}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteStop(stop.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="Delete Stop"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Stop Modal */}
      {showAddStopModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 animate-fadeIn shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <span>Add Stop to Corridor</span>
            </h4>

            <form onSubmit={handleAddStop} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Stop Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hasthampatti Roundabout"
                  value={stopName}
                  onChange={(e) => setStopName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Landmark / Waiting Area</label>
                <input
                  type="text"
                  placeholder="e.g. Opposite State Bank of India"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Morning Pickup</label>
                  <input
                    type="text"
                    value={morningPickup}
                    onChange={(e) => setMorningPickup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Evening Drop</label>
                  <input
                    type="text"
                    value={eveningDrop}
                    onChange={(e) => setEveningDrop(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStopModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow"
                >
                  Save Bus Stop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
