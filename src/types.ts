export type UserRole = 'student' | 'staff' | 'admin' | 'driver';

export type FeePaymentStatus = 'paid' | 'pending' | 'overdue';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone: string;
  departmentOrClass?: string;
  studentOrStaffId: string;
  assignedRouteId?: string;
  assignedStopId?: string;
  parentPhone?: string;
  feeStatus: FeePaymentStatus;
  feeAmount: number;
  feeDueDate: string;
  lastPaymentDate?: string;
  status: 'active' | 'suspended';
}

export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  scheduledTime: string;
  studentCountWaiting: number;
  landmark: string;
}

export type BusStatus = 'on_route' | 'delayed' | 'stopped' | 'maintenance';

export interface Bus {
  id: string;
  busNumber: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  currentOccupancy: number;
  routeId: string;
  speed: number; // in km/h
  status: BusStatus;
  delayMinutes: number;
  delayReason?: string;
  currentLat: number;
  currentLng: number;
  heading: number; // 0-360
  nextStopId: string;
  estimatedNextStopMins: number;
  lastUpdated: string;
  isAc: boolean;
}

export interface BusRoute {
  id: string;
  name: string;
  code: string;
  color: string;
  stops: BusStop[];
  pathCoordinates: [number, number][];
  morningDeparture: string;
  eveningReturn: string;
  activeBusId: string;
  description: string;
}

export type NotificationType = 'delay' | 'fee_reminder' | 'incident_update' | 'arrival' | 'emergency';

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  routeId?: string;
  busId?: string;
  timestamp: string;
  read: boolean;
  targetRole?: 'all' | 'student' | 'staff' | 'driver';
  severity?: 'info' | 'warning' | 'urgent';
}

export type IncidentCategory = 
  | 'delay' 
  | 'rash_driving' 
  | 'cleanliness_ac' 
  | 'breakdown' 
  | 'route_deviation' 
  | 'lost_and_found' 
  | 'overcrowding' 
  | 'driver_behavior' 
  | 'other';

export type IncidentStatus = 'open' | 'investigating' | 'resolved';

export interface IncidentReport {
  id: string;
  title: string;
  category: IncidentCategory;
  description: string;
  busId?: string;
  routeId?: string;
  reportedByUserId: string;
  reporterName: string;
  reporterRole: UserRole;
  reporterPhone: string;
  timestamp: string;
  status: IncidentStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  resolvedAt?: string;
}

export interface TravelLog {
  id: string;
  tripDate: string;
  busNumber: string;
  routeName: string;
  driverName: string;
  departureTime: string;
  arrivalTime: string;
  scheduledArrival: string;
  status: 'on_time' | 'delayed' | 'diverted' | 'breakdown';
  delayMinutes: number;
  totalPassengers: number;
  incidentsLogged: number;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  routeName: string;
  academicTerm: string;
  totalAmount: number;
  paidAmount: number;
  status: FeePaymentStatus;
  dueDate: string;
  paymentMethod?: string;
  transactionId?: string;
  remindersSentCount: number;
  lastReminderDate?: string;
}

export interface RealTimeRegistrationData {
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  studentOrStaffId: string;
  departmentOrClass: string;
  yearOfStudy?: string;
  assignedRouteId: string;
  assignedStopId: string;
  parentPhone?: string;
  feeAmount: number;
  paymentChoice: 'pay_now' | 'pay_later';
  paymentMethod?: string;
}
