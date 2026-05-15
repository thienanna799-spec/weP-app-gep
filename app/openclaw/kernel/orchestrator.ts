import { stateStore, ExecutionTask, TaskRiskLevel } from './state.js';
import { eventBus } from './bus.js';
import { logger } from '../runtime/logger.js';
import { BlastRadiusGuard } from './guard.js';

export interface ExecutionRequestPayload {
  domain: string;
  action: string;
  riskLevel: TaskRiskLevel;
  spec: {
    filesToCreate?: string[];
    filesToModify?: string[];
    steps?: string[];
    estimatedLOC?: number;
    [key: string]: any;
  };
}

export class ExecutionOrchestrator {
  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    eventBus.subscribe('USER_APPROVED_TASK', async (payload: { taskId: string, adminId: number }) => {
      try {
        await this.approveTask(payload.taskId);
      } catch (err: any) {
        logger.error(`[Orchestrator] Event handling failed: ${err.message}`);
      }
    });
  }
  /**
   * Parse AI response to extract JSON execution payload if present.
   * Looks for ```json ... ``` blocks containing an ExecutionRequestPayload.
   */
  private extractPayloadFromAI(aiResponse: string): ExecutionRequestPayload | null {
    try {
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
      let match;
      while ((match = jsonRegex.exec(aiResponse)) !== null) {
        const jsonStr = match[1];
        const parsed = JSON.parse(jsonStr);
        if (parsed && parsed.action && parsed.domain && parsed.riskLevel) {
          return parsed as ExecutionRequestPayload;
        }
      }
    } catch (err) {
      logger.warn(`[Orchestrator] Failed to parse JSON from AI response: ${err}`);
    }
    return null;
  }

  /**
   * Process an AI response and queue a task if a valid payload is found.
   * (Legacy V3 Gateway Path)
   */
  async processExecutionPlan(aiResponse: string): Promise<ExecutionTask | null> {
    const payload = this.extractPayloadFromAI(aiResponse);
    if (!payload) {
      logger.info(`[Orchestrator] No structured execution payload found in AI response.`);
      return null;
    }

    logger.info(`[Orchestrator] Found execution payload for domain: ${payload.domain}`);
    
    // Validate capability boundaries (throws BlastRadiusExceededError if failed)
    BlastRadiusGuard.validate(payload.spec);

    return this.queueDirectTask(payload);
  }

  /**
   * Directly queue an Execution Task (V4 Multi-Agent Pipeline)
   */
  async queueDirectTask(payload: Partial<ExecutionTask>): Promise<ExecutionTask> {
    const task = await stateStore.enqueue({
      domain: payload.domain!,
      action: payload.action!,
      riskLevel: payload.riskLevel as TaskRiskLevel,
      spec: payload.spec!
    });

    eventBus.publish('TASK_CREATED', task);
    return task;
  }

  /** Approve a pending task */
  async approveTask(taskId: string): Promise<ExecutionTask | null> {
    const task = await stateStore.getTask(taskId);
    if (!task) throw new Error(`Task ${taskId} not found.`);
    if (task.status !== 'PENDING_APPROVAL') {
      throw new Error(`Task ${taskId} is currently ${task.status}, cannot approve.`);
    }

    const updatedTask = await stateStore.updateStatus(taskId, 'APPROVED', 'Task approved by user via Control Plane.');
    eventBus.publish('TASK_APPROVED', updatedTask);
    return updatedTask;
  }

  /** Lock a task (Worker picks it up) */
  async lockTask(taskId: string, workerId: string): Promise<ExecutionTask | null> {
    const task = await stateStore.lockTask(taskId, workerId);
    eventBus.publish('TASK_LOCKED', task);
    return task;
  }

  /** Complete task */
  async completeTask(taskId: string): Promise<ExecutionTask | null> {
    const updatedTask = await stateStore.updateStatus(taskId, 'DONE', 'Task completed successfully.');
    eventBus.publish('TASK_DONE', updatedTask);
    return updatedTask;
  }

  /** Fail task */
  async failTask(taskId: string, reason: string): Promise<ExecutionTask | null> {
    const updatedTask = await stateStore.updateStatus(taskId, 'FAILED', `Task failed: ${reason}`);
    eventBus.publish('TASK_FAILED', updatedTask);
    return updatedTask;
  }

  /** Get the current queue summary */
  async getQueueSummary(): Promise<string> {
    const pending = await stateStore.getTasksByStatus('PENDING_APPROVAL');
    const approved = await stateStore.getTasksByStatus('APPROVED');
    const running = await stateStore.getTasksByStatus('RUNNING');
    const failed = await stateStore.getTasksByStatus('FAILED');

    let summary = `📋 <b>OpenClaw Execution Queue</b>\n\n`;
    summary += `🟡 <b>Pending Approval:</b> ${pending.length}\n`;
    summary += `🟢 <b>Approved (Waiting for Worker):</b> ${approved.length}\n`;
    summary += `🔵 <b>Running (Locked):</b> ${running.length}\n`;
    summary += `🔴 <b>Failed:</b> ${failed.length}\n\n`;

    if (pending.length > 0) {
      summary += `<b>Tasks cần duyệt:</b>\n`;
      pending.forEach(t => {
        summary += `- <code>${t.id.slice(0, 8)}</code>: ${t.action} [${t.riskLevel}]\n`;
      });
    }

    return summary;
  }
}

export const orchestrator = new ExecutionOrchestrator();
