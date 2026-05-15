#!/usr/bin/env node
// ============================================================
// OpenClaw – Main CLI Entry Point
// Usage: openclaw run "add payment reversal to finance"
// ============================================================

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { OpenClawOrchestrator } from '../orchestrator/flow.js';
import { validateConfig, openclawConfig } from '../configs/openclaw.config.js';
import { TelegramIntegration } from '../integrations/telegram.js';
import { logger } from '../runtime/logger.js';

const program = new Command();

program
  .name('openclaw')
  .description('OpenClaw – AI Engineering Supervisor for GEP ERP')
  .version('1.0.0');

// ── Main: run command ─────────────────────────────────────────
program
  .command('run <request>')
  .description('Analyze a build request and generate execution plan + builder prompt')
  .option('-d, --domain <domain>', 'Force primary domain detection')
  .option('-t, --type <type>', 'Request type (build|review|refactor|audit|sync)', 'build')
  .option('--no-prompt', 'Skip builder prompt output')
  .option('--json', 'Output as JSON')
  .option('--code <snippets>', 'Code snippets to review (pipe-separated)')
  .action(async (request: string, options: {
    domain?: string;
    type: string;
    prompt: boolean;
    json: boolean;
    code?: string;
  }) => {
    console.log(chalk.cyan('\n🦞 OpenClaw starting...\n'));

    const { valid, errors } = validateConfig();
    if (!valid) {
      console.error(chalk.red('❌ Configuration errors:'));
      errors.forEach(e => console.error(chalk.red(`  • ${e}`)));
      console.error(chalk.yellow('\nCopy .env.example to .env and fill in your values'));
      process.exit(1);
    }

    const spinner = ora('Building context graph from ai/ memory...').start();

    try {
      const orchestrator = new OpenClawOrchestrator();
      const telegram = new TelegramIntegration();

      const codeSnippets = options.code?.split('|') ?? undefined;

      spinner.text = 'Running OpenClaw pipeline (8 steps)...';
      const report = await orchestrator.run(request, options.type as any, codeSnippets);

      spinner.succeed('OpenClaw pipeline complete');

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        const builderPrompt = options.prompt
          ? await getBuilderPrompt(orchestrator, report)
          : undefined;

        console.log(orchestrator.formatReport(report, builderPrompt));
      }

      // Telegram notifications
      await telegram.notifyGovernanceReport(report).catch(() => {});

      process.exit(report.approved ? 0 : 1);

    } catch (err) {
      spinner.fail('OpenClaw failed');
      console.error(chalk.red('\n❌ Error:'), String(err));
      logger.error('CLI run failed', { error: String(err) });
      process.exit(1);
    }
  });

// ── Review command ────────────────────────────────────────────
program
  .command('review')
  .description('Review a domain for governance compliance')
  .option('-d, --domain <domain>', 'Domain to review', 'orders')
  .option('--code <snippets>', 'Code snippets to check (pipe-separated)')
  .option('--json', 'Output as JSON')
  .action(async (options: { domain: string; code?: string; json: boolean }) => {
    console.log(chalk.cyan(`\n🦞 OpenClaw reviewing domain: ${options.domain}\n`));
    const spinner = ora('Running review...').start();

    try {
      const orchestrator = new OpenClawOrchestrator();
      const codeSnippets = options.code?.split('|') ?? undefined;
      const report = await orchestrator.run(
        `Review ${options.domain} domain for compliance`,
        'review',
        codeSnippets
      );

      spinner.succeed('Review complete');
      if (options.json) {
        console.log(JSON.stringify(report.reviewResults, null, 2));
      } else {
        console.log(orchestrator.formatReport(report));
      }

    } catch (err) {
      spinner.fail('Review failed');
      console.error(chalk.red('\n❌ Error:'), String(err));
      process.exit(1);
    }
  });

// ── Sync command ──────────────────────────────────────────────
program
  .command('sync')
  .description('Detect memory drift between codebase and ai/ files')
  .option('--json', 'Output as JSON')
  .action(async (options: { json: boolean }) => {
    console.log(chalk.cyan('\n🦞 OpenClaw memory sync check...\n'));
    const spinner = ora('Scanning for drift...').start();

    try {
      const { MemorySyncEngine } = await import('../memory/sync.js');
      const engine = new MemorySyncEngine(
        openclawConfig.memory.aiPath,
        openclawConfig.memory.gepRootPath
      );
      const report = await engine.detectDrift();
      spinner.succeed('Sync check complete');

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(engine.formatReport(report));
      }

      const telegram = new TelegramIntegration();
      await telegram.notifyMemoryDrift(report).catch(() => {});

    } catch (err) {
      spinner.fail('Sync failed');
      console.error(chalk.red('\n❌ Error:'), String(err));
      process.exit(1);
    }
  });

// ── Audit command ─────────────────────────────────────────────
program
  .command('audit')
  .description('Full architecture audit of GEP ERP system')
  .option('--domain <domain>', 'Audit specific domain only')
  .action(async (options: { domain?: string }) => {
    console.log(chalk.cyan('\n🦞 OpenClaw architecture audit...\n'));
    const domains = options.domain
      ? [options.domain]
      : ['finance', 'inventory', 'orders', 'shipping', 'drivers'];

    for (const domain of domains) {
      const orchestrator = new OpenClawOrchestrator();
      const report = await orchestrator.run(
        `Audit ${domain} domain for architecture violations`,
        'audit'
      );
      const icon = report.approved ? chalk.green('✅') : chalk.red('❌');
      console.log(`${icon} ${domain.padEnd(20)} Score: ${report.overallComplianceScore}/100  Violations: ${report.reviewResults[0]?.violations.length ?? 0}`);
    }
  });

// ── Telegram Gateway (2-way) ──────────────────────────────────
program
  .command('listen')
  .description('Start the OpenClaw Telegram Gateway v3 (secure 2-way execution bridge)')
  .action(async () => {
    console.log(chalk.cyan('\n🦞 OpenClaw Telegram Gateway v3 starting...\n'));
    console.log(chalk.yellow('  Mode: SECURE EXECUTION BRIDGE'));
    console.log(chalk.yellow('  All Telegram messages → OpenClaw Kernel → Governed response\n'));

    try {
      const { OpenClawGateway } = await import('../integrations/gateway.js');
      const gateway = new OpenClawGateway();
      await gateway.start(); // blocks forever (polling loop)
    } catch (err) {
      console.error(chalk.red('\n❌ Gateway crashed:'), err);
      process.exit(1);
    }
  });

// ── Memory stats ──────────────────────────────────────────────
program
  .command('stats')
  .description('Show AI memory statistics')
  .action(async () => {
    const { MemoryReader } = await import('../memory/reader.js');
    const reader = new MemoryReader(openclawConfig.memory.aiPath);
    const stats = await reader.getStats();
    console.log(chalk.cyan('\n📊 OpenClaw Memory Stats\n'));
    console.log(`Total files: ${chalk.bold(stats.total)}`);
    console.log(`Total size: ${chalk.bold(stats.totalSizeKB + ' KB')}`);
    console.log('\nBy domain:');
    for (const [domain, count] of Object.entries(stats.byDomain).sort()) {
      console.log(`  ${domain.padEnd(25)} ${count} files`);
    }
  });

async function getBuilderPrompt(orchestrator: OpenClawOrchestrator, report: any) {
  // In a full implementation, re-generate from orchestrator
  return undefined; // Simplified for now
}

program.parse(process.argv);
