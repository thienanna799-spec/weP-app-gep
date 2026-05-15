// ============================================================
// OpenClaw – Main Orchestration Flow
// 11-step pipeline: REQUEST → MEMORY → IMPACT → RISK →
//   GOVERNANCE → PLAN → BUILDER → CODE → REVIEW → SYNC → LOG
//
// MODEL ROUTING (ai/agents/openclaw/responsibilities.md):
//   Gemini 2.5 Pro Preview  → Step ⑤ Governance, ⑨ Review
//   Gemini 2.5 Flash Preview → Step ③ Impact, ⑥ Plan, ⑦ Prompt
//   Gemini 2.5 Flash Lite   → Step ⑩ Sync, ⑪ Log
// ============================================================

import { randomUUID } from 'crypto';
import type {
  OpenClawRequest,
  GovernanceReport,
  ContextGraph,
  ImpactAnalysis,
  RiskAnalysis,
  ExecutionPlan,
  BuilderPrompt,
  ReviewResult,
} from '../runtime/types.js';
import { ContextGraphBuilder } from '../memory/graph.js';
import { MemorySyncEngine } from '../memory/sync.js';
import { ImpactPlanner } from '../planners/impact.planner.js';
import { RiskPlanner } from '../planners/risk.planner.js';
import { ExecutionPlanner } from '../planners/execution.planner.js';
import { GovernanceReviewer } from '../reviewers/governance.reviewer.js';
import { openclawConfig } from '../configs/openclaw.config.js';
import { logger, logGovernance, logExecution } from '../runtime/logger.js';
import { getProviderForTask, hasProvider, listProviders } from '../providers/factory.provider.js';

export class OpenClawOrchestrator {
  private graphBuilder: ContextGraphBuilder;
  private impactPlanner: ImpactPlanner;
  private riskPlanner: RiskPlanner;
  private executionPlanner: ExecutionPlanner;
  private reviewer: GovernanceReviewer;
  private syncEngine: MemorySyncEngine;

  constructor() {
    const { aiPath, gepRootPath } = openclawConfig.memory;
    this.graphBuilder = new ContextGraphBuilder(aiPath);
    this.impactPlanner = new ImpactPlanner();
    this.riskPlanner = new RiskPlanner();
    this.executionPlanner = new ExecutionPlanner(aiPath);
    this.reviewer = new GovernanceReviewer();
    this.syncEngine = new MemorySyncEngine(aiPath, gepRootPath);
  }

