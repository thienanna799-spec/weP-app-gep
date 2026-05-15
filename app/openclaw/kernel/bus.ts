import { EventEmitter } from 'events';

class KernelEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase limit if we have many observers
    this.setMaxListeners(20);
  }

  // Helper for typed emitting
  public publish(event: KernelEvent, payload: any) {
    this.emit(event, payload);
  }

  // Helper for typed listening
  public subscribe(event: KernelEvent, listener: (payload: any) => void) {
    this.on(event, listener);
  }
}

export type KernelEvent = 
  | 'TASK_CREATED'
  | 'TASK_PENDING_APPROVAL'
  | 'USER_APPROVED_TASK'
  | 'TASK_APPROVED'
  | 'TASK_LOCKED'
  | 'TASK_RUNNING'
  | 'TASK_DONE'
  | 'TASK_FAILED'
  | 'SYSTEM_ALERT'
  | 'WORKER_HEARTBEAT';

export const eventBus = new KernelEventBus();
