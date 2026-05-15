import { execSync } from 'child_process';
import { resolve, dirname, join } from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { logger } from '../runtime/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../');
const SANDBOX_DIR = resolve(__dirname, '../../../openclaw-sandboxes');

export class SandboxManager {
  /**
   * Initializes a Git Worktree sandbox for a specific task.
   * Returns the absolute path to the sandbox.
   */
  async createSandbox(taskId: string): Promise<string> {
    const branchName = `task-${taskId}`;
    const sandboxPath = join(SANDBOX_DIR, branchName);

    try {
      // Ensure the sandbox parent directory exists
      await fs.mkdir(SANDBOX_DIR, { recursive: true });

      // Check if branch already exists and delete it (cleanup any previous failed state)
      try {
        execSync(`git branch -D ${branchName}`, { cwd: PROJECT_ROOT, stdio: 'ignore' });
      } catch (e) {}

      // Create the worktree
      logger.info(`[Sandbox] Creating isolated worktree at ${sandboxPath}`);
      execSync(`git worktree add -b ${branchName} "${sandboxPath}"`, { cwd: PROJECT_ROOT });
      
      return sandboxPath;
    } catch (err: any) {
      logger.error(`[Sandbox] Failed to create sandbox: ${err.message}`);
      throw new Error(`Sandbox creation failed: ${err.message}`);
    }
  }

  /**
   * Commits the changes in the sandbox and merges them back to the main branch.
   */
  async commitAndMerge(taskId: string, sandboxPath: string): Promise<void> {
    const branchName = `task-${taskId}`;
    try {
      logger.info(`[Sandbox] Committing verified execution in ${sandboxPath}`);
      // Add all changes inside the sandbox
      execSync(`git add .`, { cwd: sandboxPath });
      
      // Check if there are changes to commit
      const status = execSync(`git status --porcelain`, { cwd: sandboxPath }).toString().trim();
      if (status) {
        execSync(`git commit -m "chore(ai): Execution verified for task ${taskId}"`, { cwd: sandboxPath });
        
        // Merge into main (since we are local, we'll merge the branch in PROJECT_ROOT)
        logger.info(`[Sandbox] Merging ${branchName} into main`);
        execSync(`git merge ${branchName} --no-ff -m "Merge AI execution for task ${taskId}"`, { cwd: PROJECT_ROOT });
      } else {
        logger.info(`[Sandbox] No changes to commit for task ${taskId}`);
      }
    } catch (err: any) {
      logger.error(`[Sandbox] Commit/Merge failed: ${err.message}`);
      throw new Error(`Commit/Merge failed: ${err.message}`);
    }
  }

  /**
   * Cleans up the worktree and branch.
   */
  async cleanupSandbox(taskId: string, sandboxPath: string): Promise<void> {
    const branchName = `task-${taskId}`;
    try {
      logger.info(`[Sandbox] Cleaning up worktree ${sandboxPath}`);
      // Remove worktree (force in case of uncommitted changes)
      execSync(`git worktree remove -f "${sandboxPath}"`, { cwd: PROJECT_ROOT, stdio: 'ignore' });
      
      // Delete the branch
      execSync(`git branch -D ${branchName}`, { cwd: PROJECT_ROOT, stdio: 'ignore' });
    } catch (err: any) {
      logger.warn(`[Sandbox] Cleanup failed (might already be clean): ${err.message}`);
    }
  }
}

export const sandbox = new SandboxManager();
