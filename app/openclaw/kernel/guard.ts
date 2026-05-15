import { logger } from '../runtime/logger.js';
import { ExecutionRequestPayload } from './orchestrator.js';

export class BlastRadiusExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlastRadiusExceededError';
  }
}

const CAPABILITY_LIMITS = {
  MAX_FILES_CHANGED: 5,
  MAX_LOC: 300,
  FORBIDDEN_PATHS: [
    'openclaw/',
    'startup.bat',
    '.env',
    'docker-compose',
    'package.json'
  ]
};

export class BlastRadiusGuard {
  /**
   * Validates if the execution spec proposed by AI is within the safe boundaries.
   * Throws BlastRadiusExceededError if it breaches any limits.
   */
  static validate(spec: ExecutionRequestPayload['spec']): void {
    logger.info('[Guard] Validating execution spec limits...');

    const filesToCreate = spec.filesToCreate || [];
    const filesToModify = spec.filesToModify || [];
    const estimatedLOC = spec.estimatedLOC || 0;

    const totalFiles = filesToCreate.length + filesToModify.length;

    // 1. Check Max Files Limit
    if (totalFiles > CAPABILITY_LIMITS.MAX_FILES_CHANGED) {
      throw new BlastRadiusExceededError(
        `Task requires changing ${totalFiles} files, which exceeds the safety limit of ${CAPABILITY_LIMITS.MAX_FILES_CHANGED}. Please break down the task.`
      );
    }

    // 2. Check Max LOC Limit
    if (estimatedLOC > CAPABILITY_LIMITS.MAX_LOC) {
      throw new BlastRadiusExceededError(
        `Task estimated to change ${estimatedLOC} lines of code, which exceeds the safety limit of ${CAPABILITY_LIMITS.MAX_LOC}. Please break down the task.`
      );
    }

    // 3. Check Forbidden Paths
    const allFiles = [...filesToCreate, ...filesToModify];
    for (const file of allFiles) {
      for (const forbidden of CAPABILITY_LIMITS.FORBIDDEN_PATHS) {
        // Simple string matching. E.g. 'openclaw/' matches 'openclaw/kernel/guard.ts'
        if (file.toLowerCase().includes(forbidden.toLowerCase())) {
          throw new BlastRadiusExceededError(
            `Task attempts to modify a protected system file: ${file}. Modifying ${forbidden} is strictly forbidden.`
          );
        }
      }
    }

    logger.info('[Guard] Spec validation passed.');
  }
}
