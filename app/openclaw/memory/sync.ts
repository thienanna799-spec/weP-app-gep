// ============================================================
// OpenClaw – Memory Sync Engine
// Detects drift between codebase changes and ai/ memory
// ============================================================

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { glob } from 'glob';
import type { MemoryDrift, MemorySyncReport, MemoryFile } from '../runtime/types.js';
import { MemoryReader } from './reader.js';
import { logger, logSync } from '../runtime/logger.js';

export class MemorySyncEngine {
  private reader: MemoryReader;
  private gepRootPath: string;

  constructor(aiPath: string, gepRootPath: string) {
    this.reader = new MemoryReader(aiPath);
    this.gepRootPath = gepRootPath;
  }

  async detectDrift(): Promise<MemorySyncReport> {
    logger.info('Starting memory drift detection...');
    const startTime = Date.now();
    const drifts: MemoryDrift[] = [];
    const upToDate: string[] = [];

    // Check controller files against workflow memory
    await this.checkControllerDrift(drifts, upToDate);

    // Check router for new endpoints not in skill.md
    await this.checkRouterDrift(drifts, upToDate);

    // Check for missing socket events
    await this.checkSocketEventDrift(drifts, upToDate);

    // Check schema for models not documented
    await this.checkSchemaDrift(drifts, upToDate);

    const elapsed = Date.now() - startTime;
    const report: MemorySyncReport = {
      scannedAt: new Date(),
      driftsDetected: drifts,
      upToDate,
      totalFiles: drifts.length + upToDate.length,
      requiresAction: drifts.length > 0,
    };

    logSync({
      elapsed,
      driftsFound: drifts.length,
      upToDate: upToDate.length,
      urgentDrifts: drifts.filter(d => d.urgency === 'immediate').length,
    });

    logger.info(`Drift detection complete in ${elapsed}ms: ${drifts.length} drifts found`);
    return report;
  }

