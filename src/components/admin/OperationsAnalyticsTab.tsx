import React from 'react';
import { 
  TrendingUp, Clock, Users, Bus, Navigation, 
  CheckCircle2, AlertTriangle, ShieldCheck, Download 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend 
} from 'recharts';

interface OperationsAnalyticsTabProps {
  buses: any[];
  routes: any[];
  students: any[];
}

export const OperationsAnalyticsTab: React.FC<OperationsAnalyticsTabProps> = ({
  buses,
  routes,
  students,
}) => {
  // Bus Occupancy Chart Data
  const busOccupancyData = buses.map(b => ({
    name: b.bus_number || b.busNumber,
    occupancy: b.current_occupancy || b.currentOccupancy || 0,
    capacity: b.capacity || 48,
  }));

  // Route Passengers Data
  const routeStudentsData = routes.map(r => {
    const count = students.filter(s => s.route_id === r.id || s.route_code === (r.route_code || r.code)).length;
    return {
      name: r.route_code || r.code,
      students: count,
    };
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div>
        <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span>Operational Intelligence & Fleet Analytics</span>
        </h3>
        <p className="text-xs text-slate-400">
          Capacity utilization telemetry, corridor demand, and on-time transit performance metrics
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Fleet Capacity Utilization
          </span>
          <p className="text-2xl font-black text-emerald-400">82.4%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Optimal seat filling</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Average Commute ETA
          </span>
          <p className="text-2xl font-black text-white">41 mins</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Across all 4 Salem corridors</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            On-Time Arrival Rate
          </span>
          <p className="text-2xl font-black text-amber-400">94.8%</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">+1.2% this month</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Fuel & Maintenance Index
          </span>
          <p className="text-2xl font-black text-white">Normal</p>
          <p className="text-[10px] text-slate-400 mt-0.5">All 4 buses GPS audited</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fleet Utilization BarChart */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Bus className="w-4 h-4 text-amber-400" />
              <span>Bus Capacity vs Live Occupancy (Headcount)</span>
            </h4>
            <span className="text-[11px] text-slate-500">Live GPS</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={busOccupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="occupancy" name="Current Passengers" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacity" name="Max Capacity" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Route Passenger Demand */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-indigo-400" />
              <span>Corridor Passenger Allocation</span>
            </h4>
            <span className="text-[11px] text-slate-500">Enrolled Students</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeStudentsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="students" name="Registered Students" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
