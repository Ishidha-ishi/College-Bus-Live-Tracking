import React, { useState } from 'react';
import { CreditCard, X, Check, ArrowRight, ShieldCheck, Receipt } from 'lucide-react';
import { api } from '../services/api';

interface RecordPaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  studentId?: string;
  studentName?: string;
  currentBalance?: number;
  allStudents?: any[];
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  onClose,
  onSuccess,
  studentId: defaultStudentId,
  studentName: defaultStudentName,
  currentBalance: defaultBalance = 16500,
  allStudents = [],
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(defaultStudentId || allStudents[0]?.id || '');
  const [amount, setAmount] = useState<number>(defaultBalance || 8000);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState(`UPI-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('Transport fee semester clearance');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !amount || amount <= 0) {
      setErrorMsg('Please select a student and specify a valid payment amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.fees.recordPayment({
        studentId: selectedStudentId,
        amount: Number(amount),
        paymentMethod,
        transactionRef,
        notes,
      });

      setSuccessReceipt(res);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record fee payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-fadeIn">
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Transport Fee Payment</h3>
              <p className="text-xs text-slate-400">Updates student ledger and dispatches payment receipt</p>
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

        {successReceipt ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Payment Recorded Successfully</h4>
              <p className="text-xs text-slate-400 mt-1">Receipt has been dispatched to student portal</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Receipt Number:</span>
                <span className="text-white font-bold">{successReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Txn Reference:</span>
                <span className="text-white">{successReceipt.transactionRef}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Updated Status:</span>
                <span className="text-emerald-400 font-bold">{successReceipt.paymentStatus}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Remaining Balance:</span>
                <span className="text-amber-400 font-bold">₹{successReceipt.newBalance?.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {!defaultStudentId && allStudents.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {allStudents.map(st => (
                    <option key={st.student_table_id || st.id} value={st.student_table_id || st.id}>
                      {st.name || st.student_name} ({st.reg_no || st.regNo}) • Pending: ₹{st.fee_balance || st.balance || 0}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {defaultStudentName && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Student:</span>
                <span className="text-white font-bold">{defaultStudentName}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="NetBanking">Net Banking</option>
                  <option value="Debit Card">Debit / Credit Card</option>
                  <option value="Cash">Cash at Transport Counter</option>
                  <option value="Demand Draft">Bank Demand Draft (DD)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Ref / Cheque No.</label>
              <input
                type="text"
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks / Term</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Even semester fee installment 1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
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
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Issue Receipt & Save</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
