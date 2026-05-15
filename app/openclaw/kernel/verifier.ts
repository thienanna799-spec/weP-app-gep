import { execSync } from 'child_process';
import { logger } from '../runtime/logger.js';
import { astGuard } from './ast-guard.js';
import { ExecutionTask } from './state.js';

export interface VerificationResult {
  passed: boolean;
  errorLog?: string;
}

export class CompilationVerifier {
  /**
   * Runs TypeScript compiler inside the sandbox to verify types and syntax.
   * Then runs AST Guard to enforce behavioral truth (e.g. transactions).
   */
  async verify(sandboxPath: string, task: ExecutionTask): Promise<VerificationResult> {
    try {
      logger.info(`[Verifier] Running tsc --noEmit in sandbox: ${sandboxPath}`);
      
      // Execute typescript compiler
      execSync(`npx tsc --noEmit`, { cwd: sandboxPath, stdio: 'pipe' });
      logger.info(`[Verifier] Compilation PASSED.`);

      // Run Behavioral Truth Check (AST Enforcement)
      await astGuard.validate(sandboxPath, task);
      
      return { passed: true };

    } catch (err: any) {
      // execSync throws an error on non-zero exit code. 
      // The output of the compiler is usually in err.stdout
      const output = err.stdout ? err.stdout.toString() : err.message;
      
      logger.error(`[Verifier] Compilation FAILED. Capturing error log.`);
      
      // Extract the first few lines of the error to avoid flooding
      const errorLog = output.split('\n').slice(0, 15).join('\n');
      
      return { 
        passed: false, 
        errorLog 
      };
    }
  }
}

export const verifier = new CompilationVerifier();
