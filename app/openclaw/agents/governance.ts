import { ExecutionTask } from '../kernel/state.js';
import { BlastRadiusGuard, BlastRadiusExceededError } from '../kernel/guard.js';
import { DOMAIN_CONFIGS } from '../configs/domains.config.js';
import { logger } from '../runtime/logger.js';

export class GovernanceAgent {
  /**
   * Deterministic Governance Check
   * Throws BlastRadiusExceededError if the plan violates system boundaries.
   */
  async judge(plan: Partial<ExecutionTask>): Promise<boolean> {
    logger.info(`[GovernanceAgent] Auditing plan for domain: ${plan.domain}`);
    
    if (!plan.domain || !plan.spec || !plan.spec.filesToModify) {
      throw new BlastRadiusExceededError('Invalid execution plan structure from Planner Agent.');
    }

    const domainRules = DOMAIN_CONFIGS[plan.domain as keyof typeof DOMAIN_CONFIGS];
    if (!domainRules) {
      throw new BlastRadiusExceededError(`Domain '${plan.domain}' is not registered in Governance Config.`);
    }

    // 1. Deterministic Blast Radius Guard
    try {
      BlastRadiusGuard.validate(plan.spec as any);
    } catch (e: any) {
      logger.error(`[GovernanceAgent] Plan REJECTED by Blast Radius Guard: ${e.message}`);
      throw e;
    }

    // 2. Sensitive File Classification (Hardcoded deterministic rules)
    const sensitiveFiles = ['.env', 'firebase.json', 'openclaw/', 'docker-compose.yml'];
    for (const file of plan.spec.filesToModify) {
      for (const sensitive of sensitiveFiles) {
        if (file.includes(sensitive)) {
          throw new BlastRadiusExceededError(`Modification of sensitive path '${sensitive}' is FORBIDDEN by Governance Policy.`);
        }
      }
    }

    // If it survives, it's approved
    logger.info(`[GovernanceAgent] Plan APPROVED. Ready for execution queue.`);
    return true;
  }
}

export const governanceAgent = new GovernanceAgent();
