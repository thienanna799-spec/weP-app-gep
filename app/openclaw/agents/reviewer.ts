import { callGemini } from './llm.js';
import { ExecutionTask } from '../kernel/state.js';
import { logger } from '../runtime/logger.js';
import { DOMAIN_CONFIGS } from '../configs/domains.config.js';
import { promises as fs } from 'fs';
import { resolve, join } from 'path';

// ─── Prompt: Review git diff (Sandbox mode — existing) ───────────
const REVIEWER_PROMPT = `You are the REVIEWER AGENT for the OpenClaw v4 System.
Your job is to act as a strict Principal Engineer reviewing a Pull Request.

TASK:
Action: {ACTION}
Domain: {DOMAIN}

DOMAIN GOVERNANCE RULES:
{DOMAIN_RULES}

GIT DIFF (Coder's Implementation):
{GIT_DIFF}

CRITICAL REVIEW CHECKLIST:
1. Did the Coder fulfill the requirements?
2. Did they violate any Governance Rules (e.g., missing prisma.$transaction for P0 domains)?
3. Are there any obvious bugs, infinite loops, or bad practices?
4. Are side effects properly handled (e.g. emitting socket events)?

You MUST output a JSON object:
{
  "status": "PASS" | "FAIL",
  "feedback": "If PASS, short approval. If FAIL, detailed explanation of what is wrong and exactly how the Coder must fix it."
}

Only return raw JSON. No markdown blocks.`;

// ─── Prompt: Review existing feature (Manual mode — NEW) ─────────
const FEATURE_REVIEW_PROMPT = `You are the REVIEWER AGENT for the OpenClaw v4 System.
Acting as a Principal Engineer / Tech Lead conducting a thorough code review.

FEATURE BEING REVIEWED: {FEATURE_NAME}
DOMAIN: {DOMAIN}

DOMAIN GOVERNANCE RULES:
{DOMAIN_RULES}

MEMORY CONTEXT (Architecture & Conventions):
{MEMORY_CONTEXT}

SOURCE CODE TO REVIEW:
{SOURCE_CODE}

YOUR MISSION — Review against this checklist:

[P0 DOMAIN RULES]
- Finance/Inventory/Orders mutations MUST use prisma.$transaction
- P0 mutations MUST write to userActivityLog
- Inventory mutations MUST emit inventory_updated socket event

[CODE QUALITY]
- All async handlers wrapped with asyncHandler()
- All responses use sendSuccess() / sendError() — never res.json() directly
- No missing null checks (findUnique result used without null guard)
- No N+1 queries (findMany inside a loop without batching)
- No race conditions in concurrent operations

[SOCKET EVENTS]
- Correct event name used (order_updated, inventory_updated, shipping_updated, user_updated)
- Socket emit uses: const io = req.app.get('io'); if (io) io.emit(...)
- Payload contains required fields

[ARCHITECTURE]
- No business logic in controllers (should be in services)
- No direct Prisma calls in frontend files
- Follows folder conventions in backend-patterns.md

OUTPUT FORMAT (JSON only, no markdown):
{
  "status": "PASS" | "WARN" | "FAIL",
  "summary": "1-2 sentence overall assessment",
  "issues": [
    {
      "severity": "ERROR" | "WARNING" | "INFO",
      "file": "relative/path/to/file.ts",
      "line": "L45 (approximate)",
      "message": "What is wrong and why",
      "fix": "Exactly how to fix it"
    }
  ],
  "memoryUpdateSuggestions": [
    {
      "file": "ai/shared/socket-events.md",
      "reason": "New event discovered: reconciliation.done"
    }
  ]
}`;

export class ReviewerAgent {
  private rootDir: string;

  constructor() {
    // Resolve project root (one level up from openclaw/)
    this.rootDir = resolve(process.cwd(), '..');
  }

