// ================================================================
// OpenClaw – Telegram Gateway v3
// Mode: Active Engineering Partner (Senior Architect + Reviewer + EM)
// ================================================================

import { openclawConfig } from '../configs/openclaw.config.js';
import { logger } from '../runtime/logger.js';
import { MemoryReader } from '../memory/reader.js';
import { orchestrator } from '../kernel/orchestrator.js';
import { schemaSensor } from '../sensors/schema-reader.js';
import { dependencySensor } from '../sensors/dependency-graph.js';
import { plannerAgent } from '../agents/planner.js';
import { codeGraphAgent } from '../agents/code-graph.js';
import { governanceAgent } from '../agents/governance.js';
import { reviewerAgent } from '../agents/reviewer.js';
import { config as loadDotenv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is loaded relative to this file's location
const __dirname = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(__dirname, '../.env') });

// ── Types ────────────────────────────────────────────────────────
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; username?: string; first_name: string };
    chat: { id: number; type: string };
    text?: string;
    date: number;
  };
}

// ── Telegram helpers ─────────────────────────────────────────────
async function sendTelegramMessage(chatId: string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<void> {
  const { botToken } = openclawConfig.telegram;
  if (!botToken) return;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode, disable_web_page_preview: true }),
  });
  if (!res.ok) {
    const err = await res.text();
    logger.warn(`[Gateway] Telegram send failed: ${err.slice(0, 100)}`);
  }
}

async function sendTypingAction(chatId: string): Promise<void> {
  const { botToken } = openclawConfig.telegram;
  if (!botToken) return;
  await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  }).catch(() => {});
}

// ── System Prompt & AI call moved to Agents ──


// ── Load context from memory (compact) ───────────────────────────
async function loadContext(): Promise<string> {
  try {
    const reader = new MemoryReader(openclawConfig.memory.aiPath);
    const files = await reader.readAll();

    const roleFiles = files.filter(f =>
      f.path.includes('agents/openclaw/role') ||
      f.path.includes('agents/openclaw/responsibilities')
    );

    const domainSkills = files.filter(f => f.type === 'skill').slice(0, 4);

    const allFiles = [...roleFiles, ...domainSkills];
    const snippets = allFiles
      .map(f => `### ${f.path}\n${f.content.slice(0, 200)}`)
      .join('\n\n');

    return snippets.slice(0, 2000) || 'No context loaded.';
  } catch {
    return 'Context unavailable — using built-in governance rules.';
  }
}

// ── Command detection ────────────────────────────────────────────
function detectCommand(text: string): { cmd: 'help' | 'status' | 'queue' | 'approve' | 'review' | null, args: string[] } {
  const parts = text.trim().split(' ');
  const lower = parts[0].toLowerCase();
  
  if (lower === '/help' || lower === '/start') return { cmd: 'help', args: [] };
  if (lower === '/status') return { cmd: 'status', args: [] };
  if (lower === '/queue') return { cmd: 'queue', args: [] };
  if (lower === '/approve' || lower === 'duyệt') return { cmd: 'approve', args: parts.slice(1) };
  // Review command: /review <feature name> OR "review <feature> đi"
  if (lower === '/review' || lower === 'review') return { cmd: 'review', args: parts.slice(1) };
  return { cmd: null, args: [] };
}

const HELP_TEXT = `🦞 <b>OpenClaw v4 — Engineering Partner</b>

Tôi là AI Engineering Partner của bạn, không phải chatbot.

<b>Tôi có thể giúp bạn:</b>
• 🏗️ Thiết kế kiến trúc tính năng mới
• 🔍 Review code tính năng đã build
• 📊 Break down task thành kế hoạch thực hiện
• ⚠️ Cảnh báo vi phạm governance (finance, orders, inventory)
• 💬 Thảo luận trade-offs và giải pháp thay thế

<b>Cách dùng:</b>
Nhắn mô tả tính năng cần làm, vấn đề cần giải quyết — tôi phân tích như một Staff Engineer thật.

<b>Lệnh:</b>
• <code>/help</code> — Menu này
• <code>/status</code> — Trạng thái hệ thống
• <code>/queue</code> — Xem hàng đợi task
• <code>/review excel nhập kho</code> — Review tính năng cụ thể
• <code>/approve &lt;taskId&gt;</code> — Duyệt task

<i>Không cần format đặc biệt. Cứ nhắn như nói chuyện với đồng nghiệp senior.</i>`;

