import { Router, Request, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db.js';
import { authenticateUser, authorizeRole } from '../auth.js';
import { processLocationUpdate, broadcast } from '../realtime.js';

const router = Router();

// POST /api/location/update - Driver sends GPS coordinates
router.post('/update', authenticateUser, (req: Request, res: Response): void => {
  try {
    const { busId, latitude, longitude, speed = 0, heading = 0 } = req.body;

    if (!busId || latitude == null || longitude == null) {
      res.status(400).json({ error: 'busId, latitude, and longitude are required.' });
      return;
    }

    const driverUserId = req.user?.id;
    if (!driverUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Role verification: only driver or admin can update location
    if (req.user?.role !== 'driver' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only authorized drivers and admins may transmit bus telemetry' });
      return;
    }

    // If driver, check that driver is assigned to this bus
    if (req.user?.role === 'driver') {
      const bus = queryOne<any>('SELECT assigned_driver_id FROM buses WHERE id = ?', [busId]);
      if (!bus || bus.assigned_driver_id !== driverUserId) {
        res.status(403).json({ error: 'You are not assigned to operate this bus' });
        return;
      }
    }

    const result = processLocationUpdate(
      busId,
      driverUserId,
      Number(latitude),
      Number(longitude),
      Number(speed),
      Number(heading)
    );

    res.json({
      success: true,
      message: 'Location processed and proximity checked',
      data: result,
    });
  } catch (err: any) {
    console.error('Error updating bus location:', err);
    res.status(500).json({ error: err.message || 'Failed to update location' });
  }
});

// GET /api/location/all - Get live coordinates of all buses
router.get('/all', authenticateUser, (_req: Request, res: Response): void => {
  try {
    const buses = queryAll(`
      SELECT 
        b.id,
        b.bus_number,
        b.registration_number,
        b.status,
        b.current_lat,
        b.current_lng,
        b.speed,
        b.heading,
        b.last_updated,
        u.name as driver_name,
        u.phone as driver_phone,
        r.id as route_id,
        r.route_code,
        r.route_name,
        r.color_hex as route_color
      FROM buses b
      LEFT JOIN users u ON b.assigned_driver_id = u.id
      LEFT JOIN routes r ON b.assigned_route_id = r.id
      ORDER BY b.bus_number ASC
    `);

    res.json(buses);
  } catch (err: any) {
    console.error('Error getting all bus locations:', err);
    res.status(500).json({ error: 'Failed to retrieve bus locations' });
  }
});

// GET /api/location/bus/:busId - Single bus live tracking + recent breadcrumbs
router.get('/bus/:busId', authenticateUser, (req: Request, res: Response): void => {
  try {
    const busId = req.params.busId;
    const bus = queryOne<any>(
      `SELECT 
        b.*,
        u.name as driver_name,
        u.phone as driver_phone,
        r.id as route_id,
        r.route_code,
        r.route_name,
        r.color_hex as route_color,
        r.starting_point,
        r.destination
       FROM buses b
       LEFT JOIN users u ON b.assigned_driver_id = u.id
       LEFT JOIN routes r ON b.assigned_route_id = r.id
       WHERE b.id = ?`,
      [busId]
    );

    if (!bus) {
      res.status(404).json({ error: 'Bus not found' });
      return;
    }

    // Fetch stops
    const stops = queryAll(
      'SELECT * FROM bus_stops WHERE route_id = ? ORDER BY sequence_order ASC',
      [bus.route_id]
    );

    // Fetch recent breadcrumbs (last 30 GPS coordinates)
    const breadcrumbs = queryAll(
      `SELECT latitude, longitude, speed, timestamp 
       FROM bus_locations 
       WHERE bus_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 30`,
      [busId]
    );

    res.json({
      bus,
      stops,
      breadcrumbs: breadcrumbs.reverse(),
    });
  } catch (err: any) {
    console.error('Error fetching bus location:', err);
    res.status(500).json({ error: 'Failed to retrieve bus telemetry' });
  }
});

// POST /api/location/trips/start - Start Trip
router.post('/trips/start', authenticateUser, (req: Request, res: Response): void => {
  try {
    const { busId, tripType = 'morning_pickup' } = req.body;
    const driverId = req.user?.id;

    const bus = queryOne<any>('SELECT * FROM buses WHERE id = ?', [busId]);
    if (!bus) {
      res.status(404).json({ error: 'Bus not found' });
      return;
    }

    const tripId = `trp_${Date.now()}`;
    executeRun(
      `INSERT INTO trips (id, bus_id, driver_id, route_id, trip_type, status, start_time)
       VALUES (?, ?, ?, ?, ?, 'in_progress', CURRENT_TIMESTAMP)`,
      [tripId, busId, driverId, bus.assigned_route_id, tripType]
    );

    executeRun('UPDATE buses SET status = "in_trip" WHERE id = ?', [busId]);

    // Send notification to students of this route
    const notifId = `notif_trip_${Date.now()}`;
    executeRun(
      `INSERT INTO notifications (id, title, message, type, priority, target_role, target_bus_id, target_route_id)
       VALUES (?, 'Trip Commenced: ' || ?, 'Your bus ' || ? || ' has begun its scheduled run. Live GPS location is active.', 'TRIP_STARTED', 'normal', 'student', ?, ?)`,
      [notifId, bus.bus_number, bus.bus_number, busId, bus.assigned_route_id]
    );

    broadcast('notification', {
      id: notifId,
      title: `Trip Started: ${bus.bus_number}`,
      message: `${bus.bus_number} has commenced its live route trip. Track progress on your live map.`,
      type: 'TRIP_STARTED',
      priority: 'normal',
      busNumber: bus.bus_number,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Trip started successfully', tripId, busStatus: 'in_trip' });
  } catch (err: any) {
    console.error('Error starting trip:', err);
    res.status(500).json({ error: 'Failed to start trip' });
  }
});

// POST /api/location/trips/end - End Trip
router.post('/trips/end', authenticateUser, (req: Request, res: Response): void => {
  try {
    const { busId } = req.body;

    executeRun(
      `UPDATE trips 
       SET status = 'completed', end_time = CURRENT_TIMESTAMP 
       WHERE bus_id = ? AND status IN ('in_progress', 'paused')`,
      [busId]
    );

    executeRun('UPDATE buses SET status = "idle", speed = 0 WHERE id = ?', [busId]);

    const bus = queryOne<any>('SELECT bus_number, assigned_route_id FROM buses WHERE id = ?', [busId]);
    if (bus) {
      const notifId = `notif_end_${Date.now()}`;
      executeRun(
        `INSERT INTO notifications (id, title, message, type, priority, target_role, target_bus_id, target_route_id)
         VALUES (?, 'Trip Concluded: ' || ?, 'Bus ' || ? || ' has safely completed its trip and reached the campus terminal.', 'TRIP_COMPLETED', 'normal', 'student', ?, ?)`,
        [notifId, bus.bus_number, bus.bus_number, busId, bus.assigned_route_id]
      );

      broadcast('notification', {
        id: notifId,
        title: `Trip Concluded: ${bus.bus_number}`,
        message: `${bus.bus_number} has concluded its run and arrived at destination.`,
        type: 'TRIP_COMPLETED',
        priority: 'normal',
        busNumber: bus.bus_number,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ message: 'Trip concluded', busStatus: 'idle' });
  } catch (err: any) {
    console.error('Error ending trip:', err);
    res.status(500).json({ error: 'Failed to end trip' });
  }
});

export default router;
