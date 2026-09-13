import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, executeRun } from '../db.js';
import { authenticateUser, authorizeRole } from '../auth.js';

const router = Router();

// GET /api/students - List students with search, filters, and pagination
router.get('/', authenticateUser, (req: Request, res: Response): void => {
  try {
    const {
      search = '',
      department = '',
      year = '',
      route = '',
      bus = '',
      feeStatus = '',
      page = '1',
      limit = '50',
    } = req.query;

    let sql = `
      SELECT 
        s.id as student_table_id,
        s.reg_no,
        s.year_of_study,
        s.department,
        s.parent_phone,
        s.account_status,
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        u.status as user_status,
        b.id as bus_id,
        b.bus_number,
        b.registration_number as bus_registration,
        r.id as route_id,
        r.route_code,
        r.route_name,
        r.color_hex as route_color,
        bs.id as stop_id,
        bs.stop_name,
        bs.morning_pickup_time,
        f.id as fee_id,
        f.fee_amount,
        f.amount_paid,
        f.balance as fee_balance,
        f.payment_status as fee_status,
        f.due_date as fee_due_date
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN buses b ON s.assigned_bus_id = b.id
      LEFT JOIN routes r ON s.assigned_route_id = r.id
      LEFT JOIN bus_stops bs ON s.assigned_stop_id = bs.id
      LEFT JOIN fees f ON s.id = f.student_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search) {
      sql += ` AND (u.name LIKE ? OR s.reg_no LIKE ? OR u.email LIKE ? OR s.department LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (department) {
      sql += ` AND s.department = ?`;
      params.push(department);
    }

    if (year) {
      sql += ` AND s.year_of_study = ?`;
      params.push(year);
    }

    if (route) {
      sql += ` AND (s.assigned_route_id = ? OR r.route_code = ?)`;
      params.push(route, route);
    }

    if (bus) {
      sql += ` AND (s.assigned_bus_id = ? OR b.bus_number = ?)`;
      params.push(bus, bus);
    }

    if (feeStatus) {
      sql += ` AND f.payment_status = ?`;
      params.push(feeStatus);
    }

    sql += ` ORDER BY u.name ASC`;

    const allRows = queryAll(sql, params);
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 50;
    const totalCount = allRows.length;
    const paginatedRows = allRows.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      data: paginatedRows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err: any) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to retrieve students' });
  }
});

