import React, { useState } from 'react';
import { UserPlus, X, Bus, MapPin, CreditCard, User, Mail, Phone, GraduationCap } from 'lucide-react';
import { api } from '../services/api';

interface AddStudentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  buses: any[];
  routes: any[];
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  onClose,
  onSuccess,
  buses,
  routes,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [regNo, setRegNo] = useState('');
  const [department, setDepartment] = useState('B.Tech Computer Science & Engg');
  const [yearOfStudy, setYearOfStudy] = useState('1st Year');
  const [phone, setPhone] = useState('+91 9');
  const [parentPhone, setParentPhone] = useState('+91 9');
  const [assignedRouteId, setAssignedRouteId] = useState(routes[0]?.id || '');
  const [assignedBusId, setAssignedBusId] = useState(buses[0]?.id || '');
  const [assignedStopId, setAssignedStopId] = useState('');
  const [feeAmount, setFeeAmount] = useState(16500);
  const [amountPaid, setAmountPaid] = useState(0);
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected route's stops
  const selectedRoute = routes.find(r => r.id === assignedRouteId) || routes[0];
  const stops = selectedRoute?.stops || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !regNo.trim()) {
      setErrorMsg('Name, email, and registration number are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await api.students.create({
        name: name.trim(),
        email: email.trim(),
        regNo: regNo.trim(),
        department,
        yearOfStudy,
        phone,
        parentPhone,
        assignedRouteId: assignedRouteId || routes[0]?.id,
        assignedBusId: assignedBusId || buses[0]?.id,
        assignedStopId: assignedStopId || stops[0]?.id,
        feeAmount: Number(feeAmount),
        amountPaid: Number(amountPaid),
        feeDueDate: dueDate,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-fadeIn my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Enroll New Student Passenger</h3>
              <p className="text-xs text-slate-400">Creates user credentials, transport route pass, and fee ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Identity Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Student Credentials & Academic Info</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vignesh K."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 711122104035"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Campus Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. vignesh@campus.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="B.Tech Computer Science & Engg">B.Tech Computer Science & Engg</option>
                  <option value="B.Tech Artificial Intelligence & DS">B.Tech AI & Data Science</option>
                  <option value="B.E. Electronics & Communication">B.E. Electronics & Communication</option>
                  <option value="B.E. Mechanical Engineering">B.E. Mechanical Engineering</option>
                  <option value="B.E. Civil Engineering">B.E. Civil Engineering</option>
                  <option value="MBA Logistics & Transport">MBA Logistics & Transport</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Year of Study</label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Student Phone</label>
                <input
                  type="text"
                  placeholder="+91 98400 11111"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Parent / Emergency Contact</label>
                <input
                  type="text"
                  placeholder="+91 94430 22222"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Transport Allocation */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bus & Route Allocation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Assigned Route</label>
                <select
                  value={assignedRouteId}
                  onChange={(e) => {
                    setAssignedRouteId(e.target.value);
                    const sel = routes.find(r => r.id === e.target.value);
                    if (sel && sel.stops.length > 0) {
                      setAssignedStopId(sel.stops[0].id);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.route_code || r.code}: {r.route_name || r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Assigned Bus</label>
                <select
                  value={assignedBusId}
                  onChange={(e) => setAssignedBusId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.bus_number || b.busNumber}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Designated Stop</label>
                <select
                  value={assignedStopId}
                  onChange={(e) => setAssignedStopId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {stops.map((st: any) => (
                    <option key={st.id} value={st.id}>{st.stop_name || st.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Fee & Payment Ledger */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Transport Fee Pass Setup</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Annual Fee (₹)</label>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Initial Paid (₹)</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Enrolling to Database...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enroll Student</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