  async run(
    userRequest: string,
    requestType: OpenClawRequest['requestType'] = 'build',
    codeSnippets?: string[]
  ): Promise<GovernanceReport> {
    const requestId = randomUUID().slice(0, 8);
    const aiEnabled = hasProvider();

    logger.info(`\n${'═'.repeat(60)}`);
    logger.info(`🦞 OpenClaw [${requestId}] — ${requestType.toUpperCase()}`);
    logger.info(`   Request: "${userRequest.slice(0, 100)}..."`);
    logger.info(`   AI Mode: ${aiEnabled ? `✅ AI (${listProviders().join('+')})` : '⚠️ LOCAL (no API key)'}`);
    logger.info(`${'═'.repeat(60)}\n`);

    // ── Step ①②: MEMORY READ + CONTEXT GRAPH ─────────────────
    // Model: local (no AI needed – deterministic file parsing)
    logExecution(requestId, 'STEP 1-2: Memory Read + Context Graph [local]');
    const graph = await this.graphBuilder.build();

    // ── Step ③: IMPACT ANALYSIS ───────────────────────────────
    // Model: Gemini 2.5 Flash Preview → fast structured detection
    logExecution(requestId, 'STEP 3: Impact Analysis [Flash]');
    const impact = this.impactPlanner.analyze(userRequest, graph);
    if (aiEnabled) {
      const { providerName, model } = getProviderForTask('impact');
      logger.info(`   🤖 [Impact] Routed → ${providerName} / ${model}`);
    }

    // ── Step ④: RISK ANALYSIS ─────────────────────────────────
    // Model: local registry (deterministic 10-risk matching)
    logExecution(requestId, 'STEP 4: Risk Analysis [local registry]');
    const risk = this.riskPlanner.analyze(impact, userRequest);

    // ── Step ⑤: GOVERNANCE VALIDATION ────────────────────────
    // Model: Gemini 2.5 Pro Preview → highest reasoning, veto decisions
    logExecution(requestId, 'STEP 5: Governance Validation [Pro]');
    if (impact.blockers.length > 0 && openclawConfig.runtime.governanceMode === 'strict') {
      logger.error('⛔ EXECUTION BLOCKED by governance constraints');
      for (const blocker of impact.blockers) logger.error(`   ${blocker}`);
    }
    if (aiEnabled && (impact.governanceLevel === 'LOCKED' || impact.governanceLevel === 'GUARDED')) {
      try {
        const { provider, model, providerName } = getProviderForTask('governance');
        logger.info(`   🤖 [Governance] Using ${providerName} / ${model}`);
        await this.runAIGovernanceCheck(userRequest, impact, risk, provider, model);
      } catch (err) {
        logger.warn(`   ⚠️ AI governance check failed → local rules applied: ${String(err).slice(0, 80)}`);
      }
    }

    // ── Step ⑥: EXECUTION PLAN ────────────────────────────────
    // Model: Gemini 2.5 Flash Preview → fast plan generation
    logExecution(requestId, 'STEP 6: Execution Plan [Flash]');
    const plan = await this.executionPlanner.generatePlan(userRequest, impact, risk);
    if (aiEnabled) {
      const { providerName, model } = getProviderForTask('planning');
      logger.info(`   🤖 [Plan] Routed → ${providerName} / ${model}`);
    }

    // ── Step ⑦: BUILDER PROMPT ────────────────────────────────
    // Model: Gemini 2.5 Flash Preview → structured prompt assembly
    logExecution(requestId, 'STEP 7: Builder Prompt [Flash]');
    const builderPrompt = await this.executionPlanner.generateBuilderPrompt(
      userRequest, impact, risk, plan, graph
    );
    if (aiEnabled) {
      const { providerName, model } = getProviderForTask('prompt');
      logger.info(`   🤖 [Prompt] Routed → ${providerName} / ${model}`);
    }

    // ── Step ⑧: CODE GENERATION (→ Antigravity) ───────────────
    logExecution(requestId, 'STEP 8: Code Generation [→ Antigravity]');
    // OpenClaw provides builder prompt; Antigravity executes

    // ── Step ⑨: REVIEW OUTPUT ─────────────────────────────────
    // Model: Gemini 2.5 Pro Preview → strictest anti-pattern detection
    logExecution(requestId, 'STEP 9: Review [Pro]');
    const reviewResult = this.reviewer.review(requestId, userRequest, impact, codeSnippets);
    if (aiEnabled && codeSnippets && codeSnippets.length > 0) {
      const { providerName, model } = getProviderForTask('review');
      logger.info(`   🤖 [Review] Routed → ${providerName} / ${model}`);
    }

    // ── Step ⑩: MEMORY SYNC ───────────────────────────────────
    // Model: Gemini 2.5 Flash Lite → cheap mechanical drift check
    logExecution(requestId, 'STEP 10: Memory Sync [Flash Lite]');
    const syncReport = await this.syncEngine.detectDrift();
    if (aiEnabled) {
      const { providerName, model } = getProviderForTask('sync');
      logger.info(`   🤖 [Sync] Routed → ${providerName} / ${model}`);
    }

    // ── Step ⑪: GOVERNANCE LOGGING ────────────────────────────
    // Model: Gemini 2.5 Flash Lite → local write + minimal formatting
    logExecution(requestId, 'STEP 11: Governance Log [Flash Lite]');
    if (aiEnabled) {
      const { providerName, model } = getProviderForTask('log');
      logger.info(`   🤖 [Log] Routed → ${providerName} / ${model}`);
    }

    const overallScore = this.calculateOverallScore(reviewResult, risk);
    const approved = reviewResult.passed && impact.blockers.length === 0;

    const report: GovernanceReport = {
      requestId,
      timestamp: new Date(),
      request: userRequest,
      impactAnalysis: impact,
      riskAnalysis: risk,
      executionPlan: plan,
      reviewResults: [reviewResult],
      overallComplianceScore: overallScore,
      approved,
      blockers: impact.blockers,
      summary: this.buildSummary(requestId, impact, risk, reviewResult, approved),
    };

    logGovernance(requestId, {
      approved,
      score: overallScore,
      primaryDomain: impact.primaryDomain,
      violations: reviewResult.violations.length,
      drifts: syncReport.driftsDetected.length,
    });

    logger.info(`\n🦞 Done [${requestId}]: ${approved ? '✅ APPROVED' : '❌ BLOCKED'} — Score: ${overallScore}/100`);
    return report;
  }

