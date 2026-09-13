import React, { useState } from 'react';
import { Briefcase, Users, Star, Phone, Mail, Shield, Bus, MapPin, Award } from 'lucide-react';

interface StaffDriverDatabaseTabProps {
  staffList: any[];
  driverList: any[];
}

export const StaffDriverDatabaseTab: React.FC<StaffDriverDatabaseTabProps> = ({
  staffList,
  driverList,
}) => {
  const [subTab, setSubTab] = useState<'drivers' | 'staff'>('drivers');

  return (
    <div className="space-y-4">
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>Staff & Driver Transport Directory</span>
          </h3>
          <p className="text-xs text-slate-400">
            Certified campus bus captains, heavy motor vehicle licenses, and faculty transport allocations
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSubTab('drivers')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
              subTab === 'drivers'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bus Drivers ({driverList.length})
          </button>
          <button
            onClick={() => setSubTab('staff')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
              subTab === 'staff'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Faculty & Staff ({staffList.length})
          </button>
        </div>
      </div>

      {/* DRIVERS DIRECTORY */}
      {subTab === 'drivers' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Driver Identity</th>
                  <th className="p-3.5">License Number</th>
                  <th className="p-3.5">Experience</th>
                  <th className="p-3.5">Assigned Bus</th>
                  <th className="p-3.5">Route</th>
                  <th className="p-3.5">Phone & Emergency</th>
                  <th className="p-3.5">Safety Rating</th>
                  <th className="p-3.5 text-right">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {driverList.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center text-xs">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{driver.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {driver.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-white font-bold">
                      {driver.license_number}
                    </td>

                    <td className="p-3.5 text-slate-300">
                      {driver.experience_years} Years
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Bus className="w-3.5 h-3.5" />
                        <span>{driver.bus_number || 'Depot Standby'}</span>
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-300">
                      {driver.route_code ? `${driver.route_code}: ${driver.route_name?.split('&')[0]}` : 'Flexible'}
                    </td>

                    <td className="p-3.5 font-mono text-slate-300">
                      <p>{driver.phone}</p>
                      <p className="text-[10px] text-rose-400">Emergency: {driver.emergency_contact || 'Campus Control'}</p>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{driver.rating?.toFixed(1) || '4.9'}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                        {driver.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FACULTY / STAFF DIRECTORY */}
      {subTab === 'staff' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Staff Member</th>
                  <th className="p-3.5">Employee ID</th>
                  <th className="p-3.5">Department & Designation</th>
                  <th className="p-3.5">Assigned Bus & Route</th>
                  <th className="p-3.5">Boarding Stop</th>
                  <th className="p-3.5">Phone & Email</th>
                  <th className="p-3.5 text-right">Transport Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xs">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{staff.name}</p>
                          <p className="text-[10px] text-slate-400">{staff.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-white font-bold">
                      {staff.employee_id}
                    </td>

                    <td className="p-3.5">
                      <p className="text-white font-medium">{staff.department}</p>
                      <p className="text-[10px] text-slate-400">{staff.designation}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-amber-400">{staff.bus_number || 'Bus #02'}</p>
                      <p className="text-[10px] text-slate-400">{staff.route_code || 'R-02'}</p>
                    </td>

                    <td className="p-3.5 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{staff.stop_name || 'Alagapuram'}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-300">
                      {staff.phone}
                    </td>

                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {staff.pass_status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
