import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapView } from './MapView';
import { DelayNotificationModal } from './DelayNotificationModal';
import { 
  Bus, Users, CreditCard, ShieldAlert, History, AlertTriangle, 
  CheckCircle2, Clock, Search, Filter, Download, Plus, 
  Send, RefreshCw, Eye, UserPlus, Phone, Calendar, ArrowUpRight 
} from 'lucide-react';
import { User, IncidentStatus, FeePaymentStatus } from '../types';

export const AdminDashboard: React.FC = () => {
  const { 
    buses, 
    routes, 
    users, 
    fees, 
    incidents, 
    travelLogs, 
    triggerMonthEndFeeReminders,
    triggerSingleFeeReminder,
    updateIncidentStatus,
    addUser,
    updateUser,
    deleteUser,
    payBusFee,
    sendDelayNotification,
    setIsRegistrationOpen
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'fleet' | 'fees' | 'users' | 'logs' | 'incidents'>('fleet');
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedBusForDelay, setSelectedBusForDelay] = useState<string | undefined>(undefined);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Filters & Search states
  const [feeFilter, setFeeFilter] = useState<FeePaymentStatus | 'all'>('all');
  const [feeSearch, setFeeSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [logSearch, setLogSearch] = useState('');

  // Selected incident for resolution notes
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // New User Form State
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'student',
    phone: '',
    studentOrStaffId: '',
    assignedRouteId: routes[0]?.id,
    assignedStopId: routes[0]?.stops[0]?.id,
    departmentOrClass: 'B.Tech CS',
    feeStatus: 'pending',
    feeAmount: 3200,
    feeDueDate: '2026-09-30',
    avatar: '',
    status: 'active',
  });

  // Calculate high-level audit analytics
  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalBuses = buses.length;
  const delayedBusesCount = buses.filter(b => b.delayMinutes > 0).length;
  const openIncidentsCount = incidents.filter(i => i.status !== 'resolved').length;
  
  const totalFeeCollected = fees.reduce((acc, f) => acc + f.paidAmount, 0);
  const totalFeeExpected = fees.reduce((acc, f) => acc + f.totalAmount, 0);
  const overdueFeesCount = fees.filter(f => f.status === 'overdue').length;

  const onTimeTrips = travelLogs.filter(l => l.status === 'on_time').length;
  const onTimePercentage = Math.round((onTimeTrips / (travelLogs.length || 1)) * 100);

  // Month-end reminder trigger handler
  const handleTriggerMonthEndReminders = () => {
    const res = triggerMonthEndFeeReminders();
    alert(`📢 Month-End Fee Reminder successfully dispatched to ${res.sentCount} students with pending or overdue fee accounts!`);
  };

  // Add user submission
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.studentOrStaffId) return;

    addUser({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || 'student',
      phone: newUser.phone || '+91 98450 00000',
      studentOrStaffId: newUser.studentOrStaffId,
      assignedRouteId: newUser.assignedRouteId || routes[0].id,
      assignedStopId: newUser.assignedStopId || routes[0].stops[0].id,
      departmentOrClass: newUser.departmentOrClass || 'General',
      feeStatus: newUser.feeStatus || 'pending',
      feeAmount: newUser.feeAmount || 3200,
      feeDueDate: newUser.feeDueDate || '2026-09-30',
      avatar: '',
      status: 'active',
    });

    setShowAddUserModal(false);
  };

  // CSV Exporters
  const exportFeesCSV = () => {
    const headers = 'Student ID,Name,Email,Route,Academic Term,Total Amount,Paid Amount,Status,Due Date,Transaction Ref\n';
    const rows = fees.map(f => `"${f.studentId}","${f.studentName}","${f.studentEmail}","${f.routeName}","${f.academicTerm}",${f.totalAmount},${f.paidAmount},"${f.status}","${f.dueDate}","${f.transactionId || 'N/A'}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bus_Fee_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportTravelLogsCSV = () => {
    const headers = 'Trip Date,Bus Number,Route Name,Driver Name,Departure Time,Arrival Time,Status,Delay Mins,Passengers,Incidents\n';
    const rows = travelLogs.map(l => `"${l.tripDate}","${l.busNumber}","${l.routeName}","${l.driverName}","${l.departureTime}","${l.arrivalTime}","${l.status}",${l.delayMinutes},${l.totalPassengers},${l.incidentsLogged}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fleet_Travel_Logs_Audit_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-3 sm:p-6 space-y-6">
      {/* Admin Quick Metrics & Month-End Action Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Fleet in Transit</p>
            <h3 className="text-2xl font-black text-white mt-1">{totalBuses} Active</h3>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              {delayedBusesCount > 0 ? `${delayedBusesCount} delayed` : 'All on time'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Bus className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">On-Time Reliability</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{onTimePercentage}%</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Audit log analysis</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Fee Status with Month-End reminder shortcut */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Fee Collection</p>
            <h3 className="text-2xl font-black text-white mt-1">₹{(totalFeeCollected / 1000).toFixed(1)}k</h3>
            <p className="text-[11px] text-rose-400 font-bold mt-0.5">
              {overdueFeesCount} students overdue
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Safety Incidents</p>
            <h3 className="text-2xl font-black text-white mt-1">{openIncidentsCount} Open</h3>
            <p className="text-[11px] text-amber-400 mt-0.5">Requires review</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Global Administrative Actions Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">Month-End Automated Fee Reminders</h4>
            <p className="text-xs text-slate-400">Dispatch push alert and portal notifications to all overdue accounts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-broadcast-delay-admin"
            onClick={() => {
              setSelectedBusForDelay(undefined);
              setShowDelayModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>Broadcast Delay Alert</span>
          </button>

          <button
            id="btn-trigger-month-end-reminders"
            onClick={handleTriggerMonthEndReminders}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-black shadow-lg shadow-rose-500/20 transition flex items-center gap-2"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Trigger Month-End Reminders ({overdueFeesCount})</span>
          </button>
        </div>
      </div>

      {/* Admin Section Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: 'fleet', label: 'Live Fleet Tracking', icon: <Bus className="w-4 h-4" /> },
          { id: 'fees', label: 'Bus Fee Management', icon: <CreditCard className="w-4 h-4" />, badge: overdueFeesCount },
          { id: 'users', label: 'User Directory & Auth', icon: <Users className="w-4 h-4" /> },
          { id: 'logs', label: 'Travel Logs & Auditing', icon: <History className="w-4 h-4" /> },
          { id: 'incidents', label: 'Incident & Feedback Desk', icon: <ShieldAlert className="w-4 h-4" />, badge: openIncidentsCount },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`admin-tab-${tab.id}`}
            onClick={() => setActiveAdminTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap ${
              activeAdminTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 ? (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeAdminTab === tab.id ? 'bg-slate-950 text-white' : 'bg-rose-500 text-white'
              }`}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* TAB 1: FLEET LIVE COMMAND */}
      {activeAdminTab === 'fleet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Map View */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Fleet GPS Positioning & Route Trajectories
              </h4>
              <span className="text-xs text-slate-400">Updates every 1.5s</span>
            </div>
            <MapView heightClass="h-[540px]" showControls={true} />
          </div>

          {/* Bus Cards List */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white">Active Vehicle Telemetry</h4>
            <div className="space-y-3">
              {buses.map((bus) => {
                const route = routes.find(r => r.id === bus.routeId);
                const isDelayed = bus.delayMinutes > 0;

                return (
                  <div 
                    key={bus.id}
                    className={`p-4 rounded-2xl border transition ${
                      isDelayed 
                        ? 'bg-rose-950/20 border-rose-500/30' 
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-sm text-white">{bus.busNumber}</h5>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isDelayed ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {isDelayed ? `+${bus.delayMinutes}m Delayed` : 'On Route'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{route?.name}</p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedBusForDelay(bus.id);
                          setShowDelayModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition"
                      >
                        Push Alert
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500">Driver</span>
                        <p className="font-bold text-white truncate">{bus.driverName}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Speed / Occupancy</span>
                        <p className="font-bold text-amber-400 font-mono">
                          {bus.speed} km/h • {bus.currentOccupancy}/{bus.capacity}
                        </p>
                      </div>
                    </div>

                    {bus.delayReason && (
                      <p className="mt-2 text-[11px] text-rose-300 bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20">
                        <b>Cause:</b> {bus.delayReason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUS FEE MANAGEMENT & MONTH-END ENGINE */}
      {activeAdminTab === 'fees' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-base text-white">Student Transport Fee Ledger</h4>
              <p className="text-xs text-slate-400">Audit bus pass payments, track arrears, and send month-end fee reminders</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportFeesCSV}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Fee Ledger CSV</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search student, email, ID, or route..."
                value={feeSearch}
                onChange={(e) => setFeeSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['all', 'paid', 'pending', 'overdue'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFeeFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    feeFilter === status
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Fees Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Assigned Route</th>
                    <th className="p-3.5">Term Amount</th>
                    <th className="p-3.5">Payment Status</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Reminders Sent</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {fees
                    .filter(f => feeFilter === 'all' || f.status === feeFilter)
                    .filter(f => 
                      f.studentName.toLowerCase().includes(feeSearch.toLowerCase()) ||
                      f.studentId.toLowerCase().includes(feeSearch.toLowerCase()) ||
                      f.routeName.toLowerCase().includes(feeSearch.toLowerCase())
                    )
                    .map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <p className="font-bold text-white">{fee.studentName}</p>
                          <p className="text-[10px] text-slate-400">{fee.studentId} • {fee.studentEmail}</p>
                        </td>
                        <td className="p-3.5 font-medium">{fee.routeName}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-white font-mono">₹{fee.totalAmount}</p>
                          <p className="text-[10px] text-emerald-400 font-mono">Paid: ₹{fee.paidAmount}</p>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            fee.status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : fee.status === 'overdue'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{fee.dueDate}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-white">{fee.remindersSentCount} alerts</span>
                          {fee.lastReminderDate && (
                            <p className="text-[10px] text-slate-500">Last: {fee.lastReminderDate}</p>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {fee.status !== 'paid' ? (
                            <>
                              <button
                                onClick={() => triggerSingleFeeReminder(fee.id)}
                                title="Dispatch single reminder notice"
                                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold"
                              >
                                Send Reminder
                              </button>
                              <button
                                onClick={() => payBusFee(fee.id, 'Cash at Transport Bureau')}
                                title="Mark as paid at counter"
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold"
                              >
                                Mark Paid
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-semibold">✓ Pass Cleared</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER DIRECTORY & AUTHENTICATION DATABASE */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-base text-white">Registered Accounts & Role Authentication</h4>
              <p className="text-xs text-slate-400">Manage credentials, student pass assignments, and permissions</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-realtime-register-admin"
                onClick={() => setIsRegistrationOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Real-Time Pass Register</span>
              </button>
              <button
                id="btn-add-new-user"
                onClick={() => setShowAddUserModal(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>+ Quick Add</span>
              </button>
            </div>
          </div>

          {/* User Filter & Search */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {['all', 'student', 'staff', 'driver', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setUserRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    userRoleFilter === role
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">User Identity</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Dept / ID</th>
                    <th className="p-3.5">Assigned Route & Stop</th>
                    <th className="p-3.5">Fee Status</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5 text-right">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users
                    .filter(u => userRoleFilter === 'all' || u.role === userRoleFilter)
                    .filter(u => 
                      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.studentOrStaffId.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map((user) => {
                      const userRoute = routes.find(r => r.id === user.assignedRouteId);
                      const userStop = userRoute?.stops.find(s => s.id === user.assignedStopId);

                      return (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                              {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <p className="font-bold text-white">{user.name}</p>
                              <p className="text-[10px] text-slate-400">{user.email}</p>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-amber-300">
                              {user.role}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <p className="font-mono text-white font-bold">{user.studentOrStaffId}</p>
                            <p className="text-[10px] text-slate-400">{user.departmentOrClass}</p>
                          </td>
                          <td className="p-3.5">
                            {userRoute ? (
                              <div>
                                <p className="font-semibold text-white">{userRoute.code} ({userRoute.name.split('&')[0]})</p>
                                <p className="text-[10px] text-slate-400">{userStop?.name || 'Main Gate'}</p>
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {user.role === 'student' ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                user.feeStatus === 'paid'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : user.feeStatus === 'overdue'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {user.feeStatus}
                              </span>
                            ) : (
                              <span className="text-slate-500">Exempt</span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-slate-400">{user.phone}</td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => updateUser(user.id, { status: user.status === 'active' ? 'suspended' : 'active' })}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                                user.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-rose-500/20 hover:text-rose-300'
                                  : 'bg-rose-500/20 text-rose-400 hover:bg-emerald-500/20 hover:text-emerald-300'
                              }`}
                            >
                              {user.status}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TRAVEL LOGS & AUDITING */}
      {activeAdminTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-base text-white">Administrative Travel Audit Logs</h4>
              <p className="text-xs text-slate-400">Historical performance auditing for compliance and regulatory reporting</p>
            </div>

            <button
              onClick={exportTravelLogsCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Logs CSV</span>
            </button>
          </div>

          {/* Audit Metrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Logged Trips</p>
              <h4 className="text-xl font-bold text-white mt-1">{travelLogs.length} Completed Runs</h4>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Average Fleet Delay</p>
              <h4 className="text-xl font-bold text-amber-400 mt-1">
                {Math.round(travelLogs.reduce((acc, l) => acc + l.delayMinutes, 0) / (travelLogs.length || 1))} mins
              </h4>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Passenger Commute Volume</p>
              <h4 className="text-xl font-bold text-emerald-400 mt-1">
                {travelLogs.reduce((acc, l) => acc + l.totalPassengers, 0)} boarding counts
              </h4>
            </div>
          </div>

          {/* Travel Logs Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Bus & Route</th>
                    <th className="p-3.5">Driver</th>
                    <th className="p-3.5">Departure</th>
                    <th className="p-3.5">Scheduled vs Actual Arrival</th>
                    <th className="p-3.5">Delay (Mins)</th>
                    <th className="p-3.5">Passengers</th>
                    <th className="p-3.5 text-right">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {travelLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-slate-400">{log.tripDate}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-white">{log.busNumber}</p>
                        <p className="text-[10px] text-slate-400">{log.routeName}</p>
                      </td>
                      <td className="p-3.5 font-semibold text-white">{log.driverName}</td>
                      <td className="p-3.5 font-mono text-slate-400">{log.departureTime}</td>
                      <td className="p-3.5 font-mono">
                        <span className="text-slate-400">{log.scheduledArrival}</span>
                        <span className="mx-1 text-slate-600">→</span>
                        <span className="text-white font-bold">{log.arrivalTime}</span>
                      </td>
                      <td className="p-3.5 font-mono">
                        {log.delayMinutes > 0 ? (
                          <span className="text-rose-400 font-bold">+{log.delayMinutes}m delay</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">0m (On Time)</span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-white">{log.totalPassengers} students</td>
                      <td className="p-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          log.status === 'on_time' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {log.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INCIDENT & FEEDBACK DESK */}
      {activeAdminTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-base text-white">Transit Grievances & Incident Reports</h4>
              <p className="text-xs text-slate-400">Triage reported passenger delays, maintenance issues, and driver reviews</p>
            </div>

            <div className="flex items-center gap-1.5">
              {(['all', 'open', 'investigating', 'resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setIncidentStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    incidentStatusFilter === st
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents
              .filter(i => incidentStatusFilter === 'all' || i.status === incidentStatusFilter)
              .map((inc) => (
                <div key={inc.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inc.priority === 'urgent'
                            ? 'bg-rose-500 text-white'
                            : inc.priority === 'high'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                        }`}>
                          {inc.priority} priority
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{inc.timestamp}</span>
                      </div>
                      <h5 className="font-bold text-sm text-white mt-1.5">{inc.title}</h5>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      inc.status === 'resolved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : inc.status === 'investigating'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {inc.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Reported by: <b className="text-white">{inc.reporterName} ({inc.reporterRole})</b></span>
                    <span>Callback: <b className="text-white">{inc.reporterPhone}</b></span>
                  </div>

                  {inc.adminNotes && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                      <b>Resolution note:</b> {inc.adminNotes}
                    </div>
                  )}

                  {/* Actions for Admin */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Update Status:</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          const note = prompt('Enter resolution or update note for passenger:', inc.adminNotes || '');
                          if (note !== null) updateIncidentStatus(inc.id, 'investigating', note);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-bold uppercase"
                      >
                        Investigating
                      </button>
                      <button
                        onClick={() => {
                          const note = prompt('Enter resolution note sent to student:', 'Issue inspected and rectified by depot supervisor.');
                          if (note !== null) updateIncidentStatus(inc.id, 'resolved', note);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase"
                      >
                        Resolve & Notify
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* Broadcast Delay Modal */}
      {showDelayModal && (
        <DelayNotificationModal
          defaultBusId={selectedBusForDelay}
          onClose={() => setShowDelayModal(false)}
        />
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-4">Register New Account & Route Pass</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Full Name (Tamil Nadu)</label>
                <input
                  required
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Karthik Selvam / Ananya S."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">Email Address</label>
                  <input
                    required
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="karthik.selvam@student.campus.edu.in"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">System Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs mt-1"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff / Faculty</option>
                    <option value="driver">Driver</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">Anna Univ Reg No. / Staff ID</label>
                  <input
                    required
                    type="text"
                    value={newUser.studentOrStaffId}
                    onChange={e => setNewUser({ ...newUser, studentOrStaffId: e.target.value })}
                    placeholder="e.g. 710023104088"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Mobile Phone (+91)</label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+91 98401 23456"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">Assigned Route</label>
                  <select
                    value={newUser.assignedRouteId}
                    onChange={e => setNewUser({ ...newUser, assignedRouteId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs mt-1"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400">Fee Status</label>
                  <select
                    value={newUser.feeStatus}
                    onChange={e => setNewUser({ ...newUser, feeStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs mt-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue (Month Ended)</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
