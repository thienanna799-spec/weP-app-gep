// ============================================================
// OpenClaw – Telegram Integration
// Bot notifications for governance events
// ============================================================

import type { GovernanceReport, ReviewResult, MemorySyncReport } from '../runtime/types.js';
import { openclawConfig } from '../configs/openclaw.config.js';
import { logger } from '../runtime/logger.js';

interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
}

async function sendMessage(msg: TelegramMessage): Promise<void> {
  const { botToken } = openclawConfig.telegram;
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const body = {
    chat_id: msg.chatId,
    text: msg.text,
    parse_mode: msg.parseMode ?? 'HTML',
    disable_web_page_preview: true,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Telegram API error: ${err}`);
  }
}

export class TelegramIntegration {
  private adminChatId: string;

  constructor() {
    this.adminChatId = openclawConfig.telegram.adminChatId ?? '';
  }

  private get isEnabled(): boolean {
    return openclawConfig.telegram.enabled && !!this.adminChatId;
  }

  async notifyGovernanceReport(report: GovernanceReport): Promise<void> {
    if (!this.isEnabled) return;

    const icon = report.approved ? '✅' : '❌';
    const scoreBar = this.buildScoreBar(report.overallComplianceScore);

    const text = [
      `<b>🦞 OpenClaw Governance Report</b>`,
      `<code>[${report.requestId}]</code>`,
      '',
      `${icon} <b>Status:</b> ${report.approved ? 'APPROVED' : 'BLOCKED'}`,
      `📊 <b>Score:</b> ${report.overallComplianceScore}/100 ${scoreBar}`,
      '',
      `🎯 <b>Domain:</b> ${report.impactAnalysis.primaryDomain} [${report.impactAnalysis.governanceLevel}]`,
      `⚡ <b>Risk Score:</b> ${report.riskAnalysis.riskScore}/100`,
      `❌ <b>Violations:</b> ${report.reviewResults[0]?.violations.length ?? 0}`,
      '',
      `📋 <b>Request:</b>`,
      `<i>${this.escapeHtml(report.request.slice(0, 200))}</i>`,
    ].join('\n');

    try {
      await sendMessage({ chatId: this.adminChatId, text });
      logger.info(`Telegram: governance report sent for [${report.requestId}]`);
    } catch (err) {
      logger.warn('Telegram notification failed', { error: String(err) });
    }
  }

  async notifyViolation(requestId: string, violation: { severity: string; message: string; domain: string }): Promise<void> {
    if (!this.isEnabled) return;
    if (violation.severity !== 'CRITICAL') return; // Only critical violations

    const text = [
      `🚨 <b>OpenClaw CRITICAL Violation</b>`,
      `<code>[${requestId}]</code>`,
      '',
      `🏷️ <b>Domain:</b> ${violation.domain}`,
      `❌ <b>Violation:</b> ${this.escapeHtml(violation.message)}`,
    ].join('\n');

    try {
      await sendMessage({ chatId: this.adminChatId, text });
    } catch (err) {
      logger.warn('Telegram violation notification failed', { error: String(err) });
    }
  }

  async notifyMemoryDrift(report: MemorySyncReport): Promise<void> {
    if (!this.isEnabled) return;
    const immediate = report.driftsDetected.filter(d => d.urgency === 'immediate');
    if (immediate.length === 0) return;

    const text = [
      `⚠️ <b>OpenClaw Memory Drift Detected</b>`,
      '',
      `Found <b>${immediate.length}</b> IMMEDIATE drift(s):`,
      ...immediate.slice(0, 5).map(d => `• ${this.escapeHtml(d.description)}`),
      '',
      `<i>Run: openclaw sync to see full report</i>`,
    ].join('\n');

    try {
      await sendMessage({ chatId: this.adminChatId, text });
    } catch (err) {
      logger.warn('Telegram sync notification failed', { error: String(err) });
    }
  }

  async sendCustomMessage(message: string): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await sendMessage({ chatId: this.adminChatId, text: message });
    } catch (err) {
      logger.warn('Telegram custom message failed', { error: String(err) });
    }
  }

  private buildScoreBar(score: number): string {
    const filled = Math.round(score / 20); // 5 blocks
    const empty = 5 - filled;
    return '🟩'.repeat(filled) + '⬜'.repeat(empty);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── 2-Way Communication (Polling) ──────────────────────────
  async startListener(onMessage: (text: string, chatId: string) => Promise<void>): Promise<void> {
    if (!this.isEnabled) {
      logger.warn('Telegram is disabled. Cannot start listener.');
      return;
    }

    const { botToken } = openclawConfig.telegram;
    let offset = 0;
    
    logger.info('🦞 OpenClaw Telegram Listener started. Waiting for commands...');
    
    while (true) {
      try {
        const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=30`;
        const response = await fetch(url);
        
        if (!response.ok) {
          logger.error(`Polling error: ${response.status}`);
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }

        const data = await response.json() as any;
        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            offset = update.update_id + 1; // mark as read
            
            if (update.message?.text) {
              const text = update.message.text;
              const chatId = update.message.chat.id.toString();
              
              logger.info(`💬 Received Telegram message from [${chatId}]: ${text}`);
              
              // Acknowledge receipt
              await sendMessage({
                chatId,
                text: `⚙️ <i>OpenClaw is analyzing your request...</i>`,
                parseMode: 'HTML'
              }).catch(() => {});
              
              // Process via callback (don't await so we can keep polling)
              onMessage(text, chatId).catch(err => {
                logger.error(`Error processing telegram command:`, err);
                sendMessage({
                  chatId,
                  text: `❌ <b>Error processing request:</b>\n<code>${String(err)}</code>`,
                  parseMode: 'HTML'
                }).catch(() => {});
              });
            }
          }
        }
      } catch (err) {
        logger.error(`Polling network error:`, err);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }
}
