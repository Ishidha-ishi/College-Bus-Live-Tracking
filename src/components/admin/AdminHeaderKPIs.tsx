import React from 'react';
import { 
  Users, Bus, Navigation, CreditCard, ShieldAlert, 
  Clock, CheckCircle2, AlertTriangle, GraduationCap, Briefcase 
} from 'lucide-react';

interface AdminHeaderKPIsProps {
  studentCount: number;
  staffCount: number;
  driverCount: number;
  totalBuses: number;
  activeBuses: number;
  totalRoutes: number;
  totalFeeCollected: number;
  totalFeePending: number;
  overdueCount: number;
  delayedBusesCount: number;
  onTimeRate: number;
}

export const AdminHeaderKPIs: React.FC<AdminHeaderKPIsProps> = ({
  studentCount,
  staffCount,
  driverCount,
  totalBuses,
  activeBuses,
  totalRoutes,
  totalFeeCollected,
  totalFeePending,
  overdueCount,
  delayedBusesCount,
  onTimeRate,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
      {/* 1. Total Students */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Students</span>
          <GraduationCap className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-xl font-black text-white">{studentCount}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Enrolled Passengers</p>
      </div>

      {/* 2. Staff */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Staff</span>
          <Briefcase className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-xl font-black text-white">{staffCount}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Faculty Passes</p>
      </div>

      {/* 3. Drivers */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Drivers</span>
          <Users className="w-4 h-4 text-sky-400" />
        </div>
        <p className="text-xl font-black text-white">{driverCount}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Licensed Crew</p>
      </div>

      {/* 4. Buses (Fleet) */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Fleet Buses</span>
          <Bus className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-xl font-black text-white">{totalBuses}</p>
        <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{activeBuses} in transit</p>
      </div>

      {/* 5. Active Routes */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Routes</span>
          <Navigation className="w-4 h-4 text-indigo-400" />
        </div>
        <p className="text-xl font-black text-white">{totalRoutes}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Campus Corridors</p>
      </div>

      {/* 6. Fees Collected */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Fees Paid</span>
          <CreditCard className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-xl font-black text-emerald-400">₹{(totalFeeCollected / 1000).toFixed(0)}k</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Realized Revenue</p>
      </div>

      {/* 7. Fees Pending */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Pending</span>
          <CreditCard className="w-4 h-4 text-rose-400" />
        </div>
        <p className="text-xl font-black text-rose-400">₹{(totalFeePending / 1000).toFixed(0)}k</p>
        <p className="text-[10px] text-rose-400 font-bold mt-0.5">{overdueCount} Overdue</p>
      </div>

      {/* 8. On-Time Reliability */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">On-Time</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-xl font-black text-amber-400">{onTimeRate}%</p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {delayedBusesCount > 0 ? `${delayedBusesCount} delayed` : 'Full Fleet On-Time'}
        </p>
      </div>
    </div>
  );
};
