import { Response } from 'express';
import { queryAll, queryOne, executeRun, haversineDistanceMeters } from './db.js';

interface ConnectedClient {
  id: string;
  userId: string;
  role: string;
  res: Response;
}

const clients: Map<string, ConnectedClient> = new Map();

// Throttling map: key = `busId_stopId_type`, value = timestamp of last trigger
const notificationCooldowns: Map<string, number> = new Map();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export function addClient(id: string, userId: string, role: string, res: Response) {
  clients.set(id, { id, userId, role, res });
  console.log(`[Realtime SSE] Client connected: ${userId} (${role}). Total: ${clients.size}`);

  // Send initial connected acknowledgement
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId: id, timestamp: new Date().toISOString() })}\n\n`);
}

export function removeClient(id: string) {
  clients.delete(id);
  console.log(`[Realtime SSE] Client disconnected: ${id}. Remaining: ${clients.size}`);
}

export function broadcast(
  event: string,
  payload: any,
  filter?: (client: ConnectedClient) => boolean
) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients.values()) {
    if (!filter || filter(client)) {
      try {
        client.res.write(message);
      } catch (err) {
        console.error(`Failed to send event to client ${client.id}:`, err);
      }
    }
  }
}

// Keep-alive heartbeat every 20 seconds
setInterval(() => {
  for (const client of clients.values()) {
    try {
      client.res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      clients.delete(client.id);
    }
  }
}, 20000);

/**
 * Core Bus Proximity Engine:
 * 1. Updates Bus GPS in database
 * 2. Compares Bus Location with Assigned Student Bus Stops using Haversine
 * 3. Triggers throttled automatic Near-Stop Notifications
 * 4. Broadcasts live location update to all listening clients
 */
export function processLocationUpdate(
  busId: string,
  driverUserId: string,
  latitude: number,
  longitude: number,
  speed: number = 0,
  heading: number = 0
) {
  // 1. Verify bus exists and matches driver
  const bus = queryOne<any>(
    `SELECT b.*, r.route_name, r.route_code 
     FROM buses b 
     LEFT JOIN routes r ON b.assigned_route_id = r.id 
     WHERE b.id = ?`,
    [busId]
  );

  if (!bus) {
    throw new Error(`Bus with ID ${busId} not found`);
  }

  // 2. Update Bus coordinates & status
  executeRun(
    `UPDATE buses 
     SET current_lat = ?, current_lng = ?, speed = ?, heading = ?, status = 'in_trip', last_updated = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [latitude, longitude, speed, heading, busId]
  );

  // 3. Log into bus_locations table
  const locId = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  executeRun(
    `INSERT INTO bus_locations (id, bus_id, driver_id, latitude, longitude, speed, heading, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [locId, busId, driverUserId, latitude, longitude, speed, heading]
  );

  // 4. Check Proximity to All Stops on this Bus's Route
  const stops = queryAll<any>(
    `SELECT s.* 
     FROM bus_stops s 
     WHERE s.route_id = ? 
     ORDER BY s.sequence_order ASC`,
    [bus.assigned_route_id]
  );

  const proximityAlerts: any[] = [];
  const now = Date.now();

  for (const stop of stops) {
    const distMeters = haversineDistanceMeters(
      latitude,
      longitude,
      stop.latitude,
      stop.longitude
    );

    // Find all students assigned to this specific stop on this bus
    const studentsAtStop = queryAll<any>(
      `SELECT st.*, u.id as user_id, u.name as student_name 
       FROM students st 
       JOIN users u ON st.user_id = u.id 
       WHERE st.assigned_bus_id = ? AND st.assigned_stop_id = ?`,
      [busId, stop.id]
    );

    // Scenario A: Within 500 meters (Approaching)
    if (distMeters <= 550 && distMeters > 100) {
      const cooldownKey = `${busId}_${stop.id}_approaching`;
      const lastSent = notificationCooldowns.get(cooldownKey) || 0;

      if (now - lastSent > COOLDOWN_MS) {
        notificationCooldowns.set(cooldownKey, now);

        const notifId = `notif_appr_${now}_${Math.random().toString(36).substr(2, 5)}`;
        const title = `🚌 Your Bus is Approaching!`;
        const estMinutes = Math.max(1, Math.round(distMeters / (Math.max(speed, 20) * 16.6)));
        const message = `${bus.bus_number} is approximately ${Math.round(distMeters)}m from ${stop.stop_name}. Estimated arrival in ~${estMinutes} minute${estMinutes > 1 ? 's' : ''}.`;

        executeRun(
          `INSERT INTO notifications (id, title, message, type, priority, target_role, target_bus_id, target_route_id)
           VALUES (?, ?, ?, 'BUS_APPROACHING', 'high', 'student', ?, ?)`,
          [notifId, title, message, busId, bus.assigned_route_id]
        );

        for (const student of studentsAtStop) {
          const recId = `nr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          executeRun(
            `INSERT INTO notification_recipients (id, notification_id, user_id, is_read)
             VALUES (?, ?, ?, 0)`,
            [recId, notifId, student.user_id]
          );
        }

        proximityAlerts.push({
          type: 'BUS_APPROACHING',
          stopName: stop.stop_name,
          distanceMeters: Math.round(distMeters),
          busNumber: bus.bus_number,
          affectedStudents: studentsAtStop.length,
        });

        // Broadcast to relevant students
        broadcast('notification', {
          id: notifId,
          title,
          message,
          type: 'BUS_APPROACHING',
          priority: 'high',
          busNumber: bus.bus_number,
          stopName: stop.stop_name,
          distanceMeters: Math.round(distMeters),
          timestamp: new Date().toISOString(),
        }, (c) => studentsAtStop.some(st => st.user_id === c.userId) || c.role === 'admin');
      }
    }

    // Scenario B: Within 100 meters (Arrived)
    if (distMeters <= 100) {
      const cooldownKey = `${busId}_${stop.id}_arrived`;
      const lastSent = notificationCooldowns.get(cooldownKey) || 0;

      if (now - lastSent > COOLDOWN_MS) {
        notificationCooldowns.set(cooldownKey, now);

        const notifId = `notif_arr_${now}_${Math.random().toString(36).substr(2, 5)}`;
        const title = `📍 Bus Arrived at Stop`;
        const message = `${bus.bus_number} has reached ${stop.stop_name}. Boarding in progress.`;

        executeRun(
          `INSERT INTO notifications (id, title, message, type, priority, target_role, target_bus_id, target_route_id)
           VALUES (?, ?, ?, 'BUS_ARRIVED', 'high', 'student', ?, ?)`,
          [notifId, title, message, busId, bus.assigned_route_id]
        );

        for (const student of studentsAtStop) {
          const recId = `nr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          executeRun(
            `INSERT INTO notification_recipients (id, notification_id, user_id, is_read)
             VALUES (?, ?, ?, 0)`,
            [recId, notifId, student.user_id]
          );
        }

        proximityAlerts.push({
          type: 'BUS_ARRIVED',
          stopName: stop.stop_name,
          busNumber: bus.bus_number,
        });

        broadcast('notification', {
          id: notifId,
          title,
          message,
          type: 'BUS_ARRIVED',
          priority: 'high',
          busNumber: bus.bus_number,
          stopName: stop.stop_name,
          timestamp: new Date().toISOString(),
        }, (c) => studentsAtStop.some(st => st.user_id === c.userId) || c.role === 'admin');
      }
    }
  }

  // 5. Broadcast Location to all connected clients
  const locationPayload = {
    busId,
    busNumber: bus.bus_number,
    registrationNumber: bus.registration_number,
    routeId: bus.assigned_route_id,
    routeName: bus.route_name,
    latitude,
    longitude,
    speed,
    heading,
    status: 'in_trip',
    timestamp: new Date().toISOString(),
    proximityAlerts,
  };

  broadcast('location_update', locationPayload);

  return locationPayload;
}
