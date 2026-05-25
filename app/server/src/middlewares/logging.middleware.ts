import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { AuthRequest } from './auth.middleware.js';

export const requestIdMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
};

export const loggingMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const startTime = process.hrtime();
  
  logger.info({
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  }, `Incoming request: ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    
    logger.info({
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
    }, `Request completed: ${req.method} ${req.originalUrl} - ${res.statusCode} (${durationMs}ms)`);
  });

  next();
};
