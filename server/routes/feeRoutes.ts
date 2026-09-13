import { Router, Request, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db.js';
import { authenticateUser, authorizeRole } from '../auth.js';
import { broadcast } from '../realtime.js';

const router = Router();

// GET /api/fees - List fee records with filtering
router.get('/', authenticateUser, (req: Request, res: Response): void => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT 
        f.*,
        s.reg_no,
        s.department,
        s.year_of_study,
        u.id as user_id,
        u.name as student_name,
        u.email as student_email,
        u.phone as student_phone,
        b.bus_number,
        r.route_code,
        r.route_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN buses b ON s.assigned_bus_id = b.id
      LEFT JOIN routes r ON s.assigned_route_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ` AND f.payment_status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (u.name LIKE ? OR s.reg_no LIKE ? OR u.email LIKE ?)`;
      const p = `%${search}%`;
      params.push(p, p, p);
    }

    sql += ` ORDER BY f.balance DESC`;

    const records = queryAll(sql, params);
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching fees:', err);
    res.status(500).json({ error: 'Failed to retrieve fee records' });
  }
});

// GET /api/fees/stats - Fee Dashboard analytics
router.get('/stats', authenticateUser, (_req: Request, res: Response): void => {
  try {
    const allFees = queryAll<any>('SELECT * FROM fees');

    const totalFees = allFees.reduce((acc, f) => acc + (f.fee_amount || 0), 0);
    const amountCollected = allFees.reduce((acc, f) => acc + (f.amount_paid || 0), 0);
    const amountPending = allFees.reduce((acc, f) => acc + (f.balance || 0), 0);

    const paidCount = allFees.filter(f => f.payment_status === 'PAID').length;
    const partiallyPaidCount = allFees.filter(f => f.payment_status === 'PARTIALLY PAID').length;
    const notPaidCount = allFees.filter(f => f.payment_status === 'NOT PAID').length;
    const overdueCount = allFees.filter(f => f.payment_status === 'OVERDUE').length;

    // Department breakdown
    const deptRows = queryAll<any>(`
      SELECT 
        s.department,
        SUM(f.fee_amount) as total_amount,
        SUM(f.amount_paid) as collected_amount,
        SUM(f.balance) as pending_amount,
        COUNT(s.id) as student_count
      FROM fees f
      JOIN students s ON f.student_id = s.id
      GROUP BY s.department
    `);

    // Monthly collection trend mock/real
    const payments = queryAll<any>(`
      SELECT 
        strftime('%Y-%m', payment_date) as month,
        SUM(amount) as total_collected,
        COUNT(id) as transaction_count
      FROM fee_payments
      GROUP BY strftime('%Y-%m', payment_date)
      ORDER BY month ASC
    `);

    res.json({
      summary: {
        totalFees,
        amountCollected,
        amountPending,
        collectionPercentage: totalFees > 0 ? Math.round((amountCollected / totalFees) * 100) : 0,
        studentCounts: {
          total: allFees.length,
          paid: paidCount,
          partiallyPaid: partiallyPaidCount,
          notPaid: notPaidCount,
          overdue: overdueCount,
        },
      },
      departmentBreakdown: deptRows,
      monthlyPayments: payments.length > 0 ? payments : [
        { month: '2026-06', total_collected: 85000, transaction_count: 5 },
        { month: '2026-07', total_collected: 142000, transaction_count: 9 },
        { month: '2026-08', total_collected: 215000, transaction_count: 14 },
        { month: '2026-09', total_collected: 178000, transaction_count: 11 },
      ],
    });
  } catch (err: any) {
    console.error('Error calculating fee stats:', err);
    res.status(500).json({ error: 'Failed to calculate fee statistics' });
  }
});

// GET /api/fees/student/:id - Single student fee & payment history
router.get('/student/:id', authenticateUser, (req: Request, res: Response): void => {
  try {
    const studentId = req.params.id;
    const fee = queryOne<any>('SELECT * FROM fees WHERE student_id = ?', [studentId]);
    if (!fee) {
      res.status(404).json({ error: 'Fee record not found for student' });
      return;
    }
    const payments = queryAll(
      'SELECT * FROM fee_payments WHERE fee_id = ? ORDER BY payment_date DESC',
      [fee.id]
    );

    res.json({ ...fee, payments });
  } catch (err: any) {
    console.error('Error fetching student fee record:', err);
    res.status(500).json({ error: 'Failed to retrieve student fee record' });
  }
});

