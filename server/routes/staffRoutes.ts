import { Router, Request, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db.js';
import { authenticateUser, authorizeRole } from '../auth.js';

const router = Router();

// GET /api/staff - List staff
router.get('/', authenticateUser, (_req: Request, res: Response): void => {
  try {
    const staffMembers = queryAll(`
      SELECT 
        st.id,
        st.staff_id,
        st.designation,
        st.department,
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        b.bus_number,
        r.route_code,
        r.route_name,
        bs.stop_name
      FROM staff st
      JOIN users u ON st.user_id = u.id
      LEFT JOIN buses b ON st.assigned_bus_id = b.id
      LEFT JOIN routes r ON st.assigned_route_id = r.id
      LEFT JOIN bus_stops bs ON st.assigned_stop_id = bs.id
      ORDER BY u.name ASC
    `);

    res.json(staffMembers);
  } catch (err: any) {
    console.error('Error fetching staff list:', err);
    res.status(500).json({ error: 'Failed to retrieve staff' });
  }
});

// GET /api/drivers - List drivers
router.get('/drivers', authenticateUser, (_req: Request, res: Response): void => {
  try {
    const drivers = queryAll(`
      SELECT 
        d.id,
        d.license_no,
        d.experience_years,
        d.rating,
        d.emergency_contact,
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        b.id as bus_id,
        b.bus_number,
        b.registration_number,
        b.status as bus_status,
        r.route_code,
        r.route_name
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN buses b ON d.assigned_bus_id = b.id
      LEFT JOIN routes r ON b.assigned_route_id = r.id
      ORDER BY u.name ASC
    `);

    res.json(drivers);
  } catch (err: any) {
    console.error('Error fetching drivers list:', err);
    res.status(500).json({ error: 'Failed to retrieve drivers' });
  }
});

export default router;
