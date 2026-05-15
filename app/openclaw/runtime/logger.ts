// ============================================================
// OpenClaw – Structured Logger
// Winston-based logger with separate log files per type
// ============================================================

import { createLogger, format, transports, Logger } from 'winston';
import { resolve } from 'path';
import { mkdirSync } from 'fs';
import type { LogType } from './types.js';

// Ensure log directories exist
function ensureLogDirs(logDir: string): void {
  const dirs = ['execution', 'governance', 'review', 'violation', 'sync'];
  for (const dir of dirs) {
    mkdirSync(resolve(logDir, dir), { recursive: true });
  }
}

const LOG_DIR = resolve(import.meta.dirname ?? '.', '../logs');
ensureLogDirs(LOG_DIR);

// ── Main console logger ───────────────────────────────────────
const mainLogger: Logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
    }),
    new transports.File({
      filename: resolve(LOG_DIR, 'execution', 'openclaw.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 7,
    }),
  ],
});

// ── Typed log writers ─────────────────────────────────────────

export const logger = {
  info: (message: string, meta?: object) => mainLogger.info(message, meta),
  warn: (message: string, meta?: object) => mainLogger.warn(message, meta),
  error: (message: string, meta?: object) => mainLogger.error(message, meta),
  debug: (message: string, meta?: object) => mainLogger.debug(message, meta),
};

// ── Domain-specific loggers ───────────────────────────────────

function createTypeLogger(type: LogType): Logger {
  return createLogger({
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      new transports.File({
        filename: resolve(LOG_DIR, type, `${type}.log`),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 30,
      }),
    ],
  });
}

const governanceLogger = createTypeLogger('governance');
const reviewLogger = createTypeLogger('review');
const violationLogger = createTypeLogger('violation');
const syncLogger = createTypeLogger('sync');

export const logGovernance = (requestId: string, data: object): void => {
  governanceLogger.info('governance_event', { requestId, ...data });
};

export const logReview = (requestId: string, data: object): void => {
  reviewLogger.info('review_event', { requestId, ...data });
};

export const logViolation = (requestId: string, violation: object): void => {
  violationLogger.warn('violation_detected', { requestId, ...violation });
};

export const logSync = (data: object): void => {
  syncLogger.info('memory_sync', data);
};

export const logExecution = (requestId: string, phase: string, data?: object): void => {
  mainLogger.info(`[${requestId}] ${phase}`, data);
};
