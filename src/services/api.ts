// Real REST API Client connecting to the Node.js + Express + SQLite Backend

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('buslive_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('buslive_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('buslive_token');
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string; role?: string }) =>
      request<{ message: string; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    me: () => request<{ user: any }>('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },

  // Students
  students: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<{ data: any[]; pagination: any }>(`/students${query}`);
    },
    getById: (id: string) => request<any>(`/students/${id}`),
    create: (data: any) => request<any>('/students', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/students/${id}`, { method: 'DELETE' }),
  },

  // Buses
  buses: {
    getAll: () => request<any[]>('/buses'),
    getById: (id: string) => request<any>(`/buses/${id}`),
    create: (data: any) => request<any>('/buses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/buses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/buses/${id}`, { method: 'DELETE' }),
  },

  // Routes
  routes: {
    getAll: () => request<any[]>('/routes'),
    getById: (id: string) => request<any>(`/routes/${id}`),
    create: (data: any) => request<any>('/routes', { method: 'POST', body: JSON.stringify(data) }),
    addStop: (routeId: string, stopData: any) =>
      request<any>(`/routes/${routeId}/stops`, { method: 'POST', body: JSON.stringify(stopData) }),
    deleteStop: (stopId: string) => request<any>(`/routes/stops/${stopId}`, { method: 'DELETE' }),
  },

  // Fees
  fees: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<any[]>(`/fees${query}`);
    },
    getStats: () => request<any>('/fees/stats'),
    getStudentFee: (studentId: string) => request<any>(`/fees/student/${studentId}`),
    recordPayment: (paymentData: any) =>
      request<any>('/fees/payments', { method: 'POST', body: JSON.stringify(paymentData) }),
    sendReminders: () => request<any>('/fees/remind', { method: 'POST' }),
  },

  // Location & Telemetry
  location: {
    update: (data: { busId: string; latitude: number; longitude: number; speed?: number; heading?: number }) =>
      request<any>('/location/update', { method: 'POST', body: JSON.stringify(data) }),
    getAll: () => request<any[]>('/location/all'),
    getBus: (busId: string) => request<any>(`/location/bus/${busId}`),
    startTrip: (busId: string, tripType?: string) =>
      request<any>('/location/trips/start', { method: 'POST', body: JSON.stringify({ busId, tripType }) }),
    endTrip: (busId: string) =>
      request<any>('/location/trips/end', { method: 'POST', body: JSON.stringify({ busId }) }),
  },

  // Notifications
  notifications: {
    getAll: () => request<any[]>('/notifications'),
    markRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),
    broadcast: (data: {
      title: string;
      message: string;
      type?: string;
      priority?: string;
      targetRole?: string;
      targetBusId?: string;
      targetRouteId?: string;
      targetUserId?: string;
    }) => request<any>('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Analytics
  analytics: {
    get: () => request<any>('/analytics'),
  },

  // Staff & Drivers
  staff: {
    getAll: () => request<any[]>('/staff'),
    getDrivers: () => request<any[]>('/staff/drivers'),
  },
};
