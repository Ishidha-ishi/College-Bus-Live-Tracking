import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, Bus, BusRoute, PushNotification, IncidentReport, TravelLog, FeeRecord, 
  UserRole, IncidentStatus, FeePaymentStatus, RealTimeRegistrationData 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_BUSES, INITIAL_ROUTES, INITIAL_NOTIFICATIONS, 
  INITIAL_INCIDENTS, INITIAL_TRAVEL_LOGS, INITIAL_FEES 
} from '../data/mockData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  buses: Bus[];
  routes: BusRoute[];
  notifications: PushNotification[];
  incidents: IncidentReport[];
  travelLogs: TravelLog[];
  fees: FeeRecord[];
  
  // Selection and Map View State
  activeRouteId: string;
  setActiveRouteId: (id: string) => void;
  selectedBusId: string | null;
  setSelectedBusId: (id: string | null) => void;
  
  // Simulation Controls
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  simSpeed: number;
  setSimSpeed: (val: number) => void;
  isTrafficEnabled: boolean;
  setIsTrafficEnabled: (val: boolean) => void;
  
  // View controls
  activeViewMode: 'login' | 'mobile' | 'admin_portal' | 'driver_console';
  setActiveViewMode: (mode: 'login' | 'mobile' | 'admin_portal' | 'driver_console') => void;
  activeMobileTab: 'map' | 'pass' | 'fees' | 'incidents' | 'alerts';
  setActiveMobileTab: (tab: 'map' | 'pass' | 'fees' | 'incidents' | 'alerts') => void;
  login: (user: User, token?: string) => void;
  logout: () => void;
  
  // Real-Time Registration Modal Control
  isRegistrationOpen: boolean;
  setIsRegistrationOpen: (open: boolean) => void;
  registerUserRealTime: (data: RealTimeRegistrationData) => User;

  // Audio & Notification Toggles
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  activeToast: PushNotification | null;
  dismissToast: () => void;
  
  // Business logic actions
  sendDelayNotification: (routeId: string, busId: string, delayMinutes: number, reason: string) => void;
  reportIncident: (data: Omit<IncidentReport, 'id' | 'timestamp' | 'status'>) => void;
  updateIncidentStatus: (id: string, status: IncidentStatus, adminNotes?: string) => void;
  payBusFee: (feeId: string, paymentMethod: string) => void;
  triggerMonthEndFeeReminders: () => { sentCount: number };
  triggerSingleFeeReminder: (feeId: string) => void;
  addUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  simulateSuddenDelay: (busId: string) => void;
  resetAllData: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  switchUserRole: (role: UserRole) => void;
  
  // Helpers
  getBusByRoute: (routeId: string) => Bus | undefined;
  getRouteById: (routeId: string) => BusRoute | undefined;
  getStudentFeeRecord: (studentId: string) => FeeRecord | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'bus_tracking_users_salem_v2',
  BUSES: 'bus_tracking_buses_salem_v2',
  ROUTES: 'bus_tracking_routes_salem_v2',
  NOTIFICATIONS: 'bus_tracking_notifications_salem_v2',
  INCIDENTS: 'bus_tracking_incidents_salem_v2',
  LOGS: 'bus_tracking_logs_salem_v2',
  FEES: 'bus_tracking_fees_salem_v2',
  CURRENT_USER_ID: 'bus_tracking_current_user_id_salem_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or defaults
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [buses, setBuses] = useState<Bus[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUSES);
    return saved ? JSON.parse(saved) : INITIAL_BUSES;
  });

  const [routes] = useState<BusRoute[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROUTES);
    return saved ? JSON.parse(saved) : INITIAL_ROUTES;
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [incidents, setIncidents] = useState<IncidentReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });

  const [travelLogs, setTravelLogs] = useState<TravelLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : INITIAL_TRAVEL_LOGS;
  });

  const [fees, setFees] = useState<FeeRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FEES);
    return saved ? JSON.parse(saved) : INITIAL_FEES;
  });

  // Current logged in user
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const found = users.find(u => u.id === savedId);
    return found || users[1]; // default to Priya Sharma (Student) for instant mobile context
  });

  // UI / Map / Simulation states
  const [activeRouteId, setActiveRouteId] = useState<string>('route-1');
  const [selectedBusId, setSelectedBusId] = useState<string | null>('bus-101');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isTrafficEnabled, setIsTrafficEnabled] = useState<boolean>(true);
  const [activeViewMode, setActiveViewMode] = useState<'login' | 'mobile' | 'admin_portal' | 'driver_console'>('login');
  const [activeMobileTab, setActiveMobileTab] = useState<'map' | 'pass' | 'fees' | 'incidents' | 'alerts'>('map');
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeToast, setActiveToast] = useState<PushNotification | null>(null);

  const login = useCallback((user: User, token?: string) => {
    if (token) {
      localStorage.setItem('buslive_auth_token', token);
    }
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    if (user.role === 'admin') {
      setActiveViewMode('admin_portal');
    } else if (user.role === 'driver') {
      setActiveViewMode('driver_console');
    } else {
      setActiveViewMode('mobile');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('buslive_auth_token');
    setActiveViewMode('login');
  }, []);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUSES, JSON.stringify(buses));
  }, [buses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(travelLogs));
  }, [travelLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(fees));
  }, [fees]);

  const setCurrentUser = useCallback((user: User) => {
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    // Automatically set view mode when role changes
    if (user.role === 'admin') {
      setActiveViewMode('admin_portal');
    } else if (user.role === 'driver') {
      setActiveViewMode('driver_console');
    } else {
      setActiveViewMode('mobile');
    }
  }, []);

  // Play audio notification chime if sound enabled
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio context may be restricted before user gesture
    }
  }, [soundEnabled]);

  const triggerToast = useCallback((notif: PushNotification) => {
    setActiveToast(notif);
    playChime();
  }, [playChime]);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Simulation tick: move buses along their route coordinates smoothly
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setBuses((prevBuses) => {
        return prevBuses.map((bus) => {
          if (bus.status === 'stopped' || bus.status === 'maintenance') return bus;

          const route = routes.find((r) => r.id === bus.routeId);
          if (!route || route.pathCoordinates.length < 2) return bus;

          const coords = route.pathCoordinates;
          // Find nearest path index or progress along path
          let closestIdx = 0;
          let minDist = Infinity;

          for (let i = 0; i < coords.length; i++) {
            const d = Math.hypot(coords[i][0] - bus.currentLat, coords[i][1] - bus.currentLng);
            if (d < minDist) {
              minDist = d;
              closestIdx = i;
            }
          }

          // Target next waypoint
          const nextIdx = (closestIdx + 1) % coords.length;
          const targetCoord = coords[nextIdx];

          // Calculate step delta based on speed and simulation multiplier
          const stepSize = 0.0003 * simSpeed;
          const dLat = targetCoord[0] - bus.currentLat;
          const dLng = targetCoord[1] - bus.currentLng;
          const dist = Math.hypot(dLat, dLng);

          let newLat = bus.currentLat;
          let newLng = bus.currentLng;
          let newHeading = bus.heading;

          if (dist > stepSize) {
            newLat = bus.currentLat + (dLat / dist) * stepSize;
            newLng = bus.currentLng + (dLng / dist) * stepSize;
            newHeading = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
          } else {
            newLat = targetCoord[0];
            newLng = targetCoord[1];
          }

          // Estimated time to next stop fluctuates naturally
          const newEta = Math.max(1, Math.round(bus.estimatedNextStopMins + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0)));

          return {
            ...bus,
            currentLat: newLat,
            currentLng: newLng,
            heading: newHeading,
            estimatedNextStopMins: newEta,
            lastUpdated: 'Live GPS',
          };
        });
      });
    }, 1500 / simSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed, routes]);

  // Send delay notification
  const sendDelayNotification = useCallback((routeId: string, busId: string, delayMinutes: number, reason: string) => {
    const route = routes.find(r => r.id === routeId);
    const bus = buses.find(b => b.id === busId);
    const routeName = route ? route.name : 'Selected Route';
    const busName = bus ? bus.busNumber : 'Bus';

    const newNotif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: `⚠️ Delay Alert: ${busName}`,
      message: `${busName} (${routeName}) is delayed by ${delayMinutes} mins. Reason: ${reason || 'Traffic congestion'}.`,
      type: 'delay',
      routeId,
      busId,
      timestamp: 'Just now',
      read: false,
      severity: 'warning',
      targetRole: 'all',
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Update the bus delay status
    setBuses(prev => prev.map(b => {
      if (b.id === busId) {
        return {
          ...b,
          status: delayMinutes > 0 ? 'delayed' : 'on_route',
          delayMinutes,
          delayReason: reason,
          estimatedNextStopMins: b.estimatedNextStopMins + delayMinutes,
        };
      }
      return b;
    }));

    triggerToast(newNotif);
  }, [routes, buses, triggerToast]);

  // Report incident
  const reportIncident = useCallback((data: Omit<IncidentReport, 'id' | 'timestamp' | 'status'>) => {
    const newIncident: IncidentReport = {
      ...data,
      id: `inc-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'open',
    };

    setIncidents(prev => [newIncident, ...prev]);

    // Push notification for ticket creation
    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: '📋 Incident Ticket Registered',
      message: `Your report "${data.title}" has been filed. The Transport Admin desk has been alerted.`,
      type: 'incident_update',
      timestamp: 'Just now',
      read: false,
      severity: 'info',
      targetRole: 'all',
    };

    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  }, [triggerToast]);

  // Update incident status
  const updateIncidentStatus = useCallback((id: string, status: IncidentStatus, adminNotes?: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status,
          adminNotes: adminNotes ?? inc.adminNotes,
          resolvedAt: status === 'resolved' ? new Date().toISOString().replace('T', ' ').substring(0, 16) : inc.resolvedAt,
        };
      }
      return inc;
    }));

    const inc = incidents.find(i => i.id === id);
    if (inc) {
      const statusLabel = status === 'resolved' ? 'Resolved' : status === 'investigating' ? 'Under Investigation' : 'Updated';
      const notif: PushNotification = {
        id: `notif-${Date.now()}`,
        title: `Incident ${statusLabel}: ${inc.title.slice(0, 30)}...`,
        message: adminNotes ? `Admin note: "${adminNotes}"` : `Status updated to ${statusLabel}.`,
        type: 'incident_update',
        timestamp: 'Just now',
        read: false,
        severity: status === 'resolved' ? 'info' : 'warning',
      };
      setNotifications(prev => [notif, ...prev]);
      triggerToast(notif);
    }
  }, [incidents, triggerToast]);

  // Pay bus fee
  const payBusFee = useCallback((feeId: string, paymentMethod: string) => {
    const txnId = `TXN-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    
    setFees(prev => prev.map(f => {
      if (f.id === feeId) {
        return {
          ...f,
          paidAmount: f.totalAmount,
          status: 'paid',
          paymentMethod,
          transactionId: txnId,
        };
      }
      return f;
    }));

    // Update user if matches
    const feeItem = fees.find(f => f.id === feeId);
    if (feeItem) {
      setUsers(prev => prev.map(u => {
        if (u.studentOrStaffId === feeItem.studentId || u.email === feeItem.studentEmail) {
          return {
            ...u,
            feeStatus: 'paid',
            lastPaymentDate: new Date().toISOString().split('T')[0],
          };
        }
        return u;
      }));

      // If current user is this student, update state directly
      if (currentUser.studentOrStaffId === feeItem.studentId) {
        setCurrentUserState(prev => ({
          ...prev,
          feeStatus: 'paid',
          lastPaymentDate: new Date().toISOString().split('T')[0],
        }));
      }

      const notif: PushNotification = {
        id: `notif-${Date.now()}`,
        title: '✅ Bus Fee Payment Confirmed',
        message: `₹${feeItem.totalAmount} paid successfully via ${paymentMethod}. Txn ID: ${txnId}. Digital Pass is active!`,
        type: 'fee_reminder',
        timestamp: 'Just now',
        read: false,
        severity: 'info',
        targetRole: 'student',
      };
      setNotifications(prev => [notif, ...prev]);
      triggerToast(notif);
    }
  }, [fees, currentUser, triggerToast]);

  // Trigger month-end reminders for all unpaid students
  const triggerMonthEndFeeReminders = useCallback(() => {
    const unpaidFees = fees.filter(f => f.status === 'pending' || f.status === 'overdue');
    const nowStr = new Date().toISOString().split('T')[0];

    // Update fee records reminders count
    setFees(prev => prev.map(f => {
      if (f.status === 'pending' || f.status === 'overdue') {
        return {
          ...f,
          remindersSentCount: f.remindersSentCount + 1,
          lastReminderDate: nowStr,
        };
      }
      return f;
    }));

    // Push broadcast notification
    const broadcastNotif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: '🚨 Urgent: Month-End Bus Fee Due Reminder',
      message: `Attention Students: The month has ended! Please clear your bus fees immediately to ensure uninterrupted transport service. Unpaid passes will be locked after grace period.`,
      type: 'fee_reminder',
      timestamp: 'Just now',
      read: false,
      severity: 'urgent',
      targetRole: 'student',
    };

    setNotifications(prev => [broadcastNotif, ...prev]);
    triggerToast(broadcastNotif);

    return { sentCount: unpaidFees.length };
  }, [fees, triggerToast]);

  // Trigger individual student fee reminder
  const triggerSingleFeeReminder = useCallback((feeId: string) => {
    const fee = fees.find(f => f.id === feeId);
    if (!fee) return;

    const nowStr = new Date().toISOString().split('T')[0];
    setFees(prev => prev.map(f => {
      if (f.id === feeId) {
        return {
          ...f,
          remindersSentCount: f.remindersSentCount + 1,
          lastReminderDate: nowStr,
        };
      }
      return f;
    }));

    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: `🔔 Bus Fee Reminder for ${fee.studentName}`,
      message: `Reminder: Bus fees of ₹${fee.totalAmount - fee.paidAmount} for ${fee.academicTerm} are overdue. Please pay via the student portal.`,
      type: 'fee_reminder',
      timestamp: 'Just now',
      read: false,
      severity: 'warning',
      targetRole: 'student',
    };

    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  }, [fees, triggerToast]);

  // User CRUD
  const addUser = useCallback((userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    setUsers(prev => [...prev, newUser]);
  }, []);

  // Real-Time Registration for Tamil Nadu Campus Bus Pass
  const registerUserRealTime = useCallback((data: RealTimeRegistrationData): User => {
    const isPaid = data.paymentChoice === 'pay_now';
    const uniqueId = `user-reg-${Date.now()}`;
    const selectedRoute = routes.find(r => r.id === data.assignedRouteId) || routes[0];
    const passNo = data.studentOrStaffId || `TN-PASS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: User = {
      id: uniqueId,
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: '',
      phone: data.phone,
      departmentOrClass: data.departmentOrClass + (data.yearOfStudy ? ` (${data.yearOfStudy})` : ''),
      studentOrStaffId: passNo,
      assignedRouteId: data.assignedRouteId,
      assignedStopId: data.assignedStopId,
      parentPhone: data.parentPhone,
      feeStatus: isPaid ? 'paid' : 'pending',
      feeAmount: data.feeAmount,
      feeDueDate: '2026-09-30',
      lastPaymentDate: isPaid ? new Date().toISOString().split('T')[0] : undefined,
      status: 'active',
    };

    // Create corresponding FeeRecord
    const newFee: FeeRecord = {
      id: `fee-${Date.now()}`,
      studentId: newUser.studentOrStaffId,
      studentName: newUser.name,
      studentEmail: newUser.email,
      routeName: selectedRoute.name,
      academicTerm: data.role === 'student' ? 'Term 1 (Sep - Dec 2026)' : 'Staff Semester Pass 2026',
      totalAmount: data.feeAmount,
      paidAmount: isPaid ? data.feeAmount : 0,
      status: isPaid ? 'paid' : 'pending',
      dueDate: '2026-09-30',
      paymentMethod: isPaid ? (data.paymentMethod || 'UPI (Google Pay / PhonePe)') : undefined,
      transactionId: isPaid ? `UPI-TN-${Math.floor(100000000000 + Math.random() * 900000000000)}` : undefined,
      remindersSentCount: 0,
    };

    // Add user and fee record in real-time
    setUsers(prev => [newUser, ...prev]);
    setFees(prev => [newFee, ...prev]);

    // Automatically log in as the newly registered user
    setCurrentUserState(newUser);
    setActiveRouteId(data.assignedRouteId);
    if (selectedRoute.activeBusId) {
      setSelectedBusId(selectedRoute.activeBusId);
    }
    setActiveViewMode('mobile');
    setActiveMobileTab('pass');

    // Welcome Notification
    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: `🎉 Bus Pass Activated: ${newUser.name}`,
      message: `Welcome to Tamil Nadu Campus Bus Tracking! Your pass (${newUser.studentOrStaffId}) is activated for ${selectedRoute.name} (${selectedRoute.code}).`,
      type: 'arrival',
      routeId: selectedRoute.id,
      timestamp: 'Just now',
      read: false,
      severity: 'info',
      targetRole: data.role === 'admin' ? 'all' : data.role,
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);

    return newUser;
  }, [routes, triggerToast]);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser.id === id) {
      setCurrentUserState(prev => ({ ...prev, ...updates }));
    }
  }, [currentUser]);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  // Simulate a sudden 15m delay with traffic alert
  const simulateSuddenDelay = useCallback((busId: string) => {
    const bus = buses.find(b => b.id === busId) || buses[0];
    sendDelayNotification(bus.routeId, bus.id, 15, 'Sudden breakdown / road maintenance obstruction on main corridor');
  }, [buses, sendDelayNotification]);

  const resetAllData = useCallback(() => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setBuses(INITIAL_BUSES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setIncidents(INITIAL_INCIDENTS);
    setTravelLogs(INITIAL_TRAVEL_LOGS);
    setFees(INITIAL_FEES);
    setCurrentUserState(INITIAL_USERS[1]);
    setActiveRouteId('route-1');
    setSelectedBusId('bus-101');
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const switchUserRole = useCallback((role: UserRole) => {
    const user = users.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
    }
  }, [users, setCurrentUser]);

  const getBusByRoute = useCallback((routeId: string) => {
    return buses.find(b => b.routeId === routeId);
  }, [buses]);

  const getRouteById = useCallback((routeId: string) => {
    return routes.find(r => r.id === routeId);
  }, [routes]);

  const getStudentFeeRecord = useCallback((studentId: string) => {
    return fees.find(f => f.studentId === studentId || f.studentEmail === currentUser.email);
  }, [fees, currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        buses,
        routes,
        notifications,
        incidents,
        travelLogs,
        fees,
        activeRouteId,
        setActiveRouteId,
        selectedBusId,
        setSelectedBusId,
        isSimulating,
        setIsSimulating,
        simSpeed,
        setSimSpeed,
        isTrafficEnabled,
        setIsTrafficEnabled,
        activeViewMode,
        setActiveViewMode,
        activeMobileTab,
        setActiveMobileTab,
        login,
        logout,
        isRegistrationOpen,
        setIsRegistrationOpen,
        registerUserRealTime,
        soundEnabled,
        setSoundEnabled,
        activeToast,
        dismissToast,
        sendDelayNotification,
        reportIncident,
        updateIncidentStatus,
        payBusFee,
        triggerMonthEndFeeReminders,
        triggerSingleFeeReminder,
        addUser,
        updateUser,
        deleteUser,
        simulateSuddenDelay,
        resetAllData,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        switchUserRole,
        getBusByRoute,
        getRouteById,
        getStudentFeeRecord,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
