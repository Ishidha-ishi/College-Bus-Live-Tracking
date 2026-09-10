import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, CheckCircle, Bus, User, Phone, Mail, MapPin, 
  CreditCard, ShieldCheck, Sparkles, QrCode, ArrowRight,
  GraduationCap, Briefcase, IndianRupee, Clock
} from 'lucide-react';
import { UserRole } from '../types';

export const RealTimeRegistrationModal: React.FC = () => {
  const { 
    isRegistrationOpen, 
    setIsRegistrationOpen, 
    routes, 
    registerUserRealTime,
    buses
  } = useApp();

  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentOrStaffId, setStudentOrStaffId] = useState('');
  const [department, setDepartment] = useState('B.E Computer Science & Engineering');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');
  const [assignedRouteId, setAssignedRouteId] = useState(routes[0]?.id || 'route-1');
  const [assignedStopId, setAssignedStopId] = useState(routes[0]?.stops[1]?.id || 'stop-1-2');
  const [paymentChoice, setPaymentChoice] = useState<'pay_now' | 'pay_later'>('pay_now');
  const [paymentMethod, setPaymentMethod] = useState('UPI (Google Pay / PhonePe)');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Success state after registration
  const [registeredResult, setRegisteredResult] = useState<{
    name: string;
    passId: string;
    routeName: string;
    routeCode: string;
    stopName: string;
    scheduledTime: string;
    busNumber: string;
    isPaid: boolean;
  } | null>(null);

  // Selected route and stops
  const currentRoute = useMemo(() => {
    return routes.find(r => r.id === assignedRouteId) || routes[0];
  }, [routes, assignedRouteId]);

  const assignedBus = useMemo(() => {
    return buses.find(b => b.routeId === assignedRouteId) || buses[0];
  }, [buses, assignedRouteId]);

  // When route changes, update default stop
  const handleRouteChange = (routeId: string) => {
    setAssignedRouteId(routeId);
    const r = routes.find(item => item.id === routeId);
    if (r && r.stops.length > 0) {
      // Pick second stop as typical boarding stop
      setAssignedStopId(r.stops[1]?.id || r.stops[0]?.id);
    }
  };

  const selectedStop = useMemo(() => {
    return currentRoute.stops.find(s => s.id === assignedStopId) || currentRoute.stops[0];
  }, [currentRoute, assignedStopId]);

  const feeAmount = role === 'student' ? 3500 : 2000;

  // Tamil Nadu Quick Fill Preset for testing
  const applyPreset = (presetName: string, presetRole: UserRole, regNo: string, dept: string) => {
    setName(presetName);
    setRole(presetRole);
    setStudentOrStaffId(regNo);
    setDepartment(dept);
    const formattedEmail = `${presetName.toLowerCase().replace(/\s+/g, '.')}@${presetRole === 'student' ? 'student.' : 'faculty.'}campus.edu.in`;
    setEmail(formattedEmail);
    if (!phone) setPhone('+91 98401 ' + Math.floor(10000 + Math.random() * 90000));
    if (presetRole === 'student' && !parentPhone) setParentPhone('+91 94440 ' + Math.floor(10000 + Math.random() * 90000));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid college email is required';
    if (!phone.trim() || phone.length < 8) errs.phone = 'Valid 10-digit mobile number is required';
    if (!studentOrStaffId.trim()) errs.studentOrStaffId = role === 'student' ? 'Register / Roll No. is required' : 'Staff ID is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const registeredUser = registerUserRealTime({
      name: name.trim(),
      email: email.trim(),
      role,
      phone: phone.trim(),
      studentOrStaffId: studentOrStaffId.trim(),
      departmentOrClass: department,
      yearOfStudy: role === 'student' ? yearOfStudy : undefined,
      assignedRouteId,
      assignedStopId,
      parentPhone: parentPhone.trim() || undefined,
      feeAmount,
      paymentChoice,
      paymentMethod: paymentChoice === 'pay_now' ? paymentMethod : undefined,
    });

    setRegisteredResult({
      name: registeredUser.name,
      passId: registeredUser.studentOrStaffId,
      routeName: currentRoute.name,
      routeCode: currentRoute.code,
      stopName: selectedStop?.name || 'Main Gate',
      scheduledTime: selectedStop?.scheduledTime || '07:30 AM',
      busNumber: assignedBus?.busNumber || 'Campus Bus',
      isPaid: paymentChoice === 'pay_now',
    });
  };

  const handleClose = () => {
    setIsRegistrationOpen(false);
    setRegisteredResult(null);
  };

  if (!isRegistrationOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Tamil Nadu Campus Bus Pass Registration
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instant digital pass issuance, route seat allocation & live GPS tracking
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {registeredResult ? (
          /* SUCCESS STATE */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">
                🎉 Digital Bus Pass Activated in Real-Time!
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Your registration has been instantly committed to the university fleet ledger and assigned to live GPS tracking.
              </p>
            </div>

            {/* Generated Smart Pass Preview */}
            <div className="max-w-md mx-auto rounded-2xl bg-gradient-to-br from-slate-850 to-slate-900 border border-amber-500/30 p-5 text-left shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Tamil Nadu Transport Pass
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  registeredResult.isPaid 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {registeredResult.isPaid ? 'PAID & VERIFIED' : 'PENDING (MONTH-END)'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-white truncate">{registeredResult.name}</p>
                  <p className="text-xs font-mono text-amber-400 font-semibold">{registeredResult.passId}</p>
                  <div className="text-[11px] text-slate-300 pt-1 space-y-0.5">
                    <p><span className="text-slate-500">Route:</span> <strong className="text-slate-200">{registeredResult.routeCode}</strong> - {registeredResult.routeName}</p>
                    <p><span className="text-slate-500">Boarding Stop:</span> {registeredResult.stopName}</p>
                    <p><span className="text-slate-500">Pickup Time:</span> <span className="text-emerald-400 font-semibold">{registeredResult.scheduledTime}</span></p>
                    <p><span className="text-slate-500">Assigned Bus:</span> {registeredResult.busNumber}</p>
                  </div>
                </div>

                <div className="bg-white p-2 rounded-xl flex flex-col items-center justify-center shrink-0">
                  <QrCode className="w-16 h-16 text-slate-950" />
                  <span className="text-[8px] font-mono text-slate-900 mt-1 font-bold">SCAN LIVE</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <span>Open My Live Mobile Pass & GPS Tracking</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            
            {/* Quick Tamil Nadu Name Presets */}
            <div className="bg-slate-850/80 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Quick Fill Tamil Nadu Student / Faculty Profiles:
                </span>
                <span className="text-[10px] text-slate-500">One-click auto-fill</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Karthik Selvam', role: 'student' as UserRole, regNo: '710023104042', dept: 'B.E Computer Science & Engg' },
                  { name: 'Ananya Sundaram', role: 'student' as UserRole, regNo: '710024205018', dept: 'B.Tech Information Technology' },
                  { name: 'Kavin Raj M.', role: 'student' as UserRole, regNo: '710023114035', dept: 'B.E Mechanical Engineering' },
                  { name: 'Priya Ramasamy', role: 'student' as UserRole, regNo: '710023106071', dept: 'B.E Electronics & Comm. Engg' },
                  { name: 'Dr. Arvind Swaminathan', role: 'staff' as UserRole, regNo: 'FAC-SLM-409', dept: 'Department of Computing (Salem)' },
                ].map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset.name, preset.role, preset.regNo, preset.dept)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 hover:border-amber-500/40 transition"
                  >
                    + {preset.name} ({preset.role})
                  </button>
                ))}
              </div>
            </div>

            {/* Role Switcher (Student vs Staff) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registration Category</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
                    role === 'student'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>College Student Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('staff')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
                    role === 'staff'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Faculty / Staff Transit</span>
                </button>
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name (Tamil Nadu Format) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Karthik Selvam / Ananya S."
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {role === 'student' ? 'Anna University / College Reg No. *' : 'Faculty / Staff ID *'}
                </label>
                <input
                  type="text"
                  required
                  value={studentOrStaffId}
                  onChange={e => setStudentOrStaffId(e.target.value)}
                  placeholder={role === 'student' ? 'e.g. 710023104042' : 'e.g. FAC-TN-409'}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                {errors.studentOrStaffId && <p className="text-[10px] text-rose-400 mt-1">{errors.studentOrStaffId}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">College Email ID *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@campus.edu.in"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-rose-400 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number (+91) *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98401 23456"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-400 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department / Branch *</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="B.E Computer Science & Engineering">B.E Computer Science & Engineering</option>
                  <option value="B.Tech Information Technology">B.Tech Information Technology</option>
                  <option value="B.Tech AI & Data Science">B.Tech AI & Data Science</option>
                  <option value="B.E Electronics & Communication">B.E Electronics & Communication</option>
                  <option value="B.E Mechanical Engineering">B.E Mechanical Engineering</option>
                  <option value="B.E Civil Engineering">B.E Civil Engineering</option>
                  <option value="MBA Transport Logistics">MBA Transport Logistics</option>
                  <option value="MCA Computer Applications">MCA Computer Applications</option>
                </select>
              </div>

              {role === 'student' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Year of Study</label>
                  <select
                    value={yearOfStudy}
                    onChange={e => setYearOfStudy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="1st Year">1st Year (Fresher)</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Emergency / Family Contact</label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    placeholder="+91 94440 12345"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              )}
            </div>

            {role === 'student' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Parent / Guardian Mobile (+91) (For delay SMS & incident notifications)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    placeholder="+91 94440 98765"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Route & Stop Assignment */}
            <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Tamil Nadu Transit Route & Boarding Stop Selection
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Assigned Route</label>
                  <select
                    value={assignedRouteId}
                    onChange={e => handleRouteChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.code}: {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Designated Boarding Stop</label>
                  <select
                    value={assignedStopId}
                    onChange={e => setAssignedStopId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {currentRoute.stops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.scheduledTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedStop && (
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pickup Time: <strong className="text-amber-300">{selectedStop.scheduledTime}</strong></span>
                  </div>
                  <span className="text-slate-400 truncate max-w-[200px] text-right">
                    📍 {selectedStop.landmark}
                  </span>
                </div>
              )}
            </div>

            {/* Fee & Payment Options */}
            <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Bus Transport Fee Plan
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  ₹{feeAmount.toLocaleString('en-IN')} / Semester
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  paymentChoice === 'pay_now'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="paymentChoice"
                    checked={paymentChoice === 'pay_now'}
                    onChange={() => setPaymentChoice('pay_now')}
                    className="mt-0.5 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold block text-emerald-300">
                      ⚡ Pay Online Now via UPI / Net Banking
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Pass activates immediately with verified green digital badge
                    </span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  paymentChoice === 'pay_later'
                    ? 'bg-amber-500/10 border-amber-500/40 text-white'
                    : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="paymentChoice"
                    checked={paymentChoice === 'pay_later'}
                    onChange={() => setPaymentChoice('pay_later')}
                    className="mt-0.5 text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold block text-amber-300">
                      📅 Month-End Billing (Pay Later)
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Pass status starts as "Pending" (allows testing month-end reminder alerts)
                    </span>
                  </div>
                </label>
              </div>

              {paymentChoice === 'pay_now' && (
                <div className="pt-2">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Select Payment Gateway</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="UPI (Google Pay / PhonePe)">UPI (Google Pay / PhonePe / Paytm / BHIM)</option>
                    <option value="Net Banking (Indian Bank)">Net Banking (Indian Bank - Anna University)</option>
                    <option value="Net Banking (State Bank of India)">Net Banking (State Bank of India)</option>
                    <option value="Net Banking (Canara Bank)">Net Banking (Canara Bank)</option>
                    <option value="Debit / Credit Card">RuPay / Visa / Mastercard</option>
                  </select>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Issue & Register Live Bus Pass</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