  /**
   * [EXISTING] Reviews git diff from Coder Agent in Sandbox mode.
   */
  async review(diff: string, task: ExecutionTask, apiKey: string): Promise<{ pass: boolean, feedback: string }> {
    logger.info(`[ReviewerAgent] Analyzing git diff for task ${task.id}...`);

    if (!diff || diff.trim() === '') {
      return { pass: false, feedback: "Git diff is empty. The Coder Agent did not make any changes or failed to write to files." };
    }

    const domainConfig = DOMAIN_CONFIGS[task.domain as keyof typeof DOMAIN_CONFIGS];
    const domainRules = domainConfig ? JSON.stringify(domainConfig, null, 2) : "No specific domain rules.";

    const prompt = REVIEWER_PROMPT
      .replace('{ACTION}', task.action)
      .replace('{DOMAIN}', task.domain)
      .replace('{DOMAIN_RULES}', domainRules)
      .replace('{GIT_DIFF}', diff);

    const response = await callGemini(prompt, "Please review the diff.", apiKey);

    const cleanJson = response.replace(/```json\s*[\s\S]*?\s*```/g, (match) => {
      return match.replace(/```json\s*/, '').replace(/\s*```/, '');
    }).trim();

    try {
      const result = JSON.parse(cleanJson);
      return {
        pass: result.status === 'PASS',
        feedback: result.feedback || ''
      };
    } catch (e) {
      logger.error(`[ReviewerAgent] Failed to parse Reviewer output: ${e}`);
      return { pass: false, feedback: `Reviewer Agent syntax error. Cannot approve.` };
    }
  }

  /**
   * [NEW] Reviews an existing feature by keyword — finds related files,
   * reads them, and returns a structured report for Telegram.
   */
  async reviewFeature(featureName: string, memoryContext: string, apiKey: string): Promise<string> {
    logger.info(`[ReviewerAgent] Starting feature review: "${featureName}"`);

    // Step 1: Map feature keyword → domain
    const domain = this.detectDomain(featureName);
    const domainConfig = DOMAIN_CONFIGS[domain as keyof typeof DOMAIN_CONFIGS];
    const domainRules = domainConfig ? JSON.stringify(domainConfig, null, 2) : "No specific domain rules.";

    // Step 2: Find relevant source files by keyword
    const relevantFiles = await this.findRelevantFiles(featureName);
    logger.info(`[ReviewerAgent] Found ${relevantFiles.length} relevant files`);

    if (relevantFiles.length === 0) {
      return `⚠️ <b>Review: ${featureName}</b>\n\nKhông tìm thấy file liên quan trong codebase. Hãy mô tả rõ hơn tên tính năng hoặc tên file cụ thể.`;
    }

    // Step 3: Read file contents (limit to avoid token overflow)
    const sourceCode = await this.readFiles(relevantFiles, 6000);

    // Step 4: Call Reviewer LLM
    const prompt = FEATURE_REVIEW_PROMPT
      .replace('{FEATURE_NAME}', featureName)
      .replace('{DOMAIN}', domain)
      .replace('{DOMAIN_RULES}', domainRules)
      .replace('{MEMORY_CONTEXT}', memoryContext.slice(0, 2000))
      .replace('{SOURCE_CODE}', sourceCode);

    const response = await callGemini(prompt, `Review feature: ${featureName}`, apiKey);

    // Step 5: Parse and format for Telegram
    return this.formatReviewReport(featureName, relevantFiles, response);
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private detectDomain(featureName: string): string {
    const lower = featureName.toLowerCase();
    if (lower.includes('kho') || lower.includes('inventory') || lower.includes('nhập') || lower.includes('import')) return 'inventory';
    if (lower.includes('đơn') || lower.includes('order')) return 'orders';
    if (lower.includes('tài chính') || lower.includes('finance') || lower.includes('thanh toán')) return 'finance';
    if (lower.includes('giao') || lower.includes('ship') || lower.includes('vận')) return 'shipping';
    if (lower.includes('khách') || lower.includes('customer') || lower.includes('crm')) return 'customers';
    if (lower.includes('tài xế') || lower.includes('driver') || lower.includes('xe')) return 'drivers';
    if (lower.includes('sản xuất') || lower.includes('production')) return 'production';
    if (lower.includes('báo cáo') || lower.includes('report')) return 'reports';
    return 'general';
  }

  private async findRelevantFiles(featureName: string): Promise<string[]> {
    const keywords = featureName.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .map(w => w.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ''));

    const domainMap: Record<string, string[]> = {
      'kho': ['inventory', 'import-batch', 'stock', 'rolls'],
      'nhap': ['import', 'import-batch', 'stock-sync'],
      'don': ['orders', 'dispatch'],
      'giao': ['shipping', 'dispatch', 'delivery'],
      'khach': ['customers', 'crm'],
      'tai': ['drivers', 'daily-logs'],
      'excel': ['import', 'customers-import', 'stock-sync'],
      'finance': ['finance'],
      'bao': ['reports'],
    };

    const targetDirs = [
      join(this.rootDir, 'server', 'src', 'controllers'),
      join(this.rootDir, 'server', 'src', 'services'),
      join(this.rootDir, 'src', 'modules'),
    ];

    const found: string[] = [];

    for (const dir of targetDirs) {
      try {
        const files = await this.walkDir(dir);
        for (const file of files) {
          const filename = file.toLowerCase();
          const isRelevant = keywords.some(kw => filename.includes(kw)) ||
            Object.entries(domainMap).some(([key, patterns]) =>
              keywords.includes(key) && patterns.some(p => filename.includes(p))
            );
          if (isRelevant) found.push(file);
        }
      } catch { /* dir might not exist */ }
    }

    return found.slice(0, 8); // Max 8 files to avoid token overflow
  }

