import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapView } from './MapView';
import { DelayNotificationModal } from './DelayNotificationModal';
import { 
  Bus, Navigation, Users, Clock, AlertTriangle, 
  CheckCircle2, ShieldAlert, PhoneCall, Radio, Play, Pause, AlertOctagon 
} from 'lucide-react';

export const DriverConsole: React.FC = () => {
  const { currentUser, buses, routes, sendDelayNotification } = useApp();
  const [tripActive, setTripActive] = useState(true);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(1);

  // Find driver's bus or default to Bus 12
  const driverBus = buses.find(b => b.driverName.includes(currentUser.name.split(' ')[0])) || buses[0];
  const busRoute = routes.find(r => r.id === driverBus.routeId) || routes[0];
  const [passengersBoarded, setPassengersBoarded] = useState(driverBus.currentOccupancy);

  const handleNextStop = () => {
    if (currentStopIndex < busRoute.stops.length - 1) {
      setCurrentStopIndex(prev => prev + 1);
    }
  };

  const handleSOS = () => {
    sendDelayNotification(
      busRoute.id, 
      driverBus.id, 
      30, 
      'EMERGENCY SOS: Driver reported technical obstruction / assistance dispatched'
    );
    alert('🚨 SOS Alert dispatched to Central Transport Control and Police Helpline.');
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-3 sm:p-6 space-y-5 text-slate-100">
      {/* Driver Header & Trip Control */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-extrabold text-base">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-white">{driverBus.busNumber}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                tripActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {tripActive ? 'Trip Active' : 'Depot Standby'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Driver: <b className="text-white">{currentUser.name}</b> • Route: {busRoute.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTripActive(!tripActive)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              tripActive ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500 text-slate-950 shadow-md'
            }`}
          >
            {tripActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{tripActive ? 'End Trip' : 'Start Scheduled Trip'}</span>
          </button>

          <button
            onClick={handleSOS}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-rose-600/30 transition animate-pulse"
            title="Emergency SOS Broadcast"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>SOS</span>
          </button>
        </div>
      </div>

      {/* Driver Quick Delay Broadcast Trigger */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Radio className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
          <div className="text-xs">
            <span className="font-extrabold text-white">Broadcast Delay to Passengers: </span>
            Stuck in bottleneck traffic? Alert students on this route immediately.
          </div>
        </div>
        <button
          onClick={() => setShowDelayModal(true)}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md whitespace-nowrap"
        >
          Push Delay Notice
        </button>
      </div>

      {/* Driver Map Preview */}
      <div className="space-y-2">
        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Live Route Trajectory</h4>
        <MapView heightClass="h-[300px]" showControls={false} focusedBusId={driverBus.id} />
      </div>

      {/* Occupancy & Live Speed Meter */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-medium">Passenger Headcount</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-white">{passengersBoarded} / {driverBus.capacity}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPassengersBoarded(prev => Math.max(0, prev - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold text-sm hover:bg-slate-700"
              >
                -
              </button>
              <button
                onClick={() => setPassengersBoarded(prev => Math.min(driverBus.capacity, prev + 1))}
                className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-medium">Speed Telemetry</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">{driverBus.speed} km/h</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
              GPS Normal
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming Stops Checklist */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-white">Stops Checklist ({busRoute.stops.length} Stops)</h4>
          <button
            onClick={handleNextStop}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold"
          >
            Mark Next Stop Arrived →
          </button>
        </div>

        <div className="space-y-2">
          {busRoute.stops.map((stop, index) => {
            const isCompleted = index < currentStopIndex;
            const isCurrent = index === currentStopIndex;

            return (
              <div
                key={stop.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                    : isCompleted
                      ? 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' : isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className={`font-bold text-xs ${isCurrent ? 'text-white' : ''}`}>{stop.name}</p>
                    <p className="text-[10px] text-slate-500">{stop.landmark}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-white">{stop.scheduledTime}</span>
                  <p className="text-[10px] text-amber-400 font-medium">{stop.studentCountWaiting} waiting</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showDelayModal && (
        <DelayNotificationModal
          defaultBusId={driverBus.id}
          onClose={() => setShowDelayModal(false)}
        />
      )}
    </div>
  );
};