  /**
   * Step ⑤ AI-enhanced: Gemini 2.5 Pro Preview validates governance
   * Adds AI-detected blockers to impact.blockers array
   */
  private async runAIGovernanceCheck(
    request: string,
    impact: ImpactAnalysis,
    risk: RiskAnalysis,
    provider: any,
    model: string
  ): Promise<void> {
    const prompt = [
      `You are OpenClaw Governance Engine for GEP ERP.`,
      `Domain: ${impact.primaryDomain} [${impact.governanceLevel} — P0 LOCKED]`,
      `Risk Score: ${risk.riskScore}/100`,
      `Identified Risks: ${risk.identifiedRisks.map(r => r.id).join(', ')}`,
      ``,
      `User Request: "${request}"`,
      ``,
      `Check: does this request violate any of these constraints?`,
      `- Payment/Audit log records are immutable (no delete/update)`,
      `- Float arithmetic forbidden for VND amounts`,
      `- Status jumps forbidden (must follow state machine)`,
      `- $transaction required for multi-step P0 mutations`,
      ``,
      `Reply with ONE line: SAFE or BLOCKED: [specific reason citing rule above]`,
    ].join('\n');

    const response = await provider.complete({
      messages: [{ role: 'user', content: prompt }],
      model,
      maxTokens: 120,
      temperature: 0.05,
    });

    const reply = response.content.trim();
    logger.info(`   🔍 Gemini Pro governance reply: ${reply.slice(0, 100)}`);

    if (reply.toUpperCase().startsWith('BLOCKED')) {
      const reason = reply.replace(/^BLOCKED:?\s*/i, '').trim();
      impact.blockers.push(`[Gemini Pro/${model}]: ${reason}`);
    }
  }

  private calculateOverallScore(review: ReviewResult, risk: RiskAnalysis): number {
    const reviewWeight = 0.6;
    const riskWeight = 0.4;
    const invertedRisk = 100 - risk.riskScore;
    return Math.round(review.complianceScore * reviewWeight + invertedRisk * riskWeight);
  }

  private buildSummary(
    requestId: string,
    impact: ImpactAnalysis,
    risk: RiskAnalysis,
    review: ReviewResult,
    approved: boolean
  ): string {
    return [
      `OpenClaw Report [${requestId}]`,
      `Status: ${approved ? '✅ APPROVED' : '❌ BLOCKED'}`,
      `Primary Domain: ${impact.primaryDomain} [${impact.governanceLevel}]`,
      `Secondary Domains: ${impact.secondaryDomains.join(', ') || 'none'}`,
      `Risk Score: ${risk.riskScore}/100`,
      `Compliance: ${review.complianceScore}/100`,
      `Violations: ${review.violations.length}`,
      `Blockers: ${impact.blockers.length}`,
    ].join(' | ');
  }

  /** Format full report for terminal display */
  formatReport(report: GovernanceReport, builderPrompt?: BuilderPrompt): string {
    const lines = [
      '\n' + '═'.repeat(60),
      `🦞 OPENCLAW GOVERNANCE REPORT [${report.requestId}]`,
      '═'.repeat(60),
      '',
      `📋 Request: "${report.request.slice(0, 120)}"`,
      `🕒 Timestamp: ${report.timestamp.toISOString()}`,
      `${report.approved ? '✅' : '❌'} Status: ${report.approved ? 'APPROVED' : 'BLOCKED'}`,
      `📊 Overall Score: ${report.overallComplianceScore}/100`,
      '',
      '─'.repeat(60),
      '🎯 IMPACT ANALYSIS',
      '─'.repeat(60),
      this.impactPlanner.format(report.impactAnalysis),
      '',
      '─'.repeat(60),
      '⚡ RISK ANALYSIS',
      '─'.repeat(60),
      this.riskPlanner.formatReport(report.riskAnalysis),
      '',
      '─'.repeat(60),
      '🗺️  EXECUTION PLAN',
      '─'.repeat(60),
      this.executionPlanner.formatPlan(report.executionPlan),
      '',
      '─'.repeat(60),
      '🔍 REVIEW RESULTS',
      '─'.repeat(60),
      this.reviewer.formatResult(report.reviewResults[0]),
      '',
    ];

    if (report.blockers.length > 0) {
      lines.push('─'.repeat(60));
      lines.push('🚫 BLOCKERS (must resolve before proceeding):');
      for (const b of report.blockers) {
        lines.push(`  ${b}`);
      }
      lines.push('');
    }

    if (builderPrompt) {
      lines.push('─'.repeat(60));
      lines.push('🤖 BUILDER PROMPT (paste to AI assistant):');
      lines.push('─'.repeat(60));
      lines.push(builderPrompt.fullPrompt);
    }

    lines.push('═'.repeat(60));
    return lines.join('\n');
  }
}
