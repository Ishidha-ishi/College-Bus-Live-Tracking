import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, GraduationCap, Bus, MapPin, Calendar, 
  CreditCard, Bell, X, CheckCircle2, Clock, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { api } from '../services/api';

interface StudentProfileModalProps {
  studentId: string;
  onClose: () => void;
  onFeePaymentSuccess?: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  studentId,
  onClose,
}) => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'fees' | 'notifications'>('profile');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.students.getById(studentId);
        setStudent(data);
      } catch (err) {
        console.error('Failed to load student details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading Student Transport Record...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center">
          <p className="text-sm text-rose-400 font-bold mb-3">Student record not found</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fadeIn my-6">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-lg flex items-center justify-center shadow-inner">
              {student.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{student.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  student.account_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {student.account_status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Reg: {student.reg_no} • {student.department} • {student.year_of_study}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 px-5 pt-3 bg-slate-950/60">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'profile'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Transport Profile
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'fees'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Fee & Payment Log</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
              student.fee_status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {student.fee_status}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'notifications'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Alert History ({student.notifications?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Transport Allocation Info Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Assigned Bus
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Bus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{student.bus_number || 'Unassigned'}</p>
                      <p className="text-[11px] text-slate-400">{student.bus_registration || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Assigned Route
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: student.route_color || '#3B82F6' }}
                      />
                      {student.route_code ? `${student.route_code}: ${student.route_name}` : 'Not assigned'}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Designated Bus Stop
                  </span>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">{student.stop_name || 'Campus Gate'}</p>
                      <p className="text-[11px] text-slate-400">
                        GPS: {student.stop_lat ? `${student.stop_lat.toFixed(4)}, ${student.stop_lng.toFixed(4)}` : 'Campus'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Pickup & Return Timing
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white">
                        Pickup: {student.morning_pickup_time || '07:35 AM'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Drop: {student.evening_drop_time || '05:00 PM'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Student & Guardian Contacts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Student Phone: {student.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-rose-400" />
                    <span>Parent Phone: {student.parent_phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Transport Pass: Verified Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="space-y-4">
              {/* Fee Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Fee</p>
                  <p className="text-lg font-black text-white mt-0.5">₹{student.fee_amount?.toLocaleString()}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Amount Paid</p>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">₹{student.amount_paid?.toLocaleString()}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Balance Pending</p>
                  <p className="text-lg font-black text-rose-400 mt-0.5">₹{student.fee_balance?.toLocaleString()}</p>
                </div>
              </div>

              {/* Payment History List */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2">Verified Payment Receipts</h4>
                {student.paymentHistory?.length > 0 ? (
                  <div className="space-y-2">
                    {student.paymentHistory.map((pay: any) => (
                      <div
                        key={pay.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-400">₹{pay.amount.toLocaleString()}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {pay.payment_method}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Receipt: <span className="font-mono text-slate-200">{pay.receipt_number}</span> • Ref: {pay.transaction_ref}
                          </p>
                        </div>
                        <div className="text-right text-[11px] text-slate-400">
                          {pay.payment_date?.split(' ')[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                    No payment transactions recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-2">
              {student.notifications?.length > 0 ? (
                student.notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs"
                  >
                    <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{n.title}</span>
                        <span className="text-[10px] text-slate-500">{n.created_at?.split(' ')[1] || 'Today'}</span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                  No notifications recorded for this student.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
