import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { getDb } from './server/db.js';
import { addClient, removeClient } from './server/realtime.js';
import authRoutes from './server/routes/authRoutes.js';
import studentRoutes from './server/routes/studentRoutes.js';
import busRoutes from './server/routes/busRoutes.js';
import routeRoutes from './server/routes/routeRoutes.js';
import feeRoutes from './server/routes/feeRoutes.js';
import locationRoutes from './server/routes/locationRoutes.js';
import notificationRoutes from './server/routes/notificationRoutes.js';
import analyticsRoutes from './server/routes/analyticsRoutes.js';
import staffRoutes from './server/routes/staffRoutes.js';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'buslive_super_secret_jwt_key_2026';

async function startServer() {
  // 1. Initialize SQLite Database & seed data
  await getDb();

  const app = express();

  // Basic Middlewares
  app.use(cors());
  app.use(express.json());

  // 2. Health & Info
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'BUSLIVE Backend REST Engine',
      database: 'SQLite (Normalized Relational SQL)',
      timestamp: new Date().toISOString(),
    });
  });

  // 3. Real-time Server-Sent Events (SSE) Stream
  app.get('/api/realtime/stream', (req: Request, res: Response) => {
    const token = (req.query.token as string) || (req.headers.authorization?.split(' ')[1]);

    let userId = 'anonymous';
    let role = 'guest';

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id;
        role = decoded.role;
      } catch {
        // Fallback for unauthenticated viewers
      }
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    addClient(clientId, userId, role, res);

    req.on('close', () => {
      removeClient(clientId);
    });
  });

  // 4. Mount REST API Subsystems
  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/buses', busRoutes);
  app.use('/api/routes', routeRoutes);
  app.use('/api/fees', feeRoutes);
  app.use('/api/location', locationRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/staff', staffRoutes);

  // 5. Global API Error Handler
  app.use('/api', (err: any, _req: Request, res: Response, _next: any) => {
    console.error('Unhandled API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  // 6. Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BUSLIVE] Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BUSLIVE server:', err);
  process.exit(1);
});