  private async checkControllerDrift(
    drifts: MemoryDrift[],
    upToDate: string[]
  ): Promise<void> {
    const controllerPattern = resolve(
      this.gepRootPath,
      'server/src/controllers/*.controller.ts'
    ).replace(/\\/g, '/');

    const controllers = await glob(controllerPattern);
    const memoryFiles = await this.reader.readAll();

    for (const ctrlPath of controllers) {
      if (!existsSync(ctrlPath)) continue;
      const content = readFileSync(ctrlPath, 'utf-8');
      const ctrlName = ctrlPath.split('/').pop()?.replace('.controller.ts', '') ?? '';

      // Check for prisma.*.update inside HTTP handler body (approximation)
      const getHandlerPattern = /router\.(get|app\.get)\([^)]+\)/gi;
      const hasPrismaInGet = content.match(/prisma\.\w+\.(?:update|create|delete)/);

      if (hasPrismaInGet) {
        // Check if it's flagged in memory already
        const flagged = memoryFiles.some(
          f => f.content.includes('write') && f.content.includes('GET') &&
               f.content.includes(ctrlName)
        );
        if (!flagged) {
          drifts.push({
            file: ctrlPath.replace(this.gepRootPath, ''),
            driftType: 'workflow_changed',
            description: `Possible DB write inside GET handler in ${ctrlName}.controller.ts`,
            suggestedUpdate: `Add note to ai/domains/${ctrlName}/workflow.md about hidden mutation`,
            urgency: 'immediate',
          });
        }
      }

      // Check if domain has a skill.md
      const domainMemory = memoryFiles.find(
        f => f.domain === ctrlName && f.type === 'skill'
      );
      if (!domainMemory && ctrlName !== 'ocr-webhook') {
        drifts.push({
          file: `domains/${ctrlName}/skill.md`,
          driftType: 'new_domain',
          description: `Controller ${ctrlName}.controller.ts has no skill.md memory file`,
          suggestedUpdate: `Create ai/domains/${ctrlName}/skill.md with API map`,
          urgency: 'soon',
        });
      } else if (domainMemory) {
        upToDate.push(`domains/${ctrlName}/skill.md`);
      }
    }
  }

  private async checkRouterDrift(
    drifts: MemoryDrift[],
    upToDate: string[]
  ): Promise<void> {
    const routerPath = resolve(this.gepRootPath, 'server/src/router.ts');
    if (!existsSync(routerPath)) return;

    const routerContent = readFileSync(routerPath, 'utf-8');
    const memoryFiles = await this.reader.readAll();

    // Extract route registrations
    const routeMatches = routerContent.match(
      /router\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/gi
    ) ?? [];

    let documentedCount = 0;
    let undocumentedCount = 0;

    for (const route of routeMatches) {
      const pathMatch = route.match(/['"]([^'"]+)['"]/);
      if (!pathMatch) continue;
      const path = pathMatch[1];

      const isDocumented = memoryFiles.some(f => f.content.includes(path));
      if (isDocumented) {
        documentedCount++;
      } else {
        undocumentedCount++;
      }
    }

    if (undocumentedCount > 0) {
      drifts.push({
        file: 'server/src/router.ts',
        driftType: 'api_changed',
        description: `${undocumentedCount} API routes in router.ts not documented in any skill.md`,
        suggestedUpdate: 'Run: openclaw sync --verbose to see specific undocumented routes',
        urgency: 'soon',
      });
    } else {
      upToDate.push('router.ts API coverage');
    }
  }

  private async checkSocketEventDrift(
    drifts: MemoryDrift[],
    upToDate: string[]
  ): Promise<void> {
    const missingEvents = [
      { event: 'material_stock_changed', domain: 'materials', urgency: 'soon' as const },
      { event: 'production_order_updated', domain: 'production-orders', urgency: 'soon' as const },
      { event: 'payment_received', domain: 'finance', urgency: 'soon' as const },
    ];

    // Check if server code has these events
    const serverPattern = resolve(this.gepRootPath, 'server/src/**/*.ts').replace(/\\/g, '/');
    const serverFiles = await glob(serverPattern);
    const allServerContent = serverFiles
      .filter(f => existsSync(f))
      .map(f => readFileSync(f, 'utf-8'))
      .join('\n');

    for (const { event, domain, urgency } of missingEvents) {
      if (!allServerContent.includes(`'${event}'`) && !allServerContent.includes(`"${event}"`)) {
        drifts.push({
          file: `server/src/controllers/${domain}.controller.ts`,
          driftType: 'event_changed',
          description: `Socket event '${event}' is documented in event-standards.md but NOT emitted in code`,
          suggestedUpdate: `Add io.emit('${event}', { ... }) to ${domain} mutation handlers`,
          urgency,
        });
      } else {
        upToDate.push(`Socket event: ${event}`);
      }
    }
  }

  private async checkSchemaDrift(
    drifts: MemoryDrift[],
    upToDate: string[]
  ): Promise<void> {
    const schemaPath = resolve(this.gepRootPath, 'server/prisma/schema.prisma');
    if (!existsSync(schemaPath)) return;

    const schemaContent = readFileSync(schemaPath, 'utf-8');
    const memoryFiles = await this.reader.readAll();

    // Extract model names from schema
    const modelMatches = schemaContent.match(/^model\s+(\w+)/gm) ?? [];
    const models = modelMatches.map(m => m.replace('model ', '').trim());

    let documented = 0;
    let undocumented = 0;

    for (const model of models) {
      const isInMemory = memoryFiles.some(f =>
        f.content.includes(model) && (f.type === 'skill' || f.type === 'workflow')
      );
      if (isInMemory) {
        documented++;
      } else {
        undocumented++;
      }
    }

    if (undocumented > 5) { // threshold
      drifts.push({
        file: 'server/prisma/schema.prisma',
        driftType: 'new_domain',
        description: `${undocumented}/${models.length} Prisma models not referenced in skill.md files`,
        suggestedUpdate: 'Review schema.prisma and ensure new models are documented in relevant domain skill.md',
        urgency: 'backlog',
      });
    } else {
      upToDate.push(`Schema coverage: ${documented}/${models.length} models documented`);
    }
  }

  /** Generate human-readable sync report */
  formatReport(report: MemorySyncReport): string {
    const lines: string[] = [
      '╔══════════════════════════════════════════╗',
      '║     OPENCLAW MEMORY SYNC REPORT          ║',
      '╚══════════════════════════════════════════╝',
      '',
      `Scanned at: ${report.scannedAt.toISOString()}`,
      `Total files checked: ${report.totalFiles}`,
      `Up to date: ${report.upToDate.length}`,
      `Drifts found: ${report.driftsDetected.length}`,
      '',
    ];

    if (report.driftsDetected.length === 0) {
      lines.push('✅ All memory files are in sync with the codebase!');
    } else {
      lines.push('⚠️  DRIFTS DETECTED:');
      lines.push('');

      const byUrgency = {
        immediate: report.driftsDetected.filter(d => d.urgency === 'immediate'),
        soon: report.driftsDetected.filter(d => d.urgency === 'soon'),
        backlog: report.driftsDetected.filter(d => d.urgency === 'backlog'),
      };

      for (const [urgency, drifts] of Object.entries(byUrgency)) {
        if (drifts.length === 0) continue;
        lines.push(`[${urgency.toUpperCase()}]`);
        for (const drift of drifts) {
          lines.push(`  📄 ${drift.file}`);
          lines.push(`     ${drift.description}`);
          lines.push(`     → ${drift.suggestedUpdate}`);
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }
}
