import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { eventBus, KernelEvent } from './bus.js';
import { logger } from '../runtime/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tracePath = resolve(__dirname, '../../data/trace.jsonl');

export class ObservabilityTracer {
  constructor() {
    this.init();
  }

  private async ensureLogFile() {
    try {
      await fs.mkdir(dirname(tracePath), { recursive: true });
    } catch {}
  }

  private async writeTrace(event: KernelEvent, payload: any) {
    await this.ensureLogFile();
    const traceEntry = {
      timestamp: new Date().toISOString(),
      event,
      payload
    };
    try {
      await fs.appendFile(tracePath, JSON.stringify(traceEntry) + '\n', 'utf-8');
    } catch (err) {
      logger.error(`[Tracer] Failed to write trace:`, err);
    }
  }

  private init() {
    const events: KernelEvent[] = [
      'TASK_CREATED',
      'TASK_PENDING_APPROVAL',
      'USER_APPROVED_TASK',
      'TASK_APPROVED',
      'TASK_LOCKED',
      'TASK_RUNNING',
      'TASK_DONE',
      'TASK_FAILED',
      'SYSTEM_ALERT',
      'WORKER_HEARTBEAT'
    ];

    events.forEach(eventName => {
      eventBus.subscribe(eventName, (payload) => {
        this.writeTrace(eventName, payload);
        // Also log to console for debugging
        if (eventName !== 'WORKER_HEARTBEAT') {
          logger.info(`[EventBus] ${eventName} triggered.`);
        }
      });
    });
  }
}

// Initialize tracer globally
export const tracer = new ObservabilityTracer();
