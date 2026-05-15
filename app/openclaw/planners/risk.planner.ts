// ============================================================
// OpenClaw – Risk Planner
// Matches system risks to impacted domains and scores request
// ============================================================

import type { RiskAnalysis, Risk, ImpactAnalysis } from '../runtime/types.js';
import { SYSTEM_RISKS } from '../configs/policies.config.js';
import { logger } from '../runtime/logger.js';

const SEVERITY_SCORES: Record<string, number> = {
  CRITICAL: 40,
  HIGH: 20,
  MEDIUM: 10,
  LOW: 3,
};

export class RiskPlanner {
  analyze(impact: ImpactAnalysis, requestText: string): RiskAnalysis {
    const allDomains = [impact.primaryDomain, ...impact.secondaryDomains];
    const lowerRequest = requestText.toLowerCase();

    // Match risks by domain intersection
    const matchedRisks: Risk[] = [];

    for (const risk of SYSTEM_RISKS) {
      const domainMatch = risk.impactedDomains.some(d => allDomains.includes(d));
      if (!domainMatch) continue;

      // Additional keyword matching to filter relevant risks
      const isRelevant = this.isRiskRelevantToRequest(risk, lowerRequest, impact);
      if (isRelevant) {
        matchedRisks.push(risk);
      }
    }

    // Calculate risk score
    let rawScore = 0;
    for (const risk of matchedRisks) {
      rawScore += SEVERITY_SCORES[risk.severity] ?? 0;
    }

    // Governance multiplier
    const multiplier = {
      LOCKED: 1.5,
      GUARDED: 1.2,
      CAREFUL: 1.0,
      FREE: 0.7,
    }[impact.governanceLevel] ?? 1.0;

    const riskScore = Math.min(100, Math.round(rawScore * multiplier));
    const requiresEscalation = riskScore >= 60 || matchedRisks.some(r => r.severity === 'CRITICAL');

    const mitigations = [...new Set(matchedRisks.map(r => r.mitigation))];

    logger.info(`Risk analysis: score=${riskScore}, risks=${matchedRisks.length}, escalation=${requiresEscalation}`);

    return {
      identifiedRisks: matchedRisks,
      riskScore,
      requiresEscalation,
      mitigations,
    };
  }

  private isRiskRelevantToRequest(
    risk: Risk,
    lowerRequest: string,
    impact: ImpactAnalysis
  ): boolean {
    // Always include risks for the primary domain
    if (risk.impactedDomains.includes(impact.primaryDomain)) return true;

    // Keyword-based relevance
    const keywordMap: Record<string, string[]> = {
      data_loss: ['delete', 'remove', 'drop', 'xóa'],
      audit_break: ['status', 'approve', 'reject', 'duyệt'],
      financial_mismatch: ['payment', 'amount', 'thanh toán', 'tiền'],
      stock_corruption: ['inventory', 'pick', 'stock', 'kho'],
      hidden_mutation: ['get', 'list', 'read'],
      queue_loss: ['ocr', 'queue', 'job', 'async'],
      realtime_desync: ['event', 'socket', 'realtime', 'update'],
      duplicate_processing: ['duplicate', 'idempotent', 'twice'],
      fraud_bypass: ['fuel', 'receipt', 'ocr', 'fraud'],
      stale_cache: ['report', 'cache', 'dashboard'],
    };

    const keywords = keywordMap[risk.type] ?? [];
    return keywords.some(kw => lowerRequest.includes(kw));
  }

  formatReport(analysis: RiskAnalysis): string {
    const scoreBar = this.buildScoreBar(analysis.riskScore);
    const escalationIcon = analysis.requiresEscalation ? '🚨' : '✅';

    const lines = [
      `📊 RISK SCORE: ${analysis.riskScore}/100  ${scoreBar}`,
      `${escalationIcon} Escalation required: ${analysis.requiresEscalation ? 'YES' : 'NO'}`,
      '',
    ];

    if (analysis.identifiedRisks.length > 0) {
      lines.push(`⚠️  IDENTIFIED RISKS (${analysis.identifiedRisks.length}):`);
      for (const risk of analysis.identifiedRisks) {
        const icon = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢' }[risk.severity];
        lines.push(`  ${icon} [${risk.id}] ${risk.description}`);
      }
      lines.push('');
    }

    if (analysis.mitigations.length > 0) {
      lines.push('🛡️  MITIGATIONS:');
      for (const m of analysis.mitigations.slice(0, 5)) {
        lines.push(`  → ${m}`);
      }
    }

    return lines.join('\n');
  }

  private buildScoreBar(score: number): string {
    const filled = Math.round(score / 10);
    const empty = 10 - filled;
    const color = score >= 60 ? '🔴' : score >= 30 ? '🟡' : '🟢';
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${color}`;
  }
}