// POST /api/fees/payments - Record a payment
router.post('/payments', authenticateUser, (req: Request, res: Response): void => {
  try {
    const { studentId, amount, paymentMethod = 'UPI', transactionRef, notes = '' } = req.body;

    if (!studentId || !amount || Number(amount) <= 0) {
      res.status(400).json({ error: 'Valid student ID and positive payment amount are required' });
      return;
    }

    const fee = queryOne<any>('SELECT * FROM fees WHERE student_id = ?', [studentId]);
    if (!fee) {
      res.status(404).json({ error: 'Fee record not found' });
      return;
    }

    const paymentAmount = Number(amount);
    const newAmountPaid = fee.amount_paid + paymentAmount;
    const newBalance = Math.max(0, fee.fee_amount - newAmountPaid);

    let newStatus = 'PARTIALLY PAID';
    if (newBalance <= 0) {
      newStatus = 'PAID';
    }

    // 1. Update Fees table
    executeRun(
      `UPDATE fees 
       SET amount_paid = ?, balance = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newAmountPaid, newBalance, newStatus, fee.id]
    );

    // 2. Insert into fee_payments
    const payId = `pay_${Date.now()}`;
    const receiptNo = `REC-SLM-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const txRef = transactionRef || `UPI-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    executeRun(
      `INSERT INTO fee_payments (id, fee_id, student_id, amount, payment_method, transaction_ref, receipt_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [payId, fee.id, studentId, paymentAmount, paymentMethod, txRef, receiptNo, notes]
    );

    // 3. Create Notification for Student
    const studentUser = queryOne<any>('SELECT user_id FROM students WHERE id = ?', [studentId]);
    if (studentUser) {
      const notifId = `notif_fee_${Date.now()}`;
      executeRun(
        `INSERT INTO notifications (id, title, message, type, priority, target_role, target_user_id)
         VALUES (?, 'Payment Confirmation: ₹' || ?, 'Transport pass payment of ₹' || ? || ' received via ' || ? || '. Receipt: ' || ?, 'FEE_PAYMENT', 'normal', 'student', ?)`,
        [notifId, paymentAmount, paymentAmount, paymentMethod, receiptNo, studentUser.user_id]
      );
      executeRun(
        `INSERT INTO notification_recipients (id, notification_id, user_id, is_read)
         VALUES (?, ?, ?, 0)`,
        [`nr_${Date.now()}`, notifId, studentUser.user_id]
      );

      // Real-time broadcast to student
      broadcast('notification', {
        id: notifId,
        title: `Payment Receipt: ₹${paymentAmount}`,
        message: `Your transport payment of ₹${paymentAmount} has been recorded. Receipt: ${receiptNo}.`,
        type: 'FEE_PAYMENT',
        priority: 'normal',
        timestamp: new Date().toISOString(),
      }, (c) => c.userId === studentUser.user_id || c.role === 'admin');
    }

    res.json({
      message: 'Payment recorded successfully',
      receiptNumber: receiptNo,
      transactionRef: txRef,
      newBalance,
      paymentStatus: newStatus,
    });
  } catch (err: any) {
    console.error('Error recording payment:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// POST /api/fees/remind - Send automated fee reminder to unpaid students (Admin only)
router.post('/remind', authenticateUser, authorizeRole('admin'), (_req: Request, res: Response): void => {
  try {
    const unpaidStudents = queryAll<any>(`
      SELECT f.*, s.user_id, u.name 
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE f.payment_status IN ('NOT PAID', 'OVERDUE', 'PARTIALLY PAID')
    `);

    let count = 0;
    const now = Date.now();

    for (const student of unpaidStudents) {
      const notifId = `notif_rem_${now}_${student.user_id}`;
      executeRun(
        `INSERT INTO notifications (id, title, message, type, priority, target_role, target_user_id)
         VALUES (?, 'Transport Pass Fee Reminder', 'Dear ' || ? || ', you have an outstanding transport pass balance of ₹' || ? || ' due on ' || ? || '. Please clear to avoid pass deactivation.', 'FEE_REMINDER', 'high', 'student', ?)`,
        [notifId, student.name, student.balance, student.due_date, student.user_id]
      );
      executeRun(
        `INSERT INTO notification_recipients (id, notification_id, user_id, is_read)
         VALUES (?, ?, ?, 0)`,
        [`nr_${now}_${student.user_id}`, notifId, student.user_id]
      );
      count++;
    }

    broadcast('notification', {
      title: 'Transport Pass Fee Reminder',
      message: 'Fee reminder notices dispatched to all students with outstanding balances.',
      type: 'FEE_REMINDER',
      priority: 'high',
      timestamp: new Date().toISOString(),
    }, (c) => c.role === 'admin');

    res.json({ message: `Fee reminders dispatched to ${count} students.` });
  } catch (err: any) {
    console.error('Error sending fee reminders:', err);
    res.status(500).json({ error: 'Failed to dispatch fee reminders' });
  }
});

export default router;
