import { promises as fs } from 'fs';
import { dirname } from 'path';
import { openclawConfig } from '../configs/openclaw.config.js';
import { logger } from '../runtime/logger.js';
import { randomUUID } from 'crypto';

export type TaskRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'CREATED' | 'PENDING_APPROVAL' | 'APPROVED' | 'RUNNING' | 'DONE' | 'FAILED';

export interface ExecutionTask {
  id: string;             // UUID
  domain: string;         // finance, inventory...
  action: string;         // short description
  riskLevel: TaskRiskLevel;
  status: TaskStatus;
  spec: any;              // JSON payload detailing the work
  logs: string[];         // Feedback loop logs
  lockedBy?: string | null;      // Worker ID holding the lock
  lockedAt?: number | null;      // Timestamp of lock
  createdAt: number;
  updatedAt: number;
}

export class StateStore {
  private dbPath: string;
  // A promise used to chain all operations to guarantee atomic execution sequentially
  private opLock: Promise<any> = Promise.resolve();

  constructor() {
    this.dbPath = openclawConfig.memory.queuePath;
  }

  /** Ensure the database file and directory exist */
  private async ensureDb(): Promise<void> {
    try {
      await fs.mkdir(dirname(this.dbPath), { recursive: true });
      try {
        await fs.access(this.dbPath);
      } catch {
        await fs.writeFile(this.dbPath, JSON.stringify([]), 'utf-8');
      }
    } catch (err) {
      logger.error(`[StateStore] Error ensuring DB exists:`, err);
    }
  }

  /** Read all tasks from the JSON DB (internal use, unguarded) */
  private async _readAll(): Promise<ExecutionTask[]> {
    await this.ensureDb();
    try {
      const data = await fs.readFile(this.dbPath, 'utf-8');
      return JSON.parse(data) as ExecutionTask[];
    } catch (err) {
      logger.error(`[StateStore] Error reading DB:`, err);
      return [];
    }
  }

  /** Write all tasks to the JSON DB (internal use, unguarded) */
  private async _writeAll(tasks: ExecutionTask[]): Promise<void> {
    await this.ensureDb();
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(tasks, null, 2), 'utf-8');
    } catch (err) {
      logger.error(`[StateStore] Error writing DB:`, err);
    }
  }

  /**
   * Helper to execute operations sequentially.
   * This guarantees that two simultaneous requests don't read the same state
   * and overwrite each other (in a single Node process).
   */
  private async atomic<T>(operation: () => Promise<T>): Promise<T> {
    const nextOp = this.opLock.then(() => operation()).catch((err) => { throw err; });
    this.opLock = nextOp.catch(() => {}); // prevent unhandled rejections from stopping the queue
    return nextOp;
  }

  /** Add a new task to the queue */
  async enqueue(taskData: Omit<ExecutionTask, 'id' | 'status' | 'logs' | 'createdAt' | 'updatedAt' | 'lockedBy' | 'lockedAt'>): Promise<ExecutionTask> {
    return this.atomic(async () => {
      const tasks = await this._readAll();
      const newTask: ExecutionTask = {
        ...taskData,
        id: randomUUID(),
        status: 'PENDING_APPROVAL',
        logs: [],
        lockedBy: null,
        lockedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tasks.push(newTask);
      await this._writeAll(tasks);
      return newTask;
    });
  }

  /** Get a task by ID */
  async getTask(id: string): Promise<ExecutionTask | null> {
    return this.atomic(async () => {
      const tasks = await this._readAll();
      return tasks.find(t => t.id === id) || null;
    });
  }

  /** Get tasks by status */
  async getTasksByStatus(status: TaskStatus): Promise<ExecutionTask[]> {
    return this.atomic(async () => {
      const tasks = await this._readAll();
      return tasks.filter(t => t.status === status);
    });
  }

  /** Update task status */
  async updateStatus(id: string, status: TaskStatus, logMessage?: string): Promise<ExecutionTask | null> {
    return this.atomic(async () => {
      const tasks = await this._readAll();
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) return null;

      tasks[index].status = status;
      tasks[index].updatedAt = Date.now();
      if (logMessage) {
        tasks[index].logs.push(`[${new Date().toISOString()}] ${logMessage}`);
      }
      await this._writeAll(tasks);
      return tasks[index];
    });
  }

  /** 
   * Lock a task for a specific worker. 
   * This is the critical piece preventing race conditions.
   */
  async lockTask(id: string, workerId: string): Promise<ExecutionTask> {
    return this.atomic(async () => {
      const tasks = await this._readAll();
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) throw new Error(`Task ${id} not found.`);
      
      const task = tasks[index];
      if (task.status !== 'APPROVED') {
        throw new Error(`Cannot lock task ${id} because it is not APPROVED (status: ${task.status}).`);
      }
      if (task.lockedBy) {
        throw new Error(`Task ${id} is already locked by worker ${task.lockedBy}.`);
      }

      task.lockedBy = workerId;
      task.lockedAt = Date.now();
      task.status = 'RUNNING';
      task.updatedAt = Date.now();
      task.logs.push(`[${new Date().toISOString()}] Worker ${workerId} locked and started the task.`);

      await this._writeAll(tasks);
      return task;
    });
  }
  /**
   * Phase 3.5: File-Level Locking
   * Helper to dynamically calculate which files are currently locked by RUNNING tasks.
   */
  private getLockedFiles(tasks: ExecutionTask[]): Set<string> {
    const lockedFiles = new Set<string>();
    for (const t of tasks) {
      if (t.status === 'RUNNING') {
        const modify = t.spec?.filesToModify || [];
        const create = t.spec?.filesToCreate || [];
        modify.forEach((f: string) => lockedFiles.add(f));
        create.forEach((f: string) => lockedFiles.add(f));
      }
    }
    return lockedFiles;
  }

  /**
   * Phase 3.5: File-Level Locking
   * Pick the oldest APPROVED task that does NOT conflict with currently locked files.
   * Locks it atomically and returns it. Returns null if no task is available or all are blocked.
   */
  async pickAndLockNextTask(workerId: string): Promise<ExecutionTask | null> {
    return this.atomic(async () => {
      const tasks = await this._readAll();
      const lockedFiles = this.getLockedFiles(tasks);

      // Get approved tasks, sorted by oldest first
      const approvedTasks = tasks
        .filter(t => t.status === 'APPROVED')
        .sort((a, b) => a.updatedAt - b.updatedAt);

      for (const task of approvedTasks) {
        const modify = task.spec?.filesToModify || [];
        const create = task.spec?.filesToCreate || [];
        
        // Check if this task intersects with ANY locked file
        const isConflict = modify.some((f: string) => lockedFiles.has(f)) || 
                           create.some((f: string) => lockedFiles.has(f));

        if (!isConflict) {
          // We found a safe task! Lock it.
          task.lockedBy = workerId;
          task.lockedAt = Date.now();
          task.status = 'RUNNING';
          task.updatedAt = Date.now();
          task.logs.push(`[${new Date().toISOString()}] Worker ${workerId} locked files and started the task.`);

          await this._writeAll(tasks);
          logger.info(`[StateStore] Worker ${workerId} acquired File-Level Lock for task ${task.id}`);
          return task;
        } else {
          logger.warn(`[StateStore] Task ${task.id} is BLOCKED because it attempts to modify currently locked files.`);
        }
      }

      // No unblocked tasks available
      return null;
    });
  }
}

// Export a singleton instance
export const stateStore = new StateStore();
