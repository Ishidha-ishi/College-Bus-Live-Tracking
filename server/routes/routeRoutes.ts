import { Router, Request, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db.js';
import { authenticateUser, authorizeRole } from '../auth.js';

const router = Router();

// GET /api/routes - List all routes with stops and buses
router.get('/', authenticateUser, (_req: Request, res: Response): void => {
  try {
    const routes = queryAll(`SELECT * FROM routes ORDER BY route_code ASC`);

    const detailedRoutes = routes.map((r) => {
      const stops = queryAll(
        `SELECT * FROM bus_stops WHERE route_id = ? ORDER BY sequence_order ASC`,
        [r.id]
      );
      const assignedBuses = queryAll(
        `SELECT id, bus_number, registration_number, status, current_lat, current_lng, speed 
         FROM buses WHERE assigned_route_id = ?`,
        [r.id]
      );
      const studentCount = queryOne<any>(
        `SELECT COUNT(*) as count FROM students WHERE assigned_route_id = ?`,
        [r.id]
      )?.count || 0;

      return {
        ...r,
        stops,
        assignedBuses,
        studentCount,
      };
    });

    res.json(detailedRoutes);
  } catch (err: any) {
    console.error('Error fetching routes:', err);
    res.status(500).json({ error: 'Failed to retrieve routes' });
  }
});

// GET /api/routes/:id - Single route with stops
router.get('/:id', authenticateUser, (req: Request, res: Response): void => {
  try {
    const route = queryOne<any>('SELECT * FROM routes WHERE id = ?', [req.params.id]);
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    const stops = queryAll(
      'SELECT * FROM bus_stops WHERE route_id = ? ORDER BY sequence_order ASC',
      [route.id]
    );
    const assignedBuses = queryAll(
      'SELECT * FROM buses WHERE assigned_route_id = ?',
      [route.id]
    );

    res.json({ ...route, stops, assignedBuses });
  } catch (err: any) {
    console.error('Error fetching route:', err);
    res.status(500).json({ error: 'Failed to retrieve route' });
  }
});

// POST /api/routes - Add new route (Admin only)
router.post('/', authenticateUser, authorizeRole('admin'), (req: Request, res: Response): void => {
  try {
    const {
      routeCode,
      routeName,
      startingPoint,
      destination,
      colorHex = '#3B82F6',
      totalDistanceKm = 15,
      morningTime = '07:30 AM',
      eveningTime = '04:45 PM',
      stops = [],
    } = req.body;

    if (!routeCode || !routeName || !startingPoint || !destination) {
      res.status(400).json({ error: 'Route code, name, starting point, and destination are required' });
      return;
    }

    const routeId = `rt_${Date.now()}`;
    executeRun(
      `INSERT INTO routes (id, route_code, route_name, starting_point, destination, color_hex, total_distance_km, morning_time, evening_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [routeId, routeCode.trim().toUpperCase(), routeName.trim(), startingPoint.trim(), destination.trim(), colorHex, Number(totalDistanceKm), morningTime, eveningTime]
    );

    // If stops are supplied in array, insert them
    if (Array.isArray(stops)) {
      stops.forEach((st: any, idx: number) => {
        const stopId = `stp_${Date.now()}_${idx}`;
        executeRun(
          `INSERT INTO bus_stops (id, route_id, stop_name, latitude, longitude, sequence_order, morning_pickup_time, evening_drop_time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [stopId, routeId, st.stopName || st.stop_name, Number(st.latitude || st.lat), Number(st.longitude || st.lng), idx + 1, st.morningPickupTime || '07:45 AM', st.eveningDropTime || '05:00 PM']
        );
      });
    }

    res.status(201).json({ message: 'Route created successfully', routeId });
  } catch (err: any) {
    console.error('Error adding route:', err);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

// POST /api/routes/:id/stops - Add a stop to a route
router.post('/:id/stops', authenticateUser, authorizeRole('admin'), (req: Request, res: Response): void => {
  try {
    const routeId = req.params.id;
    const { stopName, latitude, longitude, sequenceOrder, morningPickupTime, eveningDropTime } = req.body;

    if (!stopName || latitude == null || longitude == null) {
      res.status(400).json({ error: 'Stop name, latitude, and longitude are required' });
      return;
    }

    const maxSeq = queryOne<any>(
      'SELECT MAX(sequence_order) as maxSeq FROM bus_stops WHERE route_id = ?',
      [routeId]
    )?.maxSeq || 0;

    const stopId = `stp_${Date.now()}`;
    executeRun(
      `INSERT INTO bus_stops (id, route_id, stop_name, latitude, longitude, sequence_order, morning_pickup_time, evening_drop_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [stopId, routeId, stopName.trim(), Number(latitude), Number(longitude), sequenceOrder || maxSeq + 1, morningPickupTime || '07:40 AM', eveningDropTime || '05:10 PM']
    );

    res.status(201).json({ message: 'Stop added successfully', stopId });
  } catch (err: any) {
    console.error('Error adding stop:', err);
    res.status(500).json({ error: 'Failed to add stop' });
  }
});

// DELETE /api/routes/stops/:stopId - Remove a stop
router.delete('/stops/:stopId', authenticateUser, authorizeRole('admin'), (req: Request, res: Response): void => {
  try {
    executeRun('DELETE FROM bus_stops WHERE id = ?', [req.params.stopId]);
    res.json({ message: 'Stop deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting stop:', err);
    res.status(500).json({ error: 'Failed to delete stop' });
  }
});

export default router;
