import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapView } from './MapView';
import { FeePaymentModal } from './FeePaymentModal';
import { IncidentModal } from './IncidentModal';
import { 
  Bus, MapPin, Clock, CreditCard, ShieldAlert, Bell, 
  Phone, UserCheck, AlertTriangle, CheckCircle2, ChevronRight, 
  QrCode, AlertCircle, ArrowUpRight, Sparkles, Navigation2, UserPlus
} from 'lucide-react';

export const StudentStaffMobileView: React.FC = () => {
  const { 
    currentUser, 
    buses, 
    routes, 
    notifications, 
    incidents, 
    fees, 
    getStudentFeeRecord,
    activeMobileTab,
    setActiveMobileTab,
    simulateSuddenDelay,
    setIsRegistrationOpen
  } = useApp();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Determine user's assigned route and bus
  const userRoute = routes.find(r => r.id === currentUser.assignedRouteId) || routes[0];
  const userBus = buses.find(b => b.routeId === userRoute.id) || buses[0];
  const userStop = userRoute.stops.find(s => s.id === currentUser.assignedStopId) || userRoute.stops[1];

  const feeRecord = getStudentFeeRecord(currentUser.studentOrStaffId) || fees[0];
  const isFeeOverdueOrPending = feeRecord?.status === 'overdue' || feeRecord?.status === 'pending';

  const userIncidents = incidents.filter(i => i.reportedByUserId === currentUser.id);

  return (
    <div className="max-w-md mx-auto w-full min-h-[840px] flex flex-col bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Mobile Top Status Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-amber-400 font-bold text-sm shadow-inner ring-2 ring-amber-500/30">
              {currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white truncate max-w-[160px]">{currentUser.name}</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold uppercase">
                {currentUser.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[190px]">
              {userRoute.code} • {userStop.name}
            </p>
          </div>
        </div>

        {/* Fee status chip */}
        <button
          onClick={() => setActiveMobileTab('fees')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition flex items-center gap-1 ${
            feeRecord?.status === 'paid'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : feeRecord?.status === 'overdue'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          }`}
        >
          {feeRecord?.status === 'paid' ? 'Pass Active' : feeRecord?.status === 'overdue' ? 'Fee Overdue' : 'Fee Pending'}
        </button>
      </div>

      {/* Prominent Month-End Fee Reminder Banner */}
      {isFeeOverdueOrPending && (
        <div className="p-3 bg-gradient-to-r from-rose-950/80 via-amber-950/60 to-rose-950/80 border-b border-rose-500/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <div className="text-[11px] text-rose-200 leading-tight">
              <span className="font-extrabold text-white">Month-End Bus Fee Due: </span>
              ₹{feeRecord.totalAmount} pending. Please pay to keep pass active.
            </div>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow whitespace-nowrap"
          >
            Pay Now
          </button>
        </div>
      )}

      {/* Main Tab Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* TAB 1: LIVE TRACK */}
        {activeMobileTab === 'map' && (
          <div className="space-y-4 p-3">
            {/* Live Map Frame */}
            <div className="relative">
              <MapView 
                heightClass="h-[360px]" 
                showControls={true} 
                focusedBusId={userBus.id}
              />
            </div>

            {/* Next Bus Arrival ETA Card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h4 className="font-extrabold text-base text-white">{userBus.busNumber}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{userRoute.name} ({userRoute.code})</p>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    userBus.delayMinutes > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {userBus.delayMinutes > 0 ? `+${userBus.delayMinutes}m Delayed` : 'On Schedule'}
                  </span>
                  <div className="text-xl font-black text-amber-400 mt-1">
                    ~{userBus.estimatedNextStopMins} mins
                  </div>
                  <p className="text-[10px] text-slate-400">ETA to your stop</p>
                </div>
              </div>

              {/* Delay notice if delayed */}
              {userBus.delayMinutes > 0 && userBus.delayReason && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2 text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Live Delay Notice:</span> {userBus.delayReason}
                  </div>
                </div>
              )}

              {/* Bus Stats Quick Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400">Current Speed</p>
                  <p className="text-xs font-bold text-white font-mono">{userBus.speed} km/h</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400">Seats Free</p>
                  <p className="text-xs font-bold text-emerald-400">{userBus.capacity - userBus.currentOccupancy} seats</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400">Cabin AC</p>
                  <p className="text-xs font-bold text-sky-400">{userBus.isAc ? 'Cooling Active' : 'Non-AC'}</p>
                </div>
              </div>

              {/* Driver Contact & Incident Actions */}
              <div className="flex gap-2 pt-1">
                <a
                  href={`tel:${userBus.driverPhone}`}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Calling Driver ${userBus.driverName}: ${userBus.driverPhone}`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call Driver</span>
                </a>
                <button
                  onClick={() => setShowIncidentModal(true)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Report Incident</span>
                </button>
              </div>
            </div>

            {/* Route Stops Timeline */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Navigation2 className="w-4 h-4 text-amber-400" />
                  Route Stops & Live Progress
                </h4>
                <span className="text-[11px] text-slate-400">{userRoute.stops.length} Stops</span>
              </div>

              <div className="relative pl-4 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {userRoute.stops.map((stop, idx) => {
                  const isUserStop = stop.id === currentUser.assignedStopId;
                  const isNext = stop.id === userBus.nextStopId;

                  return (
                    <div key={stop.id} className="relative flex items-start gap-3">
                      {/* Timeline dot */}
                      <div className={`w-3.5 h-3.5 rounded-full -ml-[19px] mt-0.5 border-2 ${
                        isUserStop 
                          ? 'bg-amber-400 border-white ring-4 ring-amber-400/30' 
                          : isNext 
                            ? 'bg-emerald-400 border-slate-900 animate-ping'
                            : 'bg-slate-800 border-slate-600'
                      }`} />

                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${isUserStop ? 'text-amber-400' : 'text-slate-200'}`}>
                              {stop.name}
                            </span>
                            {isUserStop && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black">
                                YOU BOARD HERE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{stop.landmark}</p>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{stop.scheduledTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIGITAL PASS */}
        {activeMobileTab === 'pass' && (
          <div className="p-4 space-y-4">
            <div className="relative rounded-3xl bg-gradient-to-b from-slate-850 to-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 overflow-hidden">
              {/* Top pass badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                    BT
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-white uppercase tracking-wider">Campus Transit Boarding Pass</h4>
                    <p className="text-[10px] text-slate-400">Academic Year 2026-2027</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  feeRecord?.status === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                }`}>
                  {feeRecord?.status === 'paid' ? '● Active' : '● Fees Overdue'}
                </span>
              </div>

              {/* QR Code section */}
              <div className="p-4 rounded-2xl bg-white text-slate-950 flex flex-col items-center justify-center gap-2 shadow-inner">
                <QrCode className="w-36 h-36" />
                <p className="text-[10px] font-mono font-bold tracking-widest text-slate-600">
                  PASS-{currentUser.studentOrStaffId}-2026
                </p>
              </div>

              {/* Passenger Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-slate-500">Student Name</p>
                  <p className="font-bold text-white">{currentUser.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">ID Number</p>
                  <p className="font-bold text-amber-400 font-mono">{currentUser.studentOrStaffId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Assigned Route</p>
                  <p className="font-bold text-white">{userRoute.code} - {userRoute.name.split('&')[0]}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Boarding Point</p>
                  <p className="font-bold text-white">{userStop.name}</p>
                </div>
              </div>

              {/* Emergency Hotline Footer */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Emergency Transport SOS:</span>
                <span className="font-mono text-rose-400 font-bold">+91 94440-TRANSPORT</span>
              </div>
            </div>

            {/* Quick Real-Time Registration Action */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  New Student or Faculty Pass?
                </p>
                <p className="text-[10px] text-slate-400">Register in real-time with instant digital QR pass</p>
              </div>
              <button
                onClick={() => setIsRegistrationOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 transition shadow-sm"
              >
                Register Now
              </button>
            </div>

            {feeRecord?.status !== 'paid' && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2 text-rose-200">
                <div className="flex items-center gap-2 font-bold text-white">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Pass Renewal Required</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Your transport pass will expire unless fees are paid. Settle ₹{feeRecord.totalAmount} to ensure smooth conductor scan.
                </p>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition"
                >
                  Pay Pending Fee (₹{feeRecord.totalAmount})
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FEES & MONTH-END REMINDER */}
        {activeMobileTab === 'fees' && (
          <div className="p-4 space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-white">Bus Transportation Fees</h4>
                    <p className="text-xs text-slate-400">{feeRecord.academicTerm}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                  feeRecord.status === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : feeRecord.status === 'overdue'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {feeRecord.status}
                </span>
              </div>

              {/* Amount Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Term Fee:</span>
                  <span className="text-white font-mono">₹{feeRecord.totalAmount}.00</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-400 font-mono">₹{feeRecord.paidAmount}.00</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Due Date:</span>
                  <span className="text-rose-400 font-semibold">{feeRecord.dueDate}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                  <span className="text-white">Net Balance Due:</span>
                  <span className="text-xl font-black text-amber-400">
                    ₹{feeRecord.totalAmount - feeRecord.paidAmount}.00
                  </span>
                </div>
              </div>

              {/* Payment Action */}
              {feeRecord.status !== 'paid' ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                    <span><b>Month Ended Alert:</b> Reminder sent to your student portal. Avoid pass suspension by clearing today.</span>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Pay Online (₹{feeRecord.totalAmount})</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span><b>Term Paid:</b> {feeRecord.paymentMethod || 'Online'}</span>
                  </div>
                  <button
                    onClick={() => alert(`Receipt Ref: ${feeRecord.transactionId || 'TXN-PAID'}`)}
                    className="text-[11px] text-white font-bold underline"
                  >
                    View Receipt
                  </button>
                </div>
              )}
            </div>

            {/* Reminder history */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Fee Reminder Audit History</h5>
              <div className="space-y-1 text-slate-400 text-[11px]">
                <p>• Automated Month-End Reminders Dispatched: <b className="text-white">{feeRecord.remindersSentCount} notices</b></p>
                <p>• Last Administrative Reminder: <b className="text-white">{feeRecord.lastReminderDate || 'None recently'}</b></p>
                <p>• Policy: Students with overdue fees beyond grace period are flagged in Conductor scan.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INCIDENTS & GRIEVANCES */}
        {activeMobileTab === 'incidents' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-base text-white">Transit Incident & Feedback</h4>
                <p className="text-xs text-slate-400">Report delays, breakdowns, or safety concerns</p>
              </div>
              <button
                onClick={() => setShowIncidentModal(true)}
                className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>+ Report</span>
              </button>
            </div>

            {/* Incidents filed by this user */}
            <div className="space-y-3">
              {userIncidents.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-bold text-sm text-white">No Issues Reported</p>
                  <p className="text-xs">You haven't filed any complaints or incident logs yet.</p>
                </div>
              ) : (
                userIncidents.map((inc) => (
                  <div key={inc.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-xs text-white">{inc.title}</h5>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inc.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : inc.status === 'investigating'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {inc.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{inc.description}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                      <span>Category: <b className="text-slate-300 capitalize">{inc.category.replace('_', ' ')}</b></span>
                      <span>{inc.timestamp}</span>
                    </div>

                    {inc.adminNotes && (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-emerald-300">
                        <b>Admin Resolution:</b> {inc.adminNotes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ALERTS FEED */}
        {activeMobileTab === 'alerts' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-white">Push Notifications Stream</h4>
              <span className="text-xs text-slate-400">{notifications.length} alerts</span>
            </div>

            <div className="space-y-2.5">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    notif.type === 'delay'
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-100'
                      : notif.type === 'fee_reminder'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-100'
                        : 'bg-slate-900 border-slate-800 text-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-xs">{notif.title}</span>
                    <span className="text-[10px] opacity-60 shrink-0">{notif.timestamp}</span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="absolute bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-2 z-20">
        {[
          { id: 'map', label: 'Live Track', icon: <MapPin className="w-5 h-5" /> },
          { id: 'pass', label: 'My Pass', icon: <QrCode className="w-5 h-5" /> },
          { id: 'fees', label: 'Fees', icon: <CreditCard className="w-5 h-5" />, badge: isFeeOverdueOrPending },
          { id: 'incidents', label: 'Report', icon: <ShieldAlert className="w-5 h-5" /> },
          { id: 'alerts', label: 'Alerts', icon: <Bell className="w-5 h-5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`mobile-nav-${tab.id}`}
            onClick={() => setActiveMobileTab(tab.id as any)}
            className={`relative flex flex-col items-center justify-center w-14 py-1 rounded-xl transition ${
              activeMobileTab === tab.id
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] mt-0.5">{tab.label}</span>
            {tab.badge && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>
        ))}
      </nav>

      {/* Modals */}
      {showPaymentModal && feeRecord && (
        <FeePaymentModal feeRecord={feeRecord} onClose={() => setShowPaymentModal(false)} />
      )}

      {showIncidentModal && (
        <IncidentModal onClose={() => setShowIncidentModal(false)} />
      )}
    </div>
  );
};
