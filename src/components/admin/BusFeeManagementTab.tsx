import React, { useState, useMemo } from 'react';
import { 
  CreditCard, Search, Filter, Download, Bell, Plus, CheckCircle2, 
  AlertTriangle, Clock, TrendingUp, DollarSign, ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, Legend, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { api } from '../../services/api';

interface BusFeeManagementTabProps {
  students: any[];
  onRefresh: () => void;
  onOpenRecordPayment: (studentId?: string, studentName?: string, balance?: number) => void;
  onTriggerReminders: () => void;
}

export const BusFeeManagementTab: React.FC<BusFeeManagementTabProps> = ({
  students,
  onRefresh,
  onOpenRecordPayment,
  onTriggerReminders,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isDispatchingReminders, setIsDispatchingReminders] = useState(false);

  // Fee Analytics
  const stats = useMemo(() => {
    let totalFee = 0;
    let collected = 0;
    let pending = 0;
    let paidCount = 0;
    let partialCount = 0;
    let overdueCount = 0;
    let unpaidCount = 0;

    students.forEach(s => {
      const amt = Number(s.fee_amount || 16500);
      const paid = Number(s.amount_paid || 0);
      const bal = Number(s.fee_balance !== undefined ? s.fee_balance : (amt - paid));

      totalFee += amt;
      collected += paid;
      pending += bal;

      const st = s.fee_status || 'UNPAID';
      if (st === 'PAID') paidCount++;
      else if (st === 'PARTIAL') partialCount++;
      else if (st === 'OVERDUE') overdueCount++;
      else unpaidCount++;
    });

    return { totalFee, collected, pending, paidCount, partialCount, overdueCount, unpaidCount };
  }, [students]);

  // Recharts Department-wise breakdown
  const departmentData = useMemo(() => {
    const map: Record<string, { name: string; paid: number; pending: number }> = {};
    students.forEach(s => {
      const dept = s.department?.split(' ')[1] || s.department || 'General';
      if (!map[dept]) {
        map[dept] = { name: dept, paid: 0, pending: 0 };
      }
      map[dept].paid += Number(s.amount_paid || 0);
      map[dept].pending += Number(s.fee_balance || 0);
    });
    return Object.values(map).slice(0, 5);
  }, [students]);

  // Monthly collection timeline dummy curve based on real collected
  const collectionTrend = [
    { month: 'Jun', amount: Math.round(stats.collected * 0.15) },
    { month: 'Jul', amount: Math.round(stats.collected * 0.25) },
    { month: 'Aug', amount: Math.round(stats.collected * 0.20) },
    { month: 'Sep', amount: Math.round(stats.collected * 0.40) },
  ];

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = 
        !searchTerm.trim() ||
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.reg_no && s.reg_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || s.fee_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [students, searchTerm, statusFilter]);

  const handleTriggerReminders = async () => {
    setIsDispatchingReminders(true);
    try {
      await onTriggerReminders();
    } finally {
      setIsDispatchingReminders(false);
    }
  };

  const exportFeesCSV = () => {
    const headers = 'Reg No,Student Name,Department,Route,Bus,Total Fee,Amount Paid,Balance,Status,Due Date\n';
    const rows = filteredStudents.map(s => 
      `"${s.reg_no}","${s.name}","${s.department}","${s.route_name || ''}","${s.bus_number || ''}",${s.fee_amount || 0},${s.amount_paid || 0},${s.fee_balance || 0},"${s.fee_status}","${s.fee_due_date || '2026-09-30'}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bus_Fee_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Header & Main Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <span>Student Transport Fee Management & Dashboard</span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time fee collection ledgers, automated month-end reminder engine, and audit compliance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportFeesCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Audit CSV</span>
          </button>

          <button
            onClick={handleTriggerReminders}
            disabled={isDispatchingReminders}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Bell className="w-3.5 h-3.5 text-rose-400" />
            <span>
              {isDispatchingReminders ? 'Sending...' : `Trigger Overdue Reminders (${stats.overdueCount})`}
            </span>
          </button>

          <button
            onClick={() => onOpenRecordPayment()}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Record Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Ledger Fees
          </span>
          <p className="text-xl font-black text-white">₹{stats.totalFee.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{students.length} Passholders</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Amount Collected
          </span>
          <p className="text-xl font-black text-emerald-400">₹{stats.collected.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">
            {stats.totalFee > 0 ? Math.round((stats.collected / stats.totalFee) * 100) : 0}% Realized
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Pending Balance
          </span>
          <p className="text-xl font-black text-rose-400">₹{stats.pending.toLocaleString()}</p>
          <p className="text-[10px] text-rose-400 mt-0.5">To be settled</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Paid in Full
          </span>
          <p className="text-xl font-black text-white">{stats.paidCount}</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">Passes Verified</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Partially Paid
          </span>
          <p className="text-xl font-black text-amber-400">{stats.partialCount}</p>
          <p className="text-[10px] text-amber-400 mt-0.5">Installments open</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Overdue Accounts
          </span>
          <p className="text-xl font-black text-rose-400">{stats.overdueCount}</p>
          <p className="text-[10px] text-rose-400 font-bold mt-0.5">Flagged for alert</p>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Department Collections */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Department Fee Breakdown (₹ Paid vs Pending)</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">Real-time</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="paid" name="Paid Amount" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending Balance" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fee Realization Trend */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Semester Fee Collection Trajectory</span>
            </h4>
            <span className="text-[11px] text-emerald-400 font-bold">₹{stats.collected.toLocaleString()} Cumulative</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collectionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Collected']}
                />
                <Area type="monotone" dataKey="amount" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#feeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Search and Filter for Fee Records */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search fee records by name, reg no, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'PAID', 'PARTIAL', 'OVERDUE', 'UNPAID'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === status
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Fee Records Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Student Details</th>
                <th className="p-3.5">Assigned Route & Bus</th>
                <th className="p-3.5">Total Fee</th>
                <th className="p-3.5">Amount Paid</th>
                <th className="p-3.5">Balance Due</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    No fee records matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const feeStatus = s.fee_status || 'UNPAID';
                  const isPaid = feeStatus === 'PAID';
                  const isOverdue = feeStatus === 'OVERDUE';
                  const isPartial = feeStatus === 'PARTIAL';

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <p className="font-bold text-white">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Reg: {s.reg_no} • {s.department}</p>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-amber-400">{s.bus_number || 'Unassigned'}</p>
                        <p className="text-[10px] text-slate-400">{s.route_name || 'No Route'}</p>
                      </td>

                      <td className="p-3.5 font-mono text-slate-300 font-semibold">
                        ₹{(s.fee_amount || 16500).toLocaleString()}
                      </td>

                      <td className="p-3.5 font-mono text-emerald-400 font-bold">
                        ₹{(s.amount_paid || 0).toLocaleString()}
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className={`font-bold ${s.fee_balance > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                          ₹{(s.fee_balance || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isOverdue
                              ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                              : isPartial
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                        }`}>
                          {feeStatus}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-slate-400">
                        {s.fee_due_date || '2026-09-30'}
                      </td>

                      <td className="p-3.5 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => onOpenRecordPayment(s.student_table_id || s.id, s.name, s.fee_balance)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Pay</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Cleared</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
