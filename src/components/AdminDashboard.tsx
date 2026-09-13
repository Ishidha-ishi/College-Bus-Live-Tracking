import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../src/context/AppContext';
import { MapView } from './MapView';
import { DelayNotificationModal } from './DelayNotificationModal';
import { StudentProfileModal } from './StudentProfileModal';
import { SendNotificationModal } from './SendNotificationModal';
import { AddStudentModal } from './AddStudentModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { AdminHeaderKPIs } from './admin/AdminHeaderKPIs';
import { StudentDatabaseTab } from './admin/StudentDatabaseTab';
import { BusFeeManagementTab } from './admin/BusFeeManagementTab';
import { FleetBusesTab } from './admin/FleetBusesTab';
import { RoutesStopsTab } from './admin/RoutesStopsTab';
import { StaffDriverDatabaseTab } from './admin/StaffDriverDatabaseTab';
import { NotificationsHubTab } from './admin/NotificationsHubTab';
import { OperationsAnalyticsTab } from './admin/OperationsAnalyticsTab';
import { 
  Bus, GraduationCap, CreditCard, Navigation, Users, 
  Bell, TrendingUp, Radio, RefreshCw, Send, ShieldAlert 
} from 'lucide-react';
import { api } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const { 
    buses: contextBuses, 
    routes: contextRoutes,
    fees: contextFees, 
    notifications: contextNotifications,
    triggerMonthEndFeeReminders,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'fleet' | 'students' | 'fees' | 'buses' | 'routes' | 'staff_drivers' | 'notifications' | 'analytics'
  >('fleet');

  // Backend state
  const [students, setStudents] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>(contextBuses || []);
  const [routes, setRoutes] = useState<any[]>(contextRoutes || []);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [driverList, setDriverList] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>(contextNotifications || []);
  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showProfileStudentId, setShowProfileStudentId] = useState<string | null>(null);
  const [notificationTarget, setNotificationTarget] = useState<{ id?: string; name?: string } | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<{ id?: string; name?: string; balance?: number } | null>(null);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedBusForDelay, setSelectedBusForDelay] = useState<string | undefined>(undefined);

  // Fetch all live database records
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [studentsRes, busesRes, routesRes, staffRes, driversRes, notifsRes] = await Promise.all([
        api.students.getAll().catch(() => ({ data: [] })),
        api.buses.getAll().catch(() => contextBuses),
        api.routes.getAll().catch(() => contextRoutes),
        api.staff.getAll().catch(() => []),
        api.staff.getDrivers().catch(() => []),
        api.notifications.getAll().catch(() => contextNotifications),
      ]);

      if (studentsRes?.data) setStudents(studentsRes.data);
      if (busesRes) setBuses(busesRes);
      if (routesRes) setRoutes(routesRes);
      if (staffRes) setStaffList(staffRes);
      if (driversRes) setDriverList(driversRes);
      if (notifsRes) setNotifications(notifsRes);
    } catch (err) {
      console.error('Failed to sync admin data from backend:', err);
    } finally {
      setIsLoading(false);
    }
  }, [contextBuses, contextRoutes, contextNotifications]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Derived KPIs
  const totalStudents = students.length;
  const totalStaff = staffList.length || 4;
  const totalDrivers = driverList.length || 4;
  const totalBuses = buses.length;
  const activeBuses = buses.filter(b => (b.status || 'ACTIVE') === 'ACTIVE').length;
  const totalRoutes = routes.length;

  let feeCollected = 0;
  let feePending = 0;
  let overdueCount = 0;
  students.forEach(s => {
    const amt = Number(s.fee_amount || 16500);
    const paid = Number(s.amount_paid || 0);
    const bal = Number(s.fee_balance !== undefined ? s.fee_balance : (amt - paid));
    feeCollected += paid;
    feePending += bal;
    if (s.fee_status === 'OVERDUE') overdueCount++;
  });

  const delayedBuses = buses.filter(b => (b.delay_minutes || b.delayMinutes || 0) > 0);

  return (
    <div className="max-w-7xl mx-auto w-full p-3 sm:p-6 space-y-5">
      {/* Title Bar & Quick Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Central Transport Management System
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ● SQL Live
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Salem Campus Transport Directorate • GPS Telemetry & Student Fare Pass Administration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Reload live database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top 8 KPI Summary Cards */}
      <AdminHeaderKPIs
        studentCount={totalStudents}
        staffCount={totalStaff}
        driverCount={totalDrivers}
        totalBuses={totalBuses}
        activeBuses={activeBuses}
        totalRoutes={totalRoutes}
        totalFeeCollected={feeCollected}
        totalFeePending={feePending}
        overdueCount={overdueCount}
        delayedBusesCount={delayedBuses.length}
        onTimeRate={94.8}
      />

      {/* Admin Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: 'fleet', label: 'Live Fleet Tracking', icon: <Bus className="w-4 h-4" /> },
          { id: 'students', label: 'Student Database', icon: <GraduationCap className="w-4 h-4" />, badge: totalStudents },
          { id: 'fees', label: 'Bus Fee Management', icon: <CreditCard className="w-4 h-4" />, badge: overdueCount > 0 ? overdueCount : undefined },
          { id: 'buses', label: 'Fleet & Buses', icon: <Bus className="w-4 h-4" /> },
          { id: 'routes', label: 'Routes & Stops', icon: <Navigation className="w-4 h-4" /> },
          { id: 'staff_drivers', label: 'Staff & Drivers', icon: <Users className="w-4 h-4" /> },
          { id: 'notifications', label: 'Notifications Hub', icon: <Bell className="w-4 h-4" /> },
          { id: 'analytics', label: 'Operational Analytics', icon: <TrendingUp className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`admin-tab-${tab.id}`}
            onClick={() => setActiveAdminTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition whitespace-nowrap cursor-pointer ${
              activeAdminTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeAdminTab === tab.id ? 'bg-slate-950 text-white' : 'bg-slate-800 text-amber-300'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: LIVE FLEET TRACKING */}
      {activeAdminTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Live Satellite & GPS Telemetry Grid</span>
              </h3>
              <p className="text-xs text-slate-400">
                Interactive real-time transit positions along Salem NH-44, Junction, and Steel Plant corridors
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedBusForDelay(undefined);
                setShowDelayModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Broadcast Delay Alert</span>
            </button>
          </div>

          <MapView heightClass="h-[480px]" showControls={true} />
        </div>
      )}

      {/* TAB 2: STUDENT DATABASE */}
      {activeAdminTab === 'students' && (
        <StudentDatabaseTab
          students={students}
          routes={routes}
          buses={buses}
          onRefresh={loadAllData}
          onOpenAddStudent={() => setShowAddStudentModal(true)}
          onOpenProfile={(id) => setShowProfileStudentId(id)}
          onOpenSendNotification={(id, name) => setNotificationTarget({ id, name })}
          onOpenRecordPayment={(id, name, balance) => setPaymentTarget({ id, name, balance })}
        />
      )}

      {/* TAB 3: BUS FEE MANAGEMENT */}
      {activeAdminTab === 'fees' && (
        <BusFeeManagementTab
          students={students}
          onRefresh={loadAllData}
          onOpenRecordPayment={(id, name, balance) => setPaymentTarget({ id, name, balance })}
          onTriggerReminders={async () => {
            try {
              await api.fees.sendReminders();
              triggerMonthEndFeeReminders();
              loadAllData();
            } catch (err: any) {
              alert(err.message || 'Failed to dispatch reminders');
            }
          }}
        />
      )}

      {/* TAB 4: FLEET & BUSES */}
      {activeAdminTab === 'buses' && (
        <FleetBusesTab
          buses={buses}
          routes={routes}
          drivers={driverList}
          onRefresh={loadAllData}
          onOpenDelayBroadcast={(busId) => {
            setSelectedBusForDelay(busId);
            setShowDelayModal(true);
          }}
        />
      )}

      {/* TAB 5: ROUTES & STOPS */}
      {activeAdminTab === 'routes' && (
        <RoutesStopsTab
          routes={routes}
          onRefresh={loadAllData}
        />
      )}

      {/* TAB 6: STAFF & DRIVERS */}
      {activeAdminTab === 'staff_drivers' && (
        <StaffDriverDatabaseTab
          staffList={staffList}
          driverList={driverList}
        />
      )}

      {/* TAB 7: NOTIFICATIONS HUB */}
      {activeAdminTab === 'notifications' && (
        <NotificationsHubTab
          notifications={notifications}
          onRefresh={loadAllData}
          onOpenBroadcast={() => setNotificationTarget({})}
        />
      )}

      {/* TAB 8: OPERATIONAL ANALYTICS */}
      {activeAdminTab === 'analytics' && (
        <OperationsAnalyticsTab
          buses={buses}
          routes={routes}
          students={students}
        />
      )}

      {/* Modals */}
      {showAddStudentModal && (
        <AddStudentModal
          buses={buses}
          routes={routes}
          onClose={() => setShowAddStudentModal(false)}
          onSuccess={() => loadAllData()}
        />
      )}

      {showProfileStudentId && (
        <StudentProfileModal
          studentId={showProfileStudentId}
          onClose={() => setShowProfileStudentId(null)}
        />
      )}

      {notificationTarget && (
        <SendNotificationModal
          defaultTargetUserId={notificationTarget.id}
          defaultTargetUserName={notificationTarget.name}
          onClose={() => setNotificationTarget(null)}
          onSuccess={() => loadAllData()}
        />
      )}

      {paymentTarget && (
        <RecordPaymentModal
          studentId={paymentTarget.id}
          studentName={paymentTarget.name}
          currentBalance={paymentTarget.balance}
          allStudents={students}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => loadAllData()}
        />
      )}

      {showDelayModal && (
        <DelayNotificationModal
          defaultBusId={selectedBusForDelay}
          onClose={() => setShowDelayModal(false)}
        />
      )}
    </div>
  );
};
