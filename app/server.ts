import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import apiRouter from './server/src/router.js';
import { errorMiddleware, notFound } from './server/src/middlewares/error.middleware.js';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { invalidateCacheForEvent } from './server/src/lib/report-cache.js';
import { requestIdMiddleware, loggingMiddleware } from './server/src/middlewares/logging.middleware.js';
import rateLimit from 'express-rate-limit';
import { startBackupScheduler } from './server/src/lib/backup-scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 5000;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  const httpServer = http.createServer(app);
  
  // Set up Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: { origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:4000', 'https://gepoder.click', 'https://driver.gepoder.click', 'capacitor://localhost', 'http://localhost'], credentials: true },
    transports: ['polling', 'websocket'],
    allowUpgrades: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Make io available to routes
  app.set('io', io);

  // Intercept all emitted events to invalidate report caches
  const origEmit = io.emit.bind(io);
  io.emit = (event: string, ...args: any[]) => {
    invalidateCacheForEvent(event);
    return origEmit(event, ...args);
  };

  io.on('connection', (socket) => {
    console.log('Client connected to Socket.IO:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // ── Core Middleware ──────────────────────────────────────
  app.use(requestIdMiddleware as any);
  app.use(loggingMiddleware as any);
  app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:4000', 'https://gepoder.click', 'https://driver.gepoder.click', 'capacitor://localhost', 'http://localhost'], credentials: true }));
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ── Static Uploads ──────────────────────────────────────
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  // ── API Routes (Express + Prisma + MySQL) ───────────────
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Yêu cầu quá thường xuyên, vui lòng thử lại sau.' },
  });

  app.use('/api', apiLimiter, apiRouter);

  // ── Production: Serve built frontend ────────────────────
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  // ── Error Handling ──────────────────────────────────────
  app.use(errorMiddleware);

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Backend API running at http://localhost:${PORT}`);
    console.log(`   API:      http://localhost:${PORT}/api`);
    console.log(`   Frontend: ${FRONTEND_URL}`);
    console.log(`   DB:       localhost:3306`);
    console.log(`   Mode:     ${process.env.NODE_ENV || 'development'}\n`);
    
    // Start automated daily backup scheduler
    startBackupScheduler();
  });
}

// ── Global error handlers to prevent crash ─────────────
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('💥 Unhandled Rejection:', reason?.message || reason);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
