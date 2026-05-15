// ============================================================
// OpenClaw – Context Graph Builder
// Builds a rich domain context graph from memory files
// ============================================================

import type {
  ContextGraph,
  DomainMemory,
  MemoryFile,
  CrossDomainLink,
  Risk,
} from '../runtime/types.js';
import { DOMAIN_CONFIGS } from '../configs/domains.config.js';
import { SYSTEM_RISKS } from '../configs/policies.config.js';
import { MemoryReader } from './reader.js';
import { logger } from '../runtime/logger.js';

// Cross-domain impact matrix based on ai/system/domain-criticality.md
const CROSS_DOMAIN_LINKS: CrossDomainLink[] = [
  { fromDomain: 'orders', toDomain: 'inventory', trigger: 'Order approved → pick-roll', impact: 'Roll status da_giu_cho_don', criticality: 'P0' },
  { fromDomain: 'orders', toDomain: 'shipping', trigger: 'Order status cho_xuat_kho → shipping created', impact: 'ShippingOrder created', criticality: 'P0' },
  { fromDomain: 'orders', toDomain: 'finance', trigger: 'Order hoan_thanh → AR outstanding', impact: 'Revenue recognized', criticality: 'P0' },
  { fromDomain: 'shipping', toDomain: 'orders', trigger: 'Delivery giao_thanh_cong', impact: 'Order → hoan_thanh (atomic)', criticality: 'P1' },
  { fromDomain: 'shipping', toDomain: 'inventory', trigger: 'Roll scanned into shipment', impact: 'Roll → da_xuat_kho', criticality: 'P1' },
  { fromDomain: 'shipping', toDomain: 'drivers', trigger: 'Driver assigned', impact: 'Driver status → delivering', criticality: 'P1' },
  { fromDomain: 'production', toDomain: 'inventory', trigger: 'Roll scan-to-stock', impact: 'Roll → trong_kho + inventory_updated', criticality: 'P2' },
  { fromDomain: 'production-orders', toDomain: 'production', trigger: 'Status → producing', impact: 'Roll creation begins', criticality: 'P1' },
  { fromDomain: 'production-orders', toDomain: 'materials', trigger: 'Materials consumed', impact: 'MaterialTransaction created', criticality: 'P1' },
  { fromDomain: 'procurement', toDomain: 'materials', trigger: 'PO received', impact: 'Material.currentStock += qty', criticality: 'P1' },
  { fromDomain: 'finance', toDomain: 'customers', trigger: 'Payment recorded', impact: 'Customer debt reduced', criticality: 'P0' },
  { fromDomain: 'drivers', toDomain: 'shipping', trigger: 'Driver location update', impact: 'GPS tracking for active delivery', criticality: 'P1' },
  { fromDomain: 'inventory', toDomain: 'reports', trigger: 'inventory_updated event', impact: 'Report cache invalidated', criticality: 'P2' },
  { fromDomain: 'orders', toDomain: 'reports', trigger: 'order_updated event', impact: 'Summary cache invalidated', criticality: 'P2' },
  { fromDomain: 'admin', toDomain: 'ALL', trigger: 'Permission matrix changed', impact: 'All client permission state reloaded', criticality: 'P3' },
];

export class ContextGraphBuilder {
  private reader: MemoryReader;

  constructor(aiPath: string) {
    this.reader = new MemoryReader(aiPath);
  }

  async build(): Promise<ContextGraph> {
    logger.info('Building context graph from ai/ memory...');
    const startTime = Date.now();

    const allFiles = await this.reader.readAll();
    const systemFiles = allFiles.filter(f => f.domain === 'system');

    // Extract system rules from engineering-rules.md
    const systemRules = this.extractSystemRules(systemFiles);

    // Build domain memory map
    const domains = new Map<string, DomainMemory>();

    for (const [domainName, config] of Object.entries(DOMAIN_CONFIGS)) {
      const domainFiles = allFiles.filter(f => f.domain === domainName);
      if (domainFiles.length === 0) continue;

      const skillFile = domainFiles.find(f => f.type === 'skill');
      const statesFile = domainFiles.find(f => f.type === 'states');

      const apis = skillFile
        ? this.reader.extractApis(skillFile.content).map(a => ({
            method: a.split(' ')[0] as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
            path: a.split(' ')[1] ?? '',
            description: '',
            requiresAuth: true,
            roles: [],
          }))
        : [];

      const states = statesFile
        ? this.reader.extractStates(statesFile.content).map(s => ({
            name: s,
            label: s,
            terminal: false,
            allowedTransitions: [],
          }))
        : [];

      const events = domainFiles
        .flatMap(f => this.reader.extractEvents(f.content))
        .map(e => ({
          name: e,
          trigger: 'mutation',
          payload: '{}',
          status: 'implemented' as const,
        }));

      const domainRisks = SYSTEM_RISKS.filter(r =>
        r.impactedDomains.includes(domainName)
      );

      domains.set(domainName, {
        domain: domainName,
        files: domainFiles,
        apis,
        states,
        workflows: [], // parsed from workflow.md in future
        events,
        risks: domainRisks,
      });
    }

    const graph: ContextGraph = {
      domains,
      crossDomainLinks: CROSS_DOMAIN_LINKS,
      activeRisks: SYSTEM_RISKS,
      systemRules,
      builtAt: new Date(),
    };

    const elapsed = Date.now() - startTime;
    logger.info(`Context graph built in ${elapsed}ms`, {
      domains: domains.size,
      crossLinks: CROSS_DOMAIN_LINKS.length,
      risks: SYSTEM_RISKS.length,
      systemRules: systemRules.length,
    });

    return graph;
  }

  /** Find all domains impacted by a change in primaryDomain */
  findImpactedDomains(primaryDomain: string): string[] {
    const impacted = new Set<string>();

    for (const link of CROSS_DOMAIN_LINKS) {
      if (link.fromDomain === primaryDomain) impacted.add(link.toDomain);
      if (link.toDomain === primaryDomain) impacted.add(link.fromDomain);
    }

    impacted.delete(primaryDomain);
    impacted.delete('ALL');
    return [...impacted];
  }

  /** Get memory content for a domain (for prompt building) */
  async getDomainContext(domain: string): Promise<string> {
    const files = await this.reader.readDomain(domain);
    if (files.length === 0) return `No memory found for domain: ${domain}`;

    const sections = files.map(f => {
      return `\n### ${f.path}\n\n${f.content}`;
    });

    return `# Memory Context: ${domain}\n${sections.join('\n\n---\n')}`;
  }

  /** Get compressed system rules for prompt header */
  private extractSystemRules(systemFiles: MemoryFile[]): string[] {
    const rules: string[] = [];

    for (const file of systemFiles) {
      const lines = file.content.split('\n');
      for (const line of lines) {
        if (
          line.trim().startsWith('✅') ||
          line.trim().startsWith('❌') ||
          line.trim().startsWith('**NEVER') ||
          line.trim().startsWith('**ALWAYS') ||
          line.trim().match(/^\d+\.\s+\*\*/)
        ) {
          rules.push(line.trim());
        }
      }
    }

    return [...new Set(rules)].slice(0, 50); // Top 50 unique rules
  }
}
