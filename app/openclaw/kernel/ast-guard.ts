import { promises as fs } from 'fs';
import { resolve, join } from 'path';
import ts from 'typescript';
import { logger } from '../runtime/logger.js';
import { ExecutionTask } from './state.js';
import { DOMAIN_CONFIGS } from '../configs/domains.config.js';

export class AstValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AstValidationError';
  }
}

export class AstGuard {
  
  /**
   * Validate AST compliance for the modified files.
   * Currently enforces prisma.$transaction for P0/P1 domains.
   */
  async validate(sandboxPath: string, task: ExecutionTask): Promise<void> {
    const domainConfig = DOMAIN_CONFIGS[task.domain];
    
    // If the domain doesn't require transaction enforcement, we skip this check.
    if (!domainConfig || !domainConfig.requiresTransaction) {
      logger.info(`[AstGuard] Task domain '${task.domain}' does not require strict transaction enforcement. Skipping.`);
      return;
    }

    const filesToModify = task.spec?.filesToModify || [];
    const filesToCreate = task.spec?.filesToCreate || [];
    const allFiles = [...filesToModify, ...filesToCreate];

    // Only inspect backend files
    const backendFiles = allFiles.filter(f => f.startsWith('server/') && f.endsWith('.ts'));

    if (backendFiles.length === 0) {
      logger.info(`[AstGuard] No backend .ts files to scan.`);
      return;
    }

    for (const relativePath of backendFiles) {
      const fullPath = join(sandboxPath, relativePath);
      let content = '';
      try {
        content = await fs.readFile(fullPath, 'utf-8');
      } catch (e) {
        logger.warn(`[AstGuard] Could not read file ${relativePath} for AST analysis. Skipping.`);
        continue;
      }

      this.analyzeTransactionCompliance(content, relativePath);
    }
  }

  private analyzeTransactionCompliance(sourceCode: string, fileName: string): void {
    const sourceFile = ts.createSourceFile(
      fileName,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    let hasMutation = false;
    let hasTransaction = false;

    const mutationMethods = ['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'];

    // Helper to recursively walk the AST
    const visit = (node: ts.Node) => {
      // Look for PropertyAccessExpression like `prisma.something.create` or `prisma.$transaction`
      if (ts.isPropertyAccessExpression(node)) {
        const text = node.getText(sourceFile);
        
        if (text.includes('prisma.$transaction')) {
          hasTransaction = true;
        }

        // Fast heuristic: if it contains "prisma." and ends with a mutation method
        if (text.startsWith('prisma.') || text.includes('.prisma.')) {
          const method = node.name.getText(sourceFile);
          if (mutationMethods.includes(method)) {
            hasMutation = true;
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    if (hasMutation && !hasTransaction) {
      throw new AstValidationError(
        `File ${fileName} performs Database Mutations (create/update/delete) but does NOT use 'prisma.$transaction'. ` +
        `Domain policy requires all mutations to be wrapped in a transaction for safety.`
      );
    }

    if (hasMutation && hasTransaction) {
      logger.info(`[AstGuard] ${fileName} verified: Transaction is present for mutations.`);
    }
  }
}

export const astGuard = new AstGuard();
