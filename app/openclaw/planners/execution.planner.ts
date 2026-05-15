// ============================================================
// OpenClaw – Execution Planner
// Generates phased execution plan + builder prompt
// ============================================================

import type {
  ExecutionPlan,
  ExecutionPhase,
  BuilderPrompt,
  ImpactAnalysis,
  RiskAnalysis,
  ContextGraph,
} from '../runtime/types.js';
import { getDomainConfig } from '../configs/domains.config.js';
import { ContextGraphBuilder } from '../memory/graph.js';
import { IMMUTABLE_CONSTRAINTS } from '../configs/policies.config.js';
import { logger } from '../runtime/logger.js';

export class ExecutionPlanner {
  private graphBuilder: ContextGraphBuilder;

  constructor(aiPath: string) {
    this.graphBuilder = new ContextGraphBuilder(aiPath);
  }

  async generatePlan(
    request: string,
    impact: ImpactAnalysis,
    risk: RiskAnalysis
  ): Promise<ExecutionPlan> {
    const domainConfig = getDomainConfig(impact.primaryDomain);

    const phases: ExecutionPhase[] = [];
    let phaseOrder = 1;

    // Phase 0: Pre-checks for LOCKED/GUARDED domains
    if (impact.governanceLevel === 'LOCKED' || impact.governanceLevel === 'GUARDED') {
      phases.push({
        order: phaseOrder++,
        name: 'Pre-Execution Verification',
        description: 'Verify all constraints before writing any code',
        domain: impact.primaryDomain,
        actions: [
          `Read ai/domains/${impact.primaryDomain}/skill.md`,
          `Read ai/domains/${impact.primaryDomain}/workflow.md`,
          `Read ai/domains/${impact.primaryDomain}/states.md`,
          'Verify no blocked operations in request',
          'Confirm $transaction requirement if multi-step',
          'Identify audit log model to create',
          'Identify socket event to emit',
        ],
        dependencies: [],
        risks: risk.identifiedRisks.map(r => r.id),
      });
    }

    // Phase 1: Primary domain implementation
    phases.push({
      order: phaseOrder++,
      name: `Primary Implementation: ${impact.primaryDomain}`,
      description: `Core business logic changes in the ${impact.primaryDomain} domain`,
      domain: impact.primaryDomain,
      actions: this.generatePrimaryActions(request, impact),
      dependencies: phases.length > 0 ? ['Pre-Execution Verification'] : [],
      risks: risk.identifiedRisks
        .filter(r => r.impactedDomains.includes(impact.primaryDomain))
        .map(r => r.id),
    });

    // Phase 2: Secondary domain side effects
    for (const secDomain of impact.secondaryDomains.slice(0, 3)) {
      phases.push({
        order: phaseOrder++,
        name: `Side Effects: ${secDomain}`,
        description: `Required changes in ${secDomain} due to ${impact.primaryDomain} changes`,
        domain: secDomain,
        actions: this.generateSideEffectActions(impact.primaryDomain, secDomain),
        dependencies: [`Primary Implementation: ${impact.primaryDomain}`],
        risks: [],
      });
    }

    // Final phase: Memory sync
    phases.push({
      order: phaseOrder++,
      name: 'Memory Sync',
      description: 'Update AI memory files to reflect changes',
      domain: 'system',
      actions: this.generateMemorySyncActions(impact),
      dependencies: [`Primary Implementation: ${impact.primaryDomain}`],
      risks: [],
    });

    const complexity = this.estimateComplexity(impact, risk);

    const plan: ExecutionPlan = {
      phases,
      estimatedComplexity: complexity,
      filesToCreate: this.inferFilesToCreate(request, impact),
      filesToModify: this.inferFilesToModify(impact),
      memoryFilesToUpdate: this.inferMemoryFilesToUpdate(impact),
      preChecklist: domainConfig?.constraints ?? [],
      postChecklist: this.generatePostChecklist(impact),
    };

    logger.info(`Execution plan generated: ${phases.length} phases, complexity=${complexity}`);
    return plan;
  }

  async generateBuilderPrompt(
    request: string,
    impact: ImpactAnalysis,
    risk: RiskAnalysis,
    plan: ExecutionPlan,
    graph: ContextGraph
  ): Promise<BuilderPrompt> {
    const domainConfig = getDomainConfig(impact.primaryDomain);
    const domainContext = await this.graphBuilder.getDomainContext(impact.primaryDomain);

    const systemContext = [
      '# OpenClaw Engineering Context',
      '',
      '## System Rules (Non-Negotiable)',
      ...IMMUTABLE_CONSTRAINTS.map(c => `- ${c}`),
      '',
      '## Engineering Rules',
      '- Use asyncHandler for all async route handlers',
      '- Use sendSuccess/sendError for all API responses',
      '- Use Prisma $transaction for atomic multi-step operations',
      '- Emit io.emit() after every P0/P1 domain mutation',
      '- NEVER add DB writes inside GET handlers',
      '- NEVER use floating-point for VND monetary amounts',
      '- ALWAYS create audit log entry alongside P0/P1 mutations',
    ].join('\n');

    const governanceRules = [
      `## Governance: ${impact.governanceLevel} [${domainConfig?.priority ?? 'P2'}]`,
      '',
      '### MUST DO:',
      ...(domainConfig?.constraints ?? []).map(c => `- ✅ ${c}`),
      '',
      '### MUST NOT:',
      ...(domainConfig?.mustNot ?? []).map(c => `- ❌ ${c}`),
    ].join('\n');

    const constraints = [
      ...(domainConfig?.constraints ?? []),
      ...(risk.mitigations ?? []),
      ...IMMUTABLE_CONSTRAINTS.slice(0, 3),
    ];

    const fullPrompt = [
      systemContext,
      '',
      '---',
      '',
      domainContext,
      '',
      '---',
      '',
      governanceRules,
      '',
      '---',
      '',
      `## TASK`,
      '',
      request,
      '',
      '## EXECUTION PLAN',
      '',
      plan.phases.map(p => `**Phase ${p.order}: ${p.name}**\n${p.actions.map(a => `  - ${a}`).join('\n')}`).join('\n\n'),
      '',
      '## POST-BUILD CHECKLIST (Required)',
      '',
      plan.postChecklist.map(c => `- [ ] ${c}`).join('\n'),
    ].join('\n');

    return {
      systemContext,
      domainMemory: domainContext,
      governanceRules,
      taskDescription: request,
      constraints,
      postBuildChecklist: plan.postChecklist,
      fullPrompt,
    };
  }

