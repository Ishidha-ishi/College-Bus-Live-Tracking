import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Plus, Eye, Edit, Trash2, CreditCard, 
  Bell, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight,
  Download, UserPlus, Phone, Mail, GraduationCap, Bus, MapPin 
} from 'lucide-react';
import { api } from '../../services/api';

interface StudentDatabaseTabProps {
  students: any[];
  routes: any[];
  buses: any[];
  onRefresh: () => void;
  onOpenAddStudent: () => void;
  onOpenProfile: (studentId: string) => void;
  onOpenSendNotification: (studentId: string, studentName: string) => void;
  onOpenRecordPayment: (studentId: string, studentName: string, balance: number) => void;
}

export const StudentDatabaseTab: React.FC<StudentDatabaseTabProps> = ({
  students,
  routes,
  buses,
  onRefresh,
  onOpenAddStudent,
  onOpenProfile,
  onOpenSendNotification,
  onOpenRecordPayment,
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedRoute, setSelectedRoute] = useState('ALL');
  const [selectedBus, setSelectedBus] = useState('ALL');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Departments list from students
  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = 
        !searchTerm.trim() ||
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.reg_no && s.reg_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDept = selectedDept === 'ALL' || s.department === selectedDept;
      const matchYear = selectedYear === 'ALL' || s.year_of_study === selectedYear;
      const matchRoute = selectedRoute === 'ALL' || s.route_id === selectedRoute || s.route_code === selectedRoute;
      const matchBus = selectedBus === 'ALL' || s.bus_id === selectedBus || s.bus_number === selectedBus;
      const matchFee = selectedFeeStatus === 'ALL' || s.fee_status === selectedFeeStatus;

      return matchSearch && matchDept && matchYear && matchRoute && matchBus && matchFee;
    });
  }, [students, searchTerm, selectedDept, selectedYear, selectedRoute, selectedBus, selectedFeeStatus]);

  // Paginated students
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const handleDelete = async (studentId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from transport registry?`)) {
      return;
    }
    try {
      setIsDeleting(studentId);
      await api.students.delete(studentId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student');
    } finally {
      setIsDeleting(null);
    }
  };

  const exportStudentsCSV = () => {
    const headers = 'Reg No,Name,Department,Year,Email,Phone,Bus Number,Route,Bus Stop,Fee Status,Amount Paid,Balance,Account Status\n';
    const rows = filteredStudents.map(s => 
      `"${s.reg_no}","${s.name}","${s.department}","${s.year_of_study}","${s.email}","${s.phone || ''}","${s.bus_number || ''}","${s.route_name || ''}","${s.stop_name || ''}","${s.fee_status}",${s.amount_paid || 0},${s.fee_balance || 0},"${s.account_status}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_Transport_Registry_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <span>Student Transport Registry Database</span>
          </h3>
          <p className="text-xs text-slate-400">
            Official student transport allocation, boarding stops, and verified fee pass records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportStudentsCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onOpenAddStudent}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search by student name, ID / Reg No, email, or dept..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Clear */}
          {(searchTerm || selectedDept !== 'ALL' || selectedYear !== 'ALL' || selectedRoute !== 'ALL' || selectedBus !== 'ALL' || selectedFeeStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('ALL');
                setSelectedYear('ALL');
                setSelectedRoute('ALL');
                setSelectedBus('ALL');
                setSelectedFeeStatus('ALL');
                setCurrentPage(1);
              }}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {/* Department */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          {/* Route */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Route</label>
            <select
              value={selectedRoute}
              onChange={(e) => {
                setSelectedRoute(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Routes</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.route_code || r.code}</option>
              ))}
            </select>
          </div>

          {/* Bus */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Bus Number</label>
            <select
              value={selectedBus}
              onChange={(e) => {
                setSelectedBus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Fleet Buses</option>
              {buses.map(b => (
                <option key={b.id} value={b.id}>{b.bus_number || b.busNumber}</option>
              ))}
            </select>
          </div>

          {/* Fee Status */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Fee Status</label>
            <select
              value={selectedFeeStatus}
              onChange={(e) => {
                setSelectedFeeStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Fee Statuses</option>
              <option value="PAID">PAID (Full)</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="UNPAID">UNPAID</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Database Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Student ID & Reg No</th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Department & Year</th>
                <th className="p-3.5">Phone & Email</th>
                <th className="p-3.5">Bus & Route</th>
                <th className="p-3.5">Designated Stop</th>
                <th className="p-3.5">Fee Pass Status</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  const feeStatus = student.fee_status || 'UNPAID';
                  const isPaid = feeStatus === 'PAID';
                  const isOverdue = feeStatus === 'OVERDUE';
                  const isPartial = feeStatus === 'PARTIAL';

                  return (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition">
                      {/* 1. Student ID & Reg No */}
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-white block">{student.reg_no}</span>
                        <span className="text-[10px] text-slate-400 font-sans">ID: {student.student_table_id?.slice(0, 8) || student.id?.slice(0, 8)}</span>
                      </td>

                      {/* 2. Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {student.name?.charAt(0) || 'S'}
                          </div>
                          <span className="font-bold text-white block">{student.name}</span>
                        </div>
                      </td>

                      {/* 3. Department & Year */}
                      <td className="p-3.5">
                        <p className="text-white font-medium">{student.department}</p>
                        <p className="text-[10px] text-slate-400">{student.year_of_study}</p>
                      </td>

                      {/* 4. Phone & Email */}
                      <td className="p-3.5">
                        <p className="text-slate-300 font-mono text-[11px]">{student.phone || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{student.email}</p>
                      </td>

                      {/* 5. Bus & Route */}
                      <td className="p-3.5">
                        <p className="font-bold text-amber-400 flex items-center gap-1">
                          <Bus className="w-3 h-3" />
                          <span>{student.bus_number || 'Unassigned'}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {student.route_code ? `${student.route_code}: ${student.route_name?.split('&')[0] || ''}` : 'No route'}
                        </p>
                      </td>

                      {/* 6. Designated Stop */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{student.stop_name || 'Main Gate'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Pickup: {student.morning_pickup_time || '07:35 AM'}</p>
                      </td>

                      {/* 7. Fee Pass Status */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isOverdue
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                              : isPartial
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                        }`}>
                          {feeStatus}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Paid: ₹{student.amount_paid?.toLocaleString() || 0} / ₹{student.fee_amount?.toLocaleString() || 16500}
                        </p>
                      </td>

                      {/* 8. Account Status */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          student.account_status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {student.account_status || 'active'}
                        </span>
                      </td>

                      {/* 9. Actions Column */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Profile */}
                          <button
                            onClick={() => onOpenProfile(student.student_table_id || student.id)}
                            title="View Full Transport Profile"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Record / View Fees */}
                          <button
                            onClick={() => onOpenRecordPayment(
                              student.student_table_id || student.id,
                              student.name,
                              student.fee_balance || (student.fee_amount - student.amount_paid) || 0
                            )}
                            title="Record Payment / View Fee Details"
                            className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          {/* Send Notification */}
                          <button
                            onClick={() => onOpenSendNotification(student.user_id || student.id, student.name)}
                            title="Send Direct Push Notification"
                            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Student */}
                          <button
                            onClick={() => handleDelete(student.student_table_id || student.id, student.name)}
                            disabled={isDeleting === (student.student_table_id || student.id)}
                            title="Remove Student Record"
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <b className="text-white">{filteredStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</b> to{' '}
            <b className="text-white">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</b> of{' '}
            <b className="text-white">{filteredStudents.length}</b> students
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="text-slate-300 font-mono">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
