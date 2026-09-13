import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, queryAll } from '../db.js';
import { generateToken, authenticateUser } from '../auth.js';

const router = Router();

// Helper to assemble full user context based on role
export function getUserProfileWithDetails(userId: string) {
  const user = queryOne<any>(
    'SELECT id, email, role, name, phone, department, status, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (!user) return null;

  if (user.role === 'student') {
    const student = queryOne<any>(
      `SELECT s.*, 
              b.bus_number, b.registration_number as bus_registration, b.status as bus_status,
              b.current_lat as bus_lat, b.current_lng as bus_lng, b.speed as bus_speed,
              r.route_code, r.route_name, r.color_hex as route_color,
              bs.stop_name, bs.latitude as stop_lat, bs.longitude as stop_lng, bs.morning_pickup_time,
              f.fee_amount, f.amount_paid, f.balance as fee_balance, f.payment_status as fee_status, f.due_date as fee_due_date
       FROM students s
       LEFT JOIN buses b ON s.assigned_bus_id = b.id
       LEFT JOIN routes r ON s.assigned_route_id = r.id
       LEFT JOIN bus_stops bs ON s.assigned_stop_id = bs.id
       LEFT JOIN fees f ON s.id = f.student_id
       WHERE s.user_id = ?`,
      [userId]
    );
    return { ...user, studentDetails: student || {} };
  }

  if (user.role === 'staff') {
    const staff = queryOne<any>(
      `SELECT st.*, 
              b.bus_number, b.registration_number as bus_registration,
              r.route_code, r.route_name,
              bs.stop_name, bs.latitude as stop_lat, bs.longitude as stop_lng
       FROM staff st
       LEFT JOIN buses b ON st.assigned_bus_id = b.id
       LEFT JOIN routes r ON st.assigned_route_id = r.id
       LEFT JOIN bus_stops bs ON st.assigned_stop_id = bs.id
       WHERE st.user_id = ?`,
      [userId]
    );
    return { ...user, staffDetails: staff || {} };
  }

  if (user.role === 'driver') {
    const driver = queryOne<any>(
      `SELECT d.*, 
              b.id as bus_id, b.bus_number, b.registration_number as bus_registration, b.capacity, b.status as bus_status,
              b.current_lat, b.current_lng, b.speed, b.heading,
              r.id as route_id, r.route_code, r.route_name, r.color_hex, r.total_distance_km
       FROM drivers d
       LEFT JOIN buses b ON d.assigned_bus_id = b.id
       LEFT JOIN routes r ON b.assigned_route_id = r.id
       WHERE d.user_id = ?`,
      [userId]
    );

    // Get active trip if any
    const activeTrip = queryOne<any>(
      `SELECT * FROM trips WHERE driver_id = ? AND status = 'in_progress' ORDER BY start_time DESC LIMIT 1`,
      [userId]
    );

    return { ...user, driverDetails: driver || {}, activeTrip: activeTrip || null };
  }

  return user;
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    
    // Find user by email or student reg_no/staff_id
    let user = queryOne<any>(
      'SELECT * FROM users WHERE LOWER(email) = ?',
      [trimmedEmail]
    );

    // Fallback: check if user provided student reg_no or staff ID
    if (!user) {
      const studentMatch = queryOne<any>(
        'SELECT u.* FROM students s JOIN users u ON s.user_id = u.id WHERE s.reg_no = ?',
        [trimmedEmail]
      );
      if (studentMatch) user = studentMatch;
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials. No account found with this identifier.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'Account suspended or inactive. Please contact administration.' });
      return;
    }

    // Role check if provided
    if (role && user.role !== role) {
      res.status(401).json({
        error: `Role mismatch: This account is registered as "${user.role.toUpperCase()}", not "${role.toUpperCase()}". Please select the correct role tab.`,
      });
      return;
    }

    // Password verification
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid password. Please try again.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const fullProfile = getUserProfileWithDetails(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: fullProfile,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateUser, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const profile = getUserProfileWithDetails(req.user.id);
  if (!profile) {
    res.status(404).json({ error: 'User profile not found' });
    return;
  }
  res.json({ user: profile });
});

// POST /api/auth/logout
router.post('/logout', authenticateUser, (_req: Request, res: Response): void => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
