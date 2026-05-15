import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export class ExecutionGuard {
  constructor() {
    console.log(`[Guard] Execution Guard Layer initialized.`);
  }

  public async verifySyntax(filePath: string): Promise<boolean> {
    try {
      console.log(`[Guard] Running compile-time safety check on ${filePath}...`);
      // Run tsc --noEmit on the specific file to check for compile errors
      await execPromise(`npx tsc --noEmit ${filePath}`);
      console.log(`[Guard] AST and Type check PASSED for ${filePath}.`);
      return true;
    } catch (error: any) {
      console.error(`[Guard] AST/Type check FAILED for ${filePath}.`);
      console.error(error.stdout);
      return false;
    }
  }

  public validateDiff(originalContent: string, proposedContent: string): boolean {
    // Basic diff sanity check
    if (proposedContent.trim().length === 0) {
      console.error(`[Guard] Diff validation FAILED: Proposed content is empty.`);
      return false;
    }
    
    // In a full implementation, we would compare ASTs here to ensure 
    // no unintended structural deletions occurred.
    console.log(`[Guard] Diff validation PASSED.`);
    return true;
  }
}
