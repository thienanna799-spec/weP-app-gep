// ============================================================
// OpenClaw – Impact Planner
// Detects which domains are impacted by a user request
// ============================================================

import type { ImpactAnalysis, ContextGraph, CrossDomainLink } from '../runtime/types.js';
import { DOMAIN_CONFIGS, getDomainConfig } from '../configs/domains.config.js';
import { logger } from '../runtime/logger.js';

// Domain detection keywords for NLP matching
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  finance: ['payment', 'thanh toán', 'revenue', 'doanh thu', 'debt', 'công nợ', 'credit', 'invoice', 'hóa đơn', 'ar', 'ap', 'refund', 'hoàn tiền'],
  inventory: ['roll', 'cuộn', 'qr', 'scan', 'kho', 'warehouse', 'stock', 'trong_kho', 'da_xuat_kho', 'stocktake', 'kiểm kê'],
  orders: ['order', 'đơn hàng', 'đơn', 'approve', 'duyệt', 'da_duyet', 'hoan_thanh', 'pick', 'xuất'],
  shipping: ['shipping', 'delivery', 'giao hàng', 'driver assignment', 'giao_thanh_cong', 'giao_that_bai', 'return', 'hoàn trả'],
  drivers: ['driver', 'tài xế', 'vehicle', 'xe', 'fuel', 'nhiên liệu', 'ocr', 'receipt', 'hóa đơn nhiên liệu', 'trust score'],
  customers: ['customer', 'khách hàng', 'crm', 'contact', 'pricing', 'giá', 'credit limit', 'hạn mức'],
  materials: ['material', 'nguyên liệu', 'bom', 'stock level', 'tồn kho nguyên liệu', 'pe', 'foam'],
  'production-orders': ['production order', 'lệnh sản xuất', 'lsx', 'producing', 'sản xuất'],
  production: ['roll creation', 'tạo cuộn', 'qr label', 'nhãn qr', 'defect', 'lỗi cuộn'],
  procurement: ['purchase order', 'po', 'supplier', 'nhà cung cấp', 'receive goods', 'nhận hàng'],
  reports: ['report', 'báo cáo', 'summary', 'export', 'excel', 'cache'],
  dashboard: ['dashboard', 'kpi', 'chart', 'widget', 'overview'],
  admin: ['user', 'người dùng', 'role', 'quyền', 'permission', 'ban', 'khóa tài khoản', 'system config'],
};

export class ImpactPlanner {
  detectPrimaryDomain(request: string): string {
    const lowerRequest = request.toLowerCase();
    let bestMatch = { domain: 'orders', score: 0 };

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowerRequest.includes(keyword.toLowerCase())) {
          score += keyword.length > 5 ? 3 : 1; // longer keywords score more
        }
      }
      if (score > bestMatch.score) {
        bestMatch = { domain, score };
      }
    }

    logger.debug(`Detected primary domain: ${bestMatch.domain} (score: ${bestMatch.score})`);
    return bestMatch.domain;
  }

  detectSecondaryDomains(request: string, primaryDomain: string, graph: ContextGraph): string[] {
    const lowerRequest = request.toLowerCase();
    const secondary = new Set<string>();

    // Direct keyword matches (excluding primary)
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      if (domain === primaryDomain) continue;
      for (const keyword of keywords) {
        if (lowerRequest.includes(keyword.toLowerCase())) {
          secondary.add(domain);
          break;
        }
      }
    }

    // Cross-domain link matches
    for (const link of graph.crossDomainLinks) {
      if (link.fromDomain === primaryDomain) {
        secondary.add(link.toDomain);
      }
    }

    secondary.delete('ALL');
    secondary.delete(primaryDomain);
    return [...secondary];
  }

  analyze(request: string, graph: ContextGraph): ImpactAnalysis {
    const primaryDomain = this.detectPrimaryDomain(request);
    const secondaryDomains = this.detectSecondaryDomains(request, primaryDomain, graph);
    const primaryConfig = getDomainConfig(primaryDomain);

    // Find cross-domain risks for impacted domains
    const allImpacted = [primaryDomain, ...secondaryDomains];
    const crossDomainRisks: CrossDomainLink[] = graph.crossDomainLinks.filter(
      link =>
        allImpacted.includes(link.fromDomain) ||
        allImpacted.includes(link.toDomain)
    );

    const governanceLevel = primaryConfig?.governance ?? 'CAREFUL';
    const requiresPreCheck =
      governanceLevel === 'LOCKED' || governanceLevel === 'GUARDED';

    // Check blockers
    const blockers: string[] = [];
    if (primaryConfig?.mustNot) {
      const lowerRequest = request.toLowerCase();
      for (const constraint of primaryConfig.mustNot) {
        // Heuristic: if request mentions something that matches a mustNot
        if (
          constraint.toLowerCase().includes('delete') && lowerRequest.includes('delete') ||
          constraint.toLowerCase().includes('float') && lowerRequest.includes('float') ||
          constraint.toLowerCase().includes('remove') && lowerRequest.includes('remove audit')
        ) {
          blockers.push(`⛔ Constraint violation: "${constraint}"`);
        }
      }
    }

    const analysis: ImpactAnalysis = {
      primaryDomain,
      secondaryDomains,
      crossDomainRisks,
      governanceLevel,
      requiresPreCheck,
      blockers,
    };

    logger.info(`Impact analysis: primary=${primaryDomain}, secondary=${secondaryDomains.join(',')}`, {
      governance: governanceLevel,
      blockers: blockers.length,
    });

    return analysis;
  }

  /** Format impact analysis for display */
  format(analysis: ImpactAnalysis): string {
    const config = getDomainConfig(analysis.primaryDomain);
    const governanceIcon = {
      LOCKED: '🔴',
      GUARDED: '🟠',
      CAREFUL: '🟡',
      FREE: '🟢',
    }[analysis.governanceLevel];

    const lines = [
      `${governanceIcon} PRIMARY DOMAIN: ${analysis.primaryDomain.toUpperCase()} [${analysis.governanceLevel}]`,
      `   Priority: ${config?.priority ?? 'P2'}`,
      '',
      analysis.secondaryDomains.length > 0
        ? `⚡ SECONDARY DOMAINS: ${analysis.secondaryDomains.join(', ')}`
        : '  No secondary domains affected',
      '',
    ];

    if (analysis.crossDomainRisks.length > 0) {
      lines.push(`🔗 CROSS-DOMAIN IMPACTS (${analysis.crossDomainRisks.length}):`);
      for (const link of analysis.crossDomainRisks.slice(0, 5)) {
        lines.push(`   ${link.fromDomain} → ${link.toDomain}: ${link.trigger}`);
      }
      lines.push('');
    }

    if (analysis.blockers.length > 0) {
      lines.push('❌ BLOCKERS:');
      for (const blocker of analysis.blockers) {
        lines.push(`   ${blocker}`);
      }
    }

    if (analysis.requiresPreCheck) {
      lines.push('');
      lines.push('⚠️  Pre-execution checklist REQUIRED (LOCKED/GUARDED domain)');
    }

    return lines.join('\n');
  }
}
