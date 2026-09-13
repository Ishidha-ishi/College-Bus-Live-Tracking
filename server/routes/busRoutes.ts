import { Router, Request, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db.js';
import { authenticateUser, authorizeRole } from '../auth.js';

const router = Router();

// GET /api/buses - List all buses
router.get('/', authenticateUser, (_req: Request, res: Response): void => {
  try {
    const buses = queryAll(`
      SELECT 
        b.*,
        u.name as driver_name,
        u.phone as driver_phone,
        r.route_code,
        r.route_name,
        r.color_hex as route_color,
        (SELECT COUNT(*) FROM students s WHERE s.assigned_bus_id = b.id) as assigned_student_count,
        (SELECT COUNT(*) FROM staff st WHERE st.assigned_bus_id = b.id) as assigned_staff_count
      FROM buses b
      LEFT JOIN users u ON b.assigned_driver_id = u.id
      LEFT JOIN routes r ON b.assigned_route_id = r.id
      ORDER BY b.bus_number ASC
    `);

    res.json(buses);
  } catch (err: any) {
    console.error('Error fetching buses:', err);
    res.status(500).json({ error: 'Failed to retrieve buses' });
  }
});

// GET /api/buses/:id - Single bus details
router.get('/:id', authenticateUser, (req: Request, res: Response): void => {
  try {
    const bus = queryOne<any>(
      `SELECT 
        b.*,
        u.name as driver_name,
        u.phone as driver_phone,
        r.route_code,
        r.route_name,
        r.color_hex as route_color,
        r.starting_point,
        r.destination,
        r.total_distance_km
      FROM buses b
      LEFT JOIN users u ON b.assigned_driver_id = u.id
      LEFT JOIN routes r ON b.assigned_route_id = r.id
      WHERE b.id = ?`,
      [req.params.id]
    );

    if (!bus) {
      res.status(404).json({ error: 'Bus not found' });
      return;
    }

    // Get stops for this bus's route
    const stops = queryAll(
      `SELECT * FROM bus_stops WHERE route_id = ? ORDER BY sequence_order ASC`,
      [bus.assigned_route_id]
    );

    // Get students assigned to this bus
    const students = queryAll(
      `SELECT s.id, s.reg_no, u.name, u.phone, bs.stop_name, f.payment_status as fee_status
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN bus_stops bs ON s.assigned_stop_id = bs.id
       LEFT JOIN fees f ON s.id = f.student_id
       WHERE s.assigned_bus_id = ?`,
      [bus.id]
    );

    res.json({
      ...bus,
      stops,
      students,
    });
  } catch (err: any) {
    console.error('Error fetching bus details:', err);
    res.status(500).json({ error: 'Failed to fetch bus details' });
  }
});

// POST /api/buses - Create bus (Admin only)
router.post('/', authenticateUser, authorizeRole('admin'), (req: Request, res: Response): void => {
  try {
    const {
      busNumber,
      registrationNumber,
      capacity = 50,
      assignedDriverId,
      assignedRouteId,
      status = 'idle',
    } = req.body;

    if (!busNumber || !registrationNumber) {
      res.status(400).json({ error: 'Bus number and registration number are required' });
      return;
    }

    const busId = `bus_${Date.now()}`;
    executeRun(
      `INSERT INTO buses (id, bus_number, registration_number, capacity, assigned_driver_id, assigned_route_id, status, current_lat, current_lng, speed, heading, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 11.6663, 78.1408, 0, 0, 1)`,
      [busId, busNumber.trim().toUpperCase(), registrationNumber.trim().toUpperCase(), Number(capacity), assignedDriverId || null, assignedRouteId || null, status]
    );

    res.status(201).json({ message: 'Bus registered successfully', busId });
  } catch (err: any) {
    console.error('Error adding bus:', err);
    res.status(500).json({ error: 'Failed to add bus' });
  }
});

// PUT /api/buses/:id - Update bus (Admin or Driver for status)
router.put('/:id', authenticateUser, (req: Request, res: Response): void => {
  try {
    const busId = req.params.id;
    const {
      busNumber,
      registrationNumber,
      capacity,
      assignedDriverId,
      assignedRouteId,
      status,
    } = req.body;

    const bus = queryOne<any>('SELECT * FROM buses WHERE id = ?', [busId]);
    if (!bus) {
      res.status(404).json({ error: 'Bus not found' });
      return;
    }

    // If driver, only allow updating status if assigned to this bus
    if (req.user?.role === 'driver') {
      if (bus.assigned_driver_id !== req.user.id) {
        res.status(403).json({ error: 'You are not assigned to this bus' });
        return;
      }
      if (status) {
        executeRun('UPDATE buses SET status = ? WHERE id = ?', [status, busId]);
      }
      res.json({ message: 'Bus status updated' });
      return;
    }

    // Admin can update everything
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin permission required' });
      return;
    }

    executeRun(
      `UPDATE buses
       SET bus_number = COALESCE(?, bus_number),
           registration_number = COALESCE(?, registration_number),
           capacity = COALESCE(?, capacity),
           assigned_driver_id = COALESCE(?, assigned_driver_id),
           assigned_route_id = COALESCE(?, assigned_route_id),
           status = COALESCE(?, status),
           last_updated = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [busNumber, registrationNumber, capacity ? Number(capacity) : null, assignedDriverId, assignedRouteId, status, busId]
    );

    res.json({ message: 'Bus updated successfully' });
  } catch (err: any) {
    console.error('Error updating bus:', err);
    res.status(500).json({ error: 'Failed to update bus' });
  }
});

// DELETE /api/buses/:id - Delete bus (Admin only)
router.delete('/:id', authenticateUser, authorizeRole('admin'), (req: Request, res: Response): void => {
  try {
    const busId = req.params.id;
    executeRun('DELETE FROM buses WHERE id = ?', [busId]);
    res.json({ message: 'Bus deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting bus:', err);
    res.status(500).json({ error: 'Failed to delete bus' });
  }
});

export default router;