// ================================================================
// MAIN GATEWAY CLASS
// ================================================================
export class OpenClawGateway {
  private offset: number = 0;
  private contextCache: string | null = null;
  private contextLoadedAt: number = 0;

  private async getContext(): Promise<string> {
    const now = Date.now();
    if (this.contextCache && (now - this.contextLoadedAt) < 5 * 60 * 1000) {
      return this.contextCache;
    }
    const memContext = await loadContext();
    
    // Sensor Truth Injection
    const schemaTruth = await schemaSensor.getPromptContext();
    
    await dependencySensor.init();
    const dependencyTruth = dependencySensor.getPromptContext();
    
    this.contextCache = memContext + '\n\n' + schemaTruth + '\n\n' + dependencyTruth;
    this.contextLoadedAt = now;
    return this.contextCache;
  }

  private async processMessage(update: TelegramUpdate): Promise<void> {
    const msg = update.message;
    if (!msg?.text) return;

    const chatId = String(msg.chat.id);
    const text = msg.text.trim();
    const firstName = msg.from.first_name ?? 'bạn';

    // Read API key directly from env (dotenv loaded at module top)
    const apiKey = process.env.GEMINI_API_KEY;

    logger.info(`[Gateway] "${text.slice(0, 80)}" from ${firstName} | key=${apiKey ? 'set(' + apiKey.length + 'chars)' : 'MISSING'}`);

    // ── Commands ──
    const { cmd, args } = detectCommand(text);
    if (cmd === 'help') {
      await sendTelegramMessage(chatId, HELP_TEXT);
      return;
    }
    if (cmd === 'status') {
      await sendTelegramMessage(chatId,
        `🦞 <b>OpenClaw v3 — ONLINE</b>\n\n` +
        `✅ AI Mode: <b>${apiKey ? 'Gemini Active' : '⚠️ No API Key'}</b>\n` +
        `✅ Memory: <b>115 files</b>\n` +
        `✅ Governance: <b>strict</b>\n\n` +
        `<i>Nhắn bất kỳ yêu cầu kỹ thuật nào để bắt đầu.</i>`
      );
      return;
    }
    if (cmd === 'queue') {
      const summary = await orchestrator.getQueueSummary();
      await sendTelegramMessage(chatId, summary);
      return;
    }
    if (cmd === 'approve') {
      const { adminChatId } = openclawConfig.telegram;
      if (adminChatId && chatId !== adminChatId) {
        await sendTelegramMessage(chatId, `⛔ <b>Access Denied:</b> Bạn không có quyền duyệt Execution Plan.`);
        return;
      }
      const taskId = args[0];
      if (!taskId) {
        await sendTelegramMessage(chatId, `⚠️ Vui lòng cung cấp Task ID. Ví dụ: <code>/approve 1234abcd</code>`);
        return;
      }
      try {
        const task = await orchestrator.approveTask(taskId);
        if (task) {
          await sendTelegramMessage(chatId, `✅ <b>Task Approved!</b>\nTask <code>${taskId}</code> đã được chuyển sang hàng đợi của Antigravity Worker.\n\n👉 Mở VSCode và yêu cầu Antigravity: <i>"implement pending tasks"</i>`);
        }
      } catch (err: any) {
        await sendTelegramMessage(chatId, `❌ Lỗi khi duyệt: ${err.message}`);
      }
      return;
    }

    // ── /review <feature name> ──
    if (cmd === 'review') {
      const featureName = args.join(' ').trim();
      if (!featureName) {
        await sendTelegramMessage(chatId, `⚠️ Vui lòng nhập tên tính năng.\nVí dụ: <code>/review excel nhập kho</code>`);
        return;
      }
      await sendTelegramMessage(chatId, `🔍 <b>Đang review: "${featureName}"</b>\n\n⏳ Đang tìm file liên quan và phân tích code...`);
      await sendTypingAction(chatId);
      try {
        const context = await this.getContext();
        const report = await reviewerAgent.reviewFeature(featureName, context, apiKey!);
        const MAX = 3800;
        if (report.length <= MAX) {
          await sendTelegramMessage(chatId, report);
        } else {
          await sendTelegramMessage(chatId, report.slice(0, MAX) + '\n\n<i>... (báo cáo bị cắt ngắn)</i>');
        }
      } catch (err: any) {
        await sendTelegramMessage(chatId, `❌ Review thất bại: ${err.message}`);
      }
      return;
    }

    if (!apiKey) {
      await sendTelegramMessage(chatId,
        `⚠️ <b>OpenClaw</b>\n\nChưa có GEMINI_API_KEY hợp lệ.\nHãy cấu hình file <code>.env</code> và restart gateway.`
      );
      return;
    }

    // ── AI Response (Multi-Agent Pipeline) ──
    await sendTypingAction(chatId);

    try {
      const context = await this.getContext(); // Contains Memory + Schema + Dependency Graph
      
      let task = null;
      let guardErrorMsg = null;
      let aiResponse = '';

      // 1. PLANNER AGENT
      const planOrChat = await plannerAgent.plan(text, context, apiKey);
      
      if (typeof planOrChat === 'string') {
        // Fallback: The user was just chatting or asking a question
        aiResponse = planOrChat;
      } else {
        // We have a formal Execution Plan!
        
        // 2. CODE GRAPH AGENT
        const expandedPlan = await codeGraphAgent.analyze(planOrChat, apiKey);

        // 3. GOVERNANCE AGENT (Throws BlastRadiusExceededError if failed)
        await governanceAgent.judge(expandedPlan);

        // 4. QUEUE TASK
        task = await orchestrator.queueDirectTask(expandedPlan);

        aiResponse = `📌 <b>Execution Plan Generated</b>
• Domain: ${expandedPlan.domain}
• Action: ${expandedPlan.action}
• Files to modify: ${expandedPlan.spec?.filesToModify?.length || 0}
• Risk Level: ${expandedPlan.riskLevel}

👉 Gõ <code>/approve ${task.id}</code> hoặc <code>duyệt ${task.id}</code> để đẩy task qua Coder Agent.`;
      }

      // Send the response
      const MAX = 3800;
      if (aiResponse.length <= MAX) {
        await sendTelegramMessage(chatId, aiResponse);
      } else {
        await sendTelegramMessage(chatId, aiResponse.slice(0, MAX));
      }

    } catch (err: any) {
      if (err.name === 'BlastRadiusExceededError' || (err.message && err.message.includes('BlastRadiusExceededError')) || (err.message && err.message.includes('Governance Policy'))) {
        await sendTelegramMessage(chatId, `⛔ <b>Kế hoạch bị Kernel chặn (Governance Guard)</b>\n\n${err.message}\n\n👉 <i>Hãy yêu cầu chia nhỏ task (Break down) hoặc kiểm tra lại các file cấm.</i>`);
      } else {
        const errDetail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        logger.error(`[Gateway] Pipeline error: ${errDetail}`);
        await sendTelegramMessage(chatId, `⚠️ <b>OpenClaw lỗi (Multi-Agent Pipeline)</b>\n\n<code>${errDetail.slice(0, 300)}</code>\n\n<i>Hãy thử lại.</i>`);
      }
    }
  }

