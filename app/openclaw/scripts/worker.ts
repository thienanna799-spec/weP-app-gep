import { orchestrator } from '../kernel/orchestrator.js';
import { stateStore } from '../kernel/state.js';
import { sandbox } from '../kernel/sandbox.js';
import { verifier } from '../kernel/verifier.js';
import { coderAgent } from '../agents/coder.js';
import { reviewerAgent } from '../agents/reviewer.js';
import { logger } from '../runtime/logger.js';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error('Usage: worker.ts <command> [args]');
    console.error('Commands:');
    console.error('  next                  - Pick up the next APPROVED task');
    console.error('  execute <taskId> <sandboxPath> - Run the Multi-Agent Execution Pipeline (Coder vs Reviewer)');
    console.error('  complete <taskId>     - Mark a task as DONE');
    console.error('  fail <taskId> <reason> - Mark a task as FAILED');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'next': {
        const approvedTasks = await stateStore.getTasksByStatus('APPROVED');
        if (approvedTasks.length === 0) {
          console.log(JSON.stringify({ status: 'EMPTY', message: 'No approved tasks in queue.' }));
          process.exit(0);
        }

        // Generate a UUID for this worker execution
        const workerId = `worker-${randomUUID()}`;

        // Phase 3.5: File-Level Locking - Pick the oldest APPROVED task that is not blocked by file locks
        const lockedTask = await stateStore.pickAndLockNextTask(workerId);
        
        if (!lockedTask) {
          console.log(JSON.stringify({ status: 'BLOCKED', message: 'No safe tasks available. Tasks might be blocked by file locks.' }));
          process.exit(0);
        }

        // Phase 2: Create execution sandbox (Git worktree)
        const sandboxPath = await sandbox.createSandbox(lockedTask.id);

        // Output clean JSON for Antigravity to read
        console.log(JSON.stringify({
          status: 'SUCCESS',
          sandboxPath,
          task: lockedTask
        }, null, 2));
        break;
      }

      case 'execute': {
        const taskId = args[1];
        const sandboxPath = args[2];
        if (!taskId || !sandboxPath) throw new Error('Task ID and Sandbox Path required.');

        const taskToExecute = await stateStore.getTask(taskId);
        if (!taskToExecute) throw new Error(`Task ${taskId} not found.`);

        const MAX_ITERATIONS = 3;
        let iteration = 0;
        let feedback = '';
        let passReview = false;

        logger.info(`[Worker] Starting Adversarial Review Loop for Task ${taskId} (Max ${MAX_ITERATIONS} iterations)...`);

        while (iteration < MAX_ITERATIONS && !passReview) {
          iteration++;
          logger.info(`[Worker] --- Iteration ${iteration} ---`);
          
          // 1. Coder Agent writes code
          await coderAgent.execute(sandboxPath, taskToExecute, feedback, process.env.GEMINI_API_KEY!);

          // 2. Extract git diff
          let diff = '';
          try {
            // Stage changes to get a clean diff of what was added
            execSync(`git add .`, { cwd: sandboxPath });
            diff = execSync(`git diff --staged`, { cwd: sandboxPath, encoding: 'utf-8' });
          } catch (e: any) {
            logger.warn(`[Worker] Failed to get git diff: ${e.message}`);
          }

          if (!diff) {
            feedback = "No changes detected. Ensure you modify the files requested.";
            continue;
          }

          // 3. Reviewer Agent checks code
          const reviewResult = await reviewerAgent.review(diff, taskToExecute, process.env.GEMINI_API_KEY!);
          
          if (reviewResult.pass) {
            logger.info(`[Worker] Reviewer PASSED the code on iteration ${iteration}.`);
            passReview = true;
          } else {
            logger.warn(`[Worker] Reviewer FAILED the code on iteration ${iteration}. Feedback: ${reviewResult.feedback}`);
            feedback = reviewResult.feedback;
          }
        }

        if (!passReview) {
          // Task failed review 3 times
          await sandbox.cleanupSandbox(taskId, sandboxPath);
          const failMsg = `REJECTED_BY_REVIEWER: Failed after 3 iterations. Last feedback: ${feedback}`;
          const task = await orchestrator.failTask(taskId, failMsg);
          console.log(JSON.stringify({ status: 'FAILED', message: `Task ${taskId} failed Adversarial Review.`, task }));
          break;
        }

        // 4. Verification Engine (Syntax + AST Guard)
        const result = await verifier.verify(sandboxPath, taskToExecute);
        
        if (result.passed) {
          // Commit, merge and cleanup
          await sandbox.commitAndMerge(taskId, sandboxPath);
          await sandbox.cleanupSandbox(taskId, sandboxPath);
          
          const task = await orchestrator.completeTask(taskId);
          console.log(JSON.stringify({ status: 'SUCCESS', message: `Task ${taskId} verified and DONE.`, task }));
        } else {
          // Reject due to hallucination / compile errors
          await sandbox.cleanupSandbox(taskId, sandboxPath);
          const failMsg = `REJECTED_DUE_TO_HALLUCINATION: Compiler failed. Log: ${result.errorLog}`;
          const task = await orchestrator.failTask(taskId, failMsg);
          console.log(JSON.stringify({ status: 'FAILED', message: `Task ${taskId} FAILED VERIFICATION.`, task }));
        }
        break;
      }

      case 'complete': {
        const taskId = args[1];
        const sandboxPath = args[2];
        if (!taskId || !sandboxPath) throw new Error('Task ID and Sandbox Path required.');

        const taskToVerify = await stateStore.getTask(taskId);
        if (!taskToVerify) throw new Error(`Task ${taskId} not found.`);

        // Phase 2: Verification Engine (Syntax + AST)
        const result = await verifier.verify(sandboxPath, taskToVerify);
        
        if (result.passed) {
          // Commit, merge and cleanup
          await sandbox.commitAndMerge(taskId, sandboxPath);
          await sandbox.cleanupSandbox(taskId, sandboxPath);
          
          const task = await orchestrator.completeTask(taskId);
          console.log(JSON.stringify({ status: 'SUCCESS', message: `Task ${taskId} verified and DONE.`, task }));
        } else {
          // Reject due to hallucination / compile errors
          await sandbox.cleanupSandbox(taskId, sandboxPath);
          const failMsg = `REJECTED_DUE_TO_HALLUCINATION: Compiler failed. Log: ${result.errorLog}`;
          const task = await orchestrator.failTask(taskId, failMsg);
          console.log(JSON.stringify({ status: 'FAILED', message: `Task ${taskId} FAILED VERIFICATION.`, task }));
        }
        break;
      }

      case 'fail': {
        const taskId = args[1];
        const reason = args.slice(2).join(' ') || 'Unknown error';
        if (!taskId) throw new Error('Task ID required.');
        const task = await orchestrator.failTask(taskId, reason);
        console.log(JSON.stringify({ status: 'SUCCESS', message: `Task ${taskId} marked as FAILED.`, task }));
        break;
      }

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (err: any) {
    console.error(JSON.stringify({ status: 'ERROR', message: err.message }));
    process.exit(1);
  }
}

main().catch(err => {
  logger.error(`[Worker] Unhandled error:`, err);
  process.exit(1);
});