// GET /api/students/:id - Detailed student profile
router.get('/:id', authenticateUser, (req: Request, res: Response): void => {
  try {
    const studentId = req.params.id;

    // Student can only view their own profile unless staff or admin
    if (req.user?.role === 'student') {
      const selfStudent = queryOne<any>('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (!selfStudent || (selfStudent.id !== studentId && studentId !== 'me')) {
        res.status(403).json({ error: 'Access denied to other student profiles' });
        return;
      }
    }

    const resolvedId = studentId === 'me'
      ? queryOne<any>('SELECT id FROM students WHERE user_id = ?', [req.user?.id])?.id
      : studentId;

    if (!resolvedId) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const student = queryOne<any>(
      `SELECT 
        s.id as student_table_id,
        s.reg_no,
        s.year_of_study,
        s.department,
        s.parent_phone,
        s.account_status,
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        u.status as user_status,
        b.id as bus_id,
        b.bus_number,
        b.registration_number as bus_registration,
        b.status as bus_status,
        b.current_lat as bus_lat,
        b.current_lng as bus_lng,
        b.speed as bus_speed,
        r.id as route_id,
        r.route_code,
        r.route_name,
        r.color_hex as route_color,
        bs.id as stop_id,
        bs.stop_name,
        bs.latitude as stop_lat,
        bs.longitude as stop_lng,
        bs.morning_pickup_time,
        bs.evening_drop_time,
        f.id as fee_id,
        f.academic_year,
        f.fee_amount,
        f.amount_paid,
        f.balance as fee_balance,
        f.payment_status as fee_status,
        f.due_date as fee_due_date
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN buses b ON s.assigned_bus_id = b.id
      LEFT JOIN routes r ON s.assigned_route_id = r.id
      LEFT JOIN bus_stops bs ON s.assigned_stop_id = bs.id
      LEFT JOIN fees f ON s.id = f.student_id
      WHERE s.id = ? OR s.user_id = ?`,
      [resolvedId, resolvedId]
    );

    if (!student) {
      res.status(404).json({ error: 'Student record not found' });
      return;
    }

    // Retrieve payment history
    const payments = queryAll(
      `SELECT * FROM fee_payments WHERE student_id = ? ORDER BY payment_date DESC`,
      [student.student_table_id]
    );

    // Retrieve notifications for this student
    const notifications = queryAll(
      `SELECT n.*, nr.is_read, nr.read_at
       FROM notifications n
       JOIN notification_recipients nr ON n.id = nr.notification_id
       WHERE nr.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 20`,
      [student.user_id]
    );

    res.json({
      ...student,
      paymentHistory: payments,
      notifications,
    });
  } catch (err: any) {
    console.error('Error fetching student profile:', err);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
});

// POST /api/students - Add student (Admin only)
router.post('/', authenticateUser, authorizeRole('admin'), (req: Request, res: Response): void => {
  try {
    const {
      name,
      email,
      password = 'student123',
      phone,
      regNo,
      department,
      yearOfStudy,
      parentPhone,
      assignedBusId,
      assignedRouteId,
      assignedStopId,
      feeAmount = 16500,
      amountPaid = 0,
      feeDueDate = '2026-09-30',
    } = req.body;

    if (!name || !email || !regNo || !department) {
      res.status(400).json({ error: 'Name, email, registration number, and department are required.' });
      return;
    }

    // Check duplicate email or regNo
    const existingUser = queryOne('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingUser) {
      res.status(400).json({ error: 'A user with this email address already exists.' });
      return;
    }
    const existingReg = queryOne('SELECT id FROM students WHERE reg_no = ?', [regNo.trim()]);
    if (existingReg) {
      res.status(400).json({ error: 'A student with this registration number already exists.' });
      return;
    }

    const userId = `usr_std_${Date.now()}`;
    const studentId = `std_${Date.now()}`;
    const feeId = `fee_${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);

    // 1. Create User
    executeRun(
      `INSERT INTO users (id, email, password_hash, role, name, phone, department, status)
       VALUES (?, ?, ?, 'student', ?, ?, ?, 'active')`,
      [userId, email.trim().toLowerCase(), passwordHash, name.trim(), phone || '', department]
    );

    // 2. Create Student record
    executeRun(
      `INSERT INTO students (id, user_id, reg_no, year_of_study, department, assigned_bus_id, assigned_route_id, assigned_stop_id, parent_phone, account_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [studentId, userId, regNo.trim(), yearOfStudy || '1st Year', department, assignedBusId || null, assignedRouteId || null, assignedStopId || null, parentPhone || '']
    );

    // 3. Create Fee record
    const numFeeAmount = Number(feeAmount) || 16500;
    const numAmountPaid = Number(amountPaid) || 0;
    const balance = Math.max(0, numFeeAmount - numAmountPaid);
    let paymentStatus = 'NOT PAID';
    if (balance === 0) paymentStatus = 'PAID';
    else if (numAmountPaid > 0) paymentStatus = 'PARTIALLY PAID';

    executeRun(
      `INSERT INTO fees (id, student_id, academic_year, fee_amount, amount_paid, balance, payment_status, due_date, status)
       VALUES (?, ?, '2026-2027', ?, ?, ?, ?, ?, 'active')`,
      [feeId, studentId, numFeeAmount, numAmountPaid, balance, paymentStatus, feeDueDate]
    );

    // 4. If payment was made, record payment entry
    if (numAmountPaid > 0) {
      const payId = `pay_${Date.now()}`;
      executeRun(
        `INSERT INTO fee_payments (id, fee_id, student_id, amount, payment_method, transaction_ref, receipt_number, notes)
         VALUES (?, ?, ?, ?, 'Card/Cash', ?, ?, 'Initial enrollment payment')`,
        [payId, feeId, studentId, numAmountPaid, `TXN-INIT-${Date.now()}`, `REC-SLM-${Math.floor(1000 + Math.random() * 9000)}`]
      );
    }

    res.status(201).json({
      message: 'Student created successfully',
      studentId,
      userId,
    });
  } catch (err: any) {
    console.error('Error creating student:', err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// PUT /api/students/:id - Update student details (Admin only)
router.put('/:id', authenticateUser, authorizeRole('admin'), (req: Request, res: Response): void => {
  try {
    const studentId = req.params.id;
    const {
      name,
      phone,
      department,
      yearOfStudy,
      parentPhone,
      assignedBusId,
      assignedRouteId,
      assignedStopId,
      accountStatus,
    } = req.body;

    const student = queryOne<any>('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    if (name || phone || department) {
      executeRun(
        `UPDATE users 
         SET name = COALESCE(?, name), phone = COALESCE(?, phone), department = COALESCE(?, department)
         WHERE id = ?`,
        [name, phone, department, student.user_id]
      );
    }

    executeRun(
      `UPDATE students
       SET year_of_study = COALESCE(?, year_of_study),
           department = COALESCE(?, department),
           parent_phone = COALESCE(?, parent_phone),
           assigned_bus_id = COALESCE(?, assigned_bus_id),
           assigned_route_id = COALESCE(?, assigned_route_id),
           assigned_stop_id = COALESCE(?, assigned_stop_id),
           account_status = COALESCE(?, account_status)
       WHERE id = ?`,
      [yearOfStudy, department, parentPhone, assignedBusId, assignedRouteId, assignedStopId, accountStatus, studentId]
    );

    res.json({ message: 'Student updated successfully' });
  } catch (err: any) {
    console.error('Error updating student:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/students/:id - Remove student (Admin only)
router.delete('/:id', authenticateUser, authorizeRole('admin'), (req: Request, res: Response): void => {
  try {
    const studentId = req.params.id;
    const student = queryOne<any>('SELECT user_id FROM students WHERE id = ?', [studentId]);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Cascade delete on users table will delete student, fees, payments
    executeRun('DELETE FROM users WHERE id = ?', [student.user_id]);
    res.json({ message: 'Student removed successfully' });
  } catch (err: any) {
    console.error('Error deleting student:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

export default router;
