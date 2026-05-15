// ============================================================
// OpenClaw – Governance Reviewer (Master Reviewer)
// Runs all sub-reviewers and aggregates results
// ============================================================

import type {
  ReviewResult,
  ImpactAnalysis,
  Violation,
  ViolationSeverity,
} from '../runtime/types.js';
import { ANTI_PATTERNS, GOVERNANCE_THRESHOLDS } from '../configs/policies.config.js';
import { getDomainConfig } from '../configs/domains.config.js';
import { logger, logReview, logViolation } from '../runtime/logger.js';

export class GovernanceReviewer {
  /**
   * Review a code snippet or description against domain governance rules.
   * In "describe mode" – analyzes request description rather than actual code.
   */
  review(
    requestId: string,
    request: string,
    impact: ImpactAnalysis,
    codeSnippets?: string[]
  ): ReviewResult {
    const violations: Violation[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const domainConfig = getDomainConfig(impact.primaryDomain);

    // ── Check 1: Governance policy violations ──────────────────
    if (domainConfig) {
      const lowerRequest = request.toLowerCase();

      for (const constraint of domainConfig.mustNot) {
        const keywords = this.extractKeywords(constraint);
        if (keywords.some(kw => lowerRequest.includes(kw))) {
          violations.push(this.makeViolation(
            'GOVERNANCE_VIOLATION',
            'CRITICAL',
            impact.primaryDomain,
            `Request may violate: "${constraint}"`,
            `Verify this constraint is not being violated. If intentional, requires explicit user approval.`
          ));
        }
      }
    }

    // ── Check 2: Anti-pattern detection in code snippets ──────
    if (codeSnippets) {
      for (const snippet of codeSnippets) {
        this.checkAntiPatterns(snippet, impact.primaryDomain, violations);
      }
    }

    // ── Check 3: Transaction requirements ──────────────────────
    if (domainConfig?.requiresTransaction) {
      const hasTransaction = codeSnippets?.some(s =>
        s.includes('$transaction') || s.includes('prisma.$transaction')
      ) ?? false;

      if (!hasTransaction && codeSnippets && codeSnippets.length > 0) {
        violations.push(this.makeViolation(
          'MISSING_TRANSACTION',
          'CRITICAL',
          impact.primaryDomain,
          `Domain '${impact.primaryDomain}' requires $transaction but none found in code`,
          `Wrap multi-step DB operations in prisma.$transaction([...])`
        ));
      }
    }

    // ── Check 4: Audit log requirements ───────────────────────
    if (domainConfig?.requiresAuditLog) {
      const auditModels = {
        orders: 'orderLog',
        inventory: 'rollScanHistory',
        shipping: 'deliveryLog',
        finance: 'paymentLog',
        procurement: 'purchaseOrderLog',
        production: 'rollScanHistory',
        'production-orders': 'productionOrderLog',
      };

      const requiredAuditModel = auditModels[impact.primaryDomain as keyof typeof auditModels];
      if (requiredAuditModel && codeSnippets) {
        const hasAuditLog = codeSnippets.some(s =>
          s.toLowerCase().includes(requiredAuditModel.toLowerCase())
        );
        if (!hasAuditLog) {
          warnings.push(
            `Consider: create ${requiredAuditModel} entry alongside any ${impact.primaryDomain} mutations`
          );
        }
      }
    }

    // ── Check 5: Realtime event requirements ──────────────────
    if (domainConfig?.requiresRealtimeEvent && codeSnippets) {
      const hasEmit = codeSnippets.some(s =>
        s.includes('io.emit') || s.includes("emit('") || s.includes('emit("')
      );
      if (!hasEmit) {
        warnings.push(
          `Domain '${impact.primaryDomain}' requires realtime events. Add io.emit() after mutations.`
        );
      }
    }

    // ── Check 6: Cross-domain impact warnings ─────────────────
    for (const secDomain of impact.secondaryDomains) {
      const secConfig = getDomainConfig(secDomain);
      if (secConfig?.governance === 'LOCKED') {
        warnings.push(
          `⚠️ Change impacts LOCKED domain '${secDomain}'. Verify cascading effects carefully.`
        );
      }
    }

    // Recommendations
    if (impact.governanceLevel === 'LOCKED' || impact.governanceLevel === 'GUARDED') {
      recommendations.push(
        'Run full integration test after changes',
        'Have another engineer review before merging',
        'Update memory files: workflow.md, states.md',
      );
    }

    // Calculate compliance score
    const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
    const highCount = violations.filter(v => v.severity === 'HIGH').length;
    const penalty = criticalCount * 30 + highCount * 15 + warnings.length * 5;
    const complianceScore = Math.max(0, 100 - penalty);
    const passed = complianceScore >= GOVERNANCE_THRESHOLDS.compliancePassScore &&
      !(GOVERNANCE_THRESHOLDS.criticalViolationBlock && criticalCount > 0);

    const result: ReviewResult = {
      requestId,
      domain: impact.primaryDomain,
      reviewedAt: new Date(),
      passed,
      complianceScore,
      violations,
      warnings,
      recommendations,
    };

    // Log results
    logReview(requestId, { domain: impact.primaryDomain, passed, score: complianceScore });
    for (const v of violations) {
      logViolation(requestId, v);
    }

    logger.info(`Review complete: score=${complianceScore}, passed=${passed}, violations=${violations.length}`);
    return result;
  }

  private checkAntiPatterns(code: string, domain: string, violations: Violation[]): void {
    for (const pattern of ANTI_PATTERNS) {
      if (pattern.detection.length === 0) continue;

      const isDetected = pattern.detection.some(token =>
        code.includes(token)
      );

      if (isDetected) {
        violations.push(this.makeViolation(
          pattern.id,
          pattern.severity,
          domain,
          `Anti-pattern detected: ${pattern.name}. ${pattern.description}`,
          pattern.suggestion
        ));
      }
    }
  }

  private makeViolation(
    type: string,
    severity: ViolationSeverity,
    domain: string,
    message: string,
    suggestion: string
  ): Violation {
    return {
      id: `${type}-${Date.now()}`,
      type,
      severity,
      domain,
      message,
      suggestion,
    };
  }

  private extractKeywords(constraint: string): string[] {
    const words = constraint.toLowerCase().split(/\s+/);
    return words.filter(w => w.length > 4 && !['never', 'always', 'must', 'dont', 'without'].includes(w));
  }

  formatResult(result: ReviewResult): string {
    const icon = result.passed ? '✅' : '❌';
    const scoreBar = this.buildScoreBar(result.complianceScore);

    const lines = [
      `${icon} REVIEW RESULT: ${result.passed ? 'PASSED' : 'FAILED'}`,
      `📊 Compliance Score: ${result.complianceScore}/100  ${scoreBar}`,
      `🏷️  Domain: ${result.domain} | Reviewed at: ${result.reviewedAt.toISOString()}`,
      '',
    ];

    if (result.violations.length > 0) {
      lines.push(`❌ VIOLATIONS (${result.violations.length}):`);
      for (const v of result.violations) {
        const icon = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢', INFO: '⚪' }[v.severity];
        lines.push(`  ${icon} [${v.severity}] ${v.message}`);
        lines.push(`       → Fix: ${v.suggestion}`);
      }
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push(`⚠️  WARNINGS (${result.warnings.length}):`);
      for (const w of result.warnings) {
        lines.push(`  ⚠ ${w}`);
      }
      lines.push('');
    }

    if (result.recommendations.length > 0) {
      lines.push('💡 RECOMMENDATIONS:');
      for (const r of result.recommendations) {
        lines.push(`  → ${r}`);
      }
    }

    return lines.join('\n');
  }

  private buildScoreBar(score: number): string {
    const filled = Math.round(score / 10);
    const empty = 10 - filled;
    const color = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${color}`;
  }
}