  private generatePrimaryActions(request: string, impact: ImpactAnalysis): string[] {
    const config = getDomainConfig(impact.primaryDomain);
    const actions: string[] = [
      `Implement requested change: "${request.slice(0, 80)}..."`,
    ];

    if (config?.requiresTransaction) {
      actions.push('Wrap multi-step operations in prisma.$transaction([...])');
    }
    if (config?.requiresAuditLog) {
      actions.push(`Create ${impact.primaryDomain} audit log entry alongside mutation`);
    }
    if (config?.requiresRealtimeEvent) {
      actions.push(`Emit io.emit() event after successful mutation`);
    }

    return actions;
  }

  private generateSideEffectActions(fromDomain: string, toDomain: string): string[] {
    return [
      `Verify ${toDomain} domain is not broken by ${fromDomain} changes`,
      `Check cross-domain events still flow correctly`,
      `Test ${fromDomain}→${toDomain} integration path`,
    ];
  }

  private generateMemorySyncActions(impact: ImpactAnalysis): string[] {
    const actions: string[] = [];
    const files = [
      `ai/domains/${impact.primaryDomain}/workflow.md`,
      `ai/domains/${impact.primaryDomain}/states.md`,
    ];

    for (const f of files) {
      actions.push(`Update ${f} if workflow or states changed`);
    }
    actions.push('Run: openclaw sync to detect any remaining drift');
    return actions;
  }

  private estimateComplexity(impact: ImpactAnalysis, risk: RiskAnalysis): ExecutionPlan['estimatedComplexity'] {
    const secondaryCount = impact.secondaryDomains.length;
    const riskScore = risk.riskScore;
    const isLocked = impact.governanceLevel === 'LOCKED';

    if (isLocked && riskScore >= 60) return 'critical';
    if (isLocked || riskScore >= 40) return 'high';
    if (secondaryCount >= 2 || riskScore >= 20) return 'medium';
    if (secondaryCount >= 1) return 'low';
    return 'trivial';
  }

  private inferFilesToCreate(_request: string, impact: ImpactAnalysis): string[] {
    return [
      `server/src/controllers/${impact.primaryDomain}.controller.ts (modify)`,
    ];
  }

  private inferFilesToModify(impact: ImpactAnalysis): string[] {
    const files = [
      `server/src/controllers/${impact.primaryDomain}.controller.ts`,
      `server/src/router.ts (if new route)`,
    ];
    if (impact.governanceLevel === 'LOCKED' || impact.governanceLevel === 'GUARDED') {
      files.push(`server/prisma/schema.prisma (if new model field)`);
    }
    return files;
  }

  private inferMemoryFilesToUpdate(impact: ImpactAnalysis): string[] {
    return [
      `ai/domains/${impact.primaryDomain}/workflow.md`,
      `ai/domains/${impact.primaryDomain}/states.md`,
      `ai/domains/${impact.primaryDomain}/skill.md`,
    ];
  }

  private generatePostChecklist(impact: ImpactAnalysis): string[] {
    const config = getDomainConfig(impact.primaryDomain);
    const checklist: string[] = [];

    if (config?.requiresTransaction) checklist.push('$transaction wrapping verified?');
    if (config?.requiresAuditLog) checklist.push(`${impact.primaryDomain} audit log created?`);
    if (config?.requiresRealtimeEvent) checklist.push('Socket event emitted after mutation?');
    checklist.push('No DB writes inside GET handlers?');
    checklist.push('Memory files updated (workflow.md, states.md)?');
    checklist.push('Run openclaw review to verify compliance');

    return checklist;
  }

  formatPlan(plan: ExecutionPlan): string {
    const complexityIcon = {
      trivial: '🟢', low: '🟡', medium: '🟠', high: '🔴', critical: '🚨',
    }[plan.estimatedComplexity];

    const lines = [
      `${complexityIcon} COMPLEXITY: ${plan.estimatedComplexity.toUpperCase()}`,
      '',
      `📋 EXECUTION PLAN (${plan.phases.length} phases):`,
      '',
    ];

    for (const phase of plan.phases) {
      lines.push(`Phase ${phase.order}: ${phase.name}`);
      for (const action of phase.actions) {
        lines.push(`  ✦ ${action}`);
      }
      lines.push('');
    }

    if (plan.postChecklist.length > 0) {
      lines.push('✅ POST-BUILD CHECKLIST:');
      for (const item of plan.postChecklist) {
        lines.push(`  □ ${item}`);
      }
    }

    return lines.join('\n');
  }
}