  private async walkDir(dir: string): Promise<string[]> {
    const result: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          result.push(...await this.walkDir(full));
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          result.push(full);
        }
      }
    } catch { /* ignore */ }
    return result;
  }

  private async readFiles(files: string[], maxChars: number): Promise<string> {
    let total = '';
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = file.replace(this.rootDir, '').replace(/\\/g, '/');
        const snippet = `\n// === FILE: ${relativePath} ===\n${content.slice(0, 1500)}\n`;
        if ((total + snippet).length > maxChars) break;
        total += snippet;
      } catch { /* skip unreadable */ }
    }
    return total;
  }

  private formatReviewReport(featureName: string, files: string[], rawResponse: string): string {
    try {
      const cleanJson = rawResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const result = JSON.parse(cleanJson);

      const statusEmoji = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
      const fileList = files.map(f => `  • ${f.split(/[\\/]/).slice(-2).join('/')}`).join('\n');

      let report = `🔍 <b>CODE REVIEW — ${featureName}</b>\n`;
      report += `${statusEmoji} <b>Kết quả: ${result.status}</b>\n\n`;
      report += `📋 <i>${result.summary}</i>\n\n`;
      report += `📁 <b>Files đã kiểm tra:</b>\n${fileList}\n\n`;

      if (result.issues && result.issues.length > 0) {
        report += `<b>Vấn đề phát hiện:</b>\n`;
        for (const issue of result.issues.slice(0, 5)) {
          const icon = issue.severity === 'ERROR' ? '❌' : issue.severity === 'WARNING' ? '⚠️' : 'ℹ️';
          report += `${icon} <code>${issue.file}:${issue.line || ''}</code>\n`;
          report += `   ${issue.message}\n`;
          if (issue.fix) report += `   💡 <i>${issue.fix}</i>\n`;
        }
        report += '\n';
      } else {
        report += `✅ Không phát hiện vấn đề nào.\n\n`;
      }

      if (result.memoryUpdateSuggestions && result.memoryUpdateSuggestions.length > 0) {
        report += `💾 <b>Gợi ý cập nhật Memory:</b>\n`;
        for (const s of result.memoryUpdateSuggestions) {
          report += `  • <code>${s.file}</code> — ${s.reason}\n`;
        }
        report += `\nBạn muốn update .md không?`;
      }

      return report;
    } catch {
      // If JSON parse fails, return raw response
      return `🔍 <b>CODE REVIEW — ${featureName}</b>\n\n${rawResponse.slice(0, 2000)}`;
    }
  }
}

export const reviewerAgent = new ReviewerAgent();
