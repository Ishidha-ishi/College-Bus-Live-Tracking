import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { FeeRecord } from '../types';
import { 
  CreditCard, Smartphone, Building, CheckCircle2, 
  Download, ShieldCheck, X, ArrowRight, Receipt 
} from 'lucide-react';

export const FeePaymentModal: React.FC<{
  feeRecord: FeeRecord;
  onClose: () => void;
}> = ({ feeRecord, onClose }) => {
  const { payBusFee } = useApp();
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('student@oksbi');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4092');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedTxnId, setGeneratedTxnId] = useState('');

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const methodName = paymentMethod === 'upi' ? `UPI (${upiId})` : paymentMethod === 'card' ? 'Debit/Credit Card' : 'Net Banking';
      payBusFee(feeRecord.id, methodName);
      setGeneratedTxnId(`TXN-CAMPUS-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsProcessing(false);
      setIsSuccess(true);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899'],
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-6 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Campus Bus Transport Fee</h3>
              <p className="text-xs text-slate-400">{feeRecord.academicTerm}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isSuccess ? (
          <div className="p-6 space-y-5">
            {/* Student & Fee Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Student Name</span>
                <span className="font-semibold text-white">{feeRecord.studentName} ({feeRecord.studentId})</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Assigned Route</span>
                <span className="font-semibold text-white">{feeRecord.routeName}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Billing Status</span>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {feeRecord.status === 'overdue' ? 'Month Ended Overdue' : 'Due Pending'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-300">Total Payable Amount</span>
                <span className="text-2xl font-black text-amber-400">₹{feeRecord.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'upi'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span>UPI Instant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'card'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Debit / Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'netbanking'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building className="w-5 h-5" />
                  <span>Net Banking</span>
                </button>
              </div>
            </div>

            {/* Method Inputs */}
            {paymentMethod === 'upi' && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Virtual Payment Address (VPA / UPI ID)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okhdfcbank"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <div className="flex gap-2 pt-1">
                  {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                    <span key={app} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-400">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    defaultValue="12/28"
                    placeholder="MM/YY"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                  <input
                    type="password"
                    defaultValue="•••"
                    placeholder="CVV"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <p className="font-semibold text-white mb-1">State Bank of India / HDFC Campus Portal</p>
                <p className="text-[11px] text-slate-400">You will be redirected securely to complete authentication.</p>
              </div>
            )}

            {/* Security note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>256-Bit Encrypted Campus Payment Gateway</span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-pay-fee"
                onClick={handlePay}
                disabled={isProcessing}
                className="flex-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 font-extrabold text-xs text-slate-950 shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{feeRecord.totalAmount} Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Payment Success & Receipt View */
          <div className="p-6 space-y-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-black text-white">Payment Successful!</h4>
              <p className="text-xs text-slate-400 mt-1">
                Your bus pass for <b className="text-white">{feeRecord.academicTerm}</b> has been renewed and activated.
              </p>
            </div>

            {/* Printable Receipt Preview */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Transaction Ref:</span>
                <span className="text-white font-bold">{generatedTxnId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount Paid:</span>
                <span className="text-emerald-400 font-bold">₹{feeRecord.totalAmount}.00</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date & Time:</span>
                <span className="text-white">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Valid Route:</span>
                <span className="text-white font-sans">{feeRecord.routeName}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-sans">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Pass Status: Active</span>
                <span className="text-[10px] text-slate-500">Auto-synced with Conductor Console</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => alert(`Receipt downloaded for ${generatedTxnId}`)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-200 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Receipt
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 font-bold text-xs text-slate-950 transition"
              >
                Return to App
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