  async start(): Promise<void> {
    const { botToken, adminChatId, enabled } = openclawConfig.telegram;

    if (!enabled || !botToken) {
      logger.error('[Gateway] Telegram not configured.');
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    logger.info('════════════════════════════════════════════════════');
    logger.info('🦞 OpenClaw Telegram Gateway v3 — ONLINE');
    logger.info(`   Mode: ACTIVE ENGINEERING PARTNER`);
    logger.info(`   Admin: ${adminChatId}`);
    logger.info(`   AI: ${apiKey ? `Gemini Active (key: ${apiKey.slice(0,10)}...)` : 'NO API KEY'}`);
    logger.info('════════════════════════════════════════════════════');

    await this.getContext();
    logger.info('[Gateway] Context cache loaded.');

    await sendTelegramMessage(
      adminChatId!,
      `🦞 <b>OpenClaw v3 Engineering Partner — ONLINE</b>\n\n` +
      `✅ AI: ${apiKey ? 'Gemini Active' : '⚠️ No API Key'}\n` +
      `✅ Memory: 115 files loaded\n\n` +
      `<i>Nhắn mô tả tính năng cần làm hoặc vấn đề cần giải quyết — tôi phân tích như một Staff Engineer.</i>`
    ).catch(() => {});

    while (true) {
      try {
        const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${this.offset}&timeout=30`;
        const res = await fetch(url);
        if (!res.ok) { await new Promise(r => setTimeout(r, 5000)); continue; }

        const data = await res.json() as { ok: boolean; result: TelegramUpdate[] };

        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            this.offset = update.update_id + 1;
            this.processMessage(update).catch(err => {
              logger.error('[Gateway] Unhandled error:', { error: String(err) });
            });
          }
        }
      } catch (err) {
        logger.error(`[Gateway] Network error:`, { error: String(err) });
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }
}
