import { Router, Request, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db.js';
import { authenticateUser, authorizeRole } from '../auth.js';
import { broadcast } from '../realtime.js';

const router = Router();

// GET /api/notifications - Get user notifications
router.get('/', authenticateUser, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    // Fetch notifications aimed at this user, their role, or general
    const notifications = queryAll(`
      SELECT 
        n.*,
        COALESCE(nr.is_read, 0) as is_read,
        nr.read_at
      FROM notifications n
      LEFT JOIN notification_recipients nr ON n.id = nr.notification_id AND nr.user_id = ?
      WHERE 
        n.target_user_id = ? 
        OR n.target_role = ? 
        OR n.target_role = 'all'
        OR nr.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId, userId, role, userId]);

    res.json(notifications);
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', authenticateUser, (req: Request, res: Response): void => {
  try {
    const notifId = req.params.id;
    const userId = req.user?.id;

    // Check if recipient record exists
    const existing = queryOne(
      'SELECT id FROM notification_recipients WHERE notification_id = ? AND user_id = ?',
      [notifId, userId]
    );

    if (existing) {
      executeRun(
        'UPDATE notification_recipients SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?',
        [existing.id]
      );
    } else {
      executeRun(
        'INSERT INTO notification_recipients (id, notification_id, user_id, is_read, read_at) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
        [`nr_${Date.now()}`, notifId, userId]
      );
    }

    res.json({ message: 'Marked as read' });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to update notification status' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authenticateUser, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    executeRun(
      'UPDATE notification_recipients SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [userId]
    );
    res.json({ message: 'All marked as read' });
  } catch (err: any) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

// POST /api/notifications - Admin broadcast custom notification
router.post('/', authenticateUser, authorizeRole('admin'), (req: Request, res: Response): void => {
  try {
    const {
      title,
      message,
      type = 'SYSTEM',
      priority = 'normal',
      targetRole = 'all',
      targetBusId,
      targetRouteId,
      targetUserId,
    } = req.body;

    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required' });
      return;
    }

    const notifId = `notif_${Date.now()}`;
    executeRun(
      `INSERT INTO notifications (id, title, message, type, priority, target_role, target_bus_id, target_route_id, target_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [notifId, title.trim(), message.trim(), type, priority, targetRole, targetBusId || null, targetRouteId || null, targetUserId || null]
    );

    // Identify recipients to insert recipient records
    let recipientUsers: any[] = [];
    if (targetUserId) {
      recipientUsers = queryAll('SELECT id FROM users WHERE id = ?', [targetUserId]);
    } else if (targetBusId) {
      recipientUsers = queryAll(`
        SELECT u.id FROM students s JOIN users u ON s.user_id = u.id WHERE s.assigned_bus_id = ?
        UNION
        SELECT u.id FROM staff st JOIN users u ON st.user_id = u.id WHERE st.assigned_bus_id = ?
      `, [targetBusId, targetBusId]);
    } else if (targetRouteId) {
      recipientUsers = queryAll(`
        SELECT u.id FROM students s JOIN users u ON s.user_id = u.id WHERE s.assigned_route_id = ?
        UNION
        SELECT u.id FROM staff st JOIN users u ON st.user_id = u.id WHERE st.assigned_route_id = ?
      `, [targetRouteId, targetRouteId]);
    } else if (targetRole !== 'all') {
      recipientUsers = queryAll('SELECT id FROM users WHERE role = ?', [targetRole]);
    } else {
      recipientUsers = queryAll('SELECT id FROM users');
    }

    for (const r of recipientUsers) {
      executeRun(
        'INSERT INTO notification_recipients (id, notification_id, user_id, is_read) VALUES (?, ?, ?, 0)',
        [`nr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, notifId, r.id]
      );
    }

    // Broadcast in real-time via SSE
    broadcast('notification', {
      id: notifId,
      title,
      message,
      type,
      priority,
      targetRole,
      timestamp: new Date().toISOString(),
    }, (c) => {
      if (targetUserId) return c.userId === targetUserId;
      if (targetRole !== 'all') return c.role === targetRole || c.role === 'admin';
      return true;
    });

    res.status(201).json({
      message: `Notification broadcasted to ${recipientUsers.length} user(s)`,
      notifId,
    });
  } catch (err: any) {
    console.error('Error broadcasting notification:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

export default router;
