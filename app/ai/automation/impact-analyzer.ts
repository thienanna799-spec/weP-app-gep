/**
 * impact-analyzer.ts — Engineering Cognition Engine
 * ───────────────────────────────────────────────────
 * Analyzes a change and determines:
 *   CASE 1 — Minor: only append ENGINEERING_LOG + write event
 *   CASE 2 — Architectural: create ADR + update spider-web-engine.md + flows
 *   CASE 3 — Missing docs: detect absent architecture memory → auto-create
 *
 * This is "Engineering Cognition" — AI understands WHAT changed
 * and WHAT the system needs to remember about it.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

const AI_SYSTEM_DIR   = path.join(PROJECT_ROOT, 'app', 'ai', 'system');
const DOMAINS_DIR     = path.join(PROJECT_ROOT, 'app', 'ai', 'domains');  // ← Domain Memory root
const DECISIONS_DIR   = path.join(AI_SYSTEM_DIR, 'decisions');
const SPIDER_WEB_PATH = path.join(PROJECT_ROOT, 'app', 'ai', 'agents', 'openclaw', 'spider-web-engine.md');

// Domain memory subfolder structure
const DOMAIN_SUBDIRS = ['rules', 'workflows', 'states', 'incidents', 'adr', 'realtime'];

// ────────────────────────────────────────────────
// CASE CLASSIFICATION
// ────────────────────────────────────────────────
export type ImpactCase = 'CASE_1_MINOR' | 'CASE_2_ARCHITECTURAL' | 'CASE_3_MISSING_DOCS';

export interface ImpactAnalysis {
  impactCase: ImpactCase;
  reason: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

  // What memory actions are needed
  actions: {
    writeEvent: boolean;
    appendEngineeringLog: boolean;
    createADR: boolean;
    updateSpiderWeb: boolean;
    createFlowDoc: boolean;
    missingDocPaths: string[];   // Docs that should exist but don't
    newDocSuggestions: NewDocSuggestion[];
  };
}

export interface NewDocSuggestion {
  path: string;
  reason: string;
  template: string;
}

// ────────────────────────────────────────────────
// ARCHITECTURAL SIGNAL PATTERNS
// ────────────────────────────────────────────────
const ARCHITECTURAL_SIGNALS = [
  { pattern: /schema\.prisma/i,                  reason: 'DB schema changed — affects all Prisma queries' },
  { pattern: /routes\/index|router\.use/i,        reason: 'API routing structure changed' },
  { pattern: /\$transaction|prisma\.\$transaction/i, reason: 'Transaction boundary modified' },
  { pattern: /io\.emit|socket\.on|socket\.io/i,  reason: 'Real-time WebSocket protocol changed' },
  { pattern: /middleware\/auth|firebase.*admin/i, reason: 'Auth/security layer changed' },
  { pattern: /new.*Service|class.*Service/i,     reason: 'New service class introduced' },
  { pattern: /new.*Queue|bull|worker/i,          reason: 'Queue/async job system modified' },
  { pattern: /new.*Engine|algorithm/i,           reason: 'Core algorithm or engine introduced' },
  { pattern: /cron|schedule|setInterval/i,       reason: 'Scheduled job/background task added' },
];

const MINOR_SIGNALS = [
  /console\.(log|error|warn)/i,
  /\/\/ (fix|hotfix|temp|todo)/i,
  /\.trim\(\)|\.toLowerCase\(\)/i,
  /catch.*err/i,
];

// ────────────────────────────────────────────────
// DOMAIN MEMORY SCANNER
// Scans app/ai/domains/<domain>/ for existing memory files
// and detects what's missing
// ────────────────────────────────────────────────
export interface DomainMemoryStatus {
  domain: string;
  domainPath: string;
  exists: boolean;
  missingSubdirs: string[];
  missingCoreFiles: string[];
}

const CORE_FILES_PER_SUBDIR: Record<string, string[]> = {
  rules:     ['business-rules.md'],
  states:    [],                    // Optional — only needed for stateful domains
  incidents: ['incident-log.md'],
  workflows: [],                    // Created on-demand
  realtime:  [],                    // Created when websocket events exist
  adr:       [],                    // Created on-demand
};

export function scanDomainMemory(domains: string[]): DomainMemoryStatus[] {
  return domains.map(domain => {
    const domainPath = path.join(DOMAINS_DIR, domain);
    const exists = fs.existsSync(domainPath);

    const missingSubdirs: string[] = [];
    const missingCoreFiles: string[] = [];

    if (exists) {
      for (const subdir of DOMAIN_SUBDIRS) {
        const subdirPath = path.join(domainPath, subdir);
        if (!fs.existsSync(subdirPath)) {
          missingSubdirs.push(subdir);
        } else {
          // Check for core files
          for (const coreFile of (CORE_FILES_PER_SUBDIR[subdir] || [])) {
            const filePath = path.join(subdirPath, coreFile);
            if (!fs.existsSync(filePath)) missingCoreFiles.push(`${subdir}/${coreFile}`);
          }
        }
      }
    }

    return { domain, domainPath, exists, missingSubdirs, missingCoreFiles };
  });
}

function generateDomainSkeletonFiles(status: DomainMemoryStatus, featureTitle: string): NewDocSuggestion[] {
  const suggestions: NewDocSuggestion[] = [];
  const { domain, domainPath } = status;
  const domainLabel = domain.charAt(0).toUpperCase() + domain.slice(1);

  // Create missing subdirs + core files
  for (const subdir of status.missingSubdirs) {
    const coreFiles = CORE_FILES_PER_SUBDIR[subdir] || [];
    for (const coreFile of coreFiles) {
      suggestions.push({
        path: path.join(domainPath, subdir, coreFile),
        reason: `${domain}/${subdir}/${coreFile} missing — domain has no ${subdir} memory`,
        template: generateCoreFileTemplate(domain, domainLabel, subdir, coreFile, featureTitle),
      });
    }
  }

  // Create missing core files in existing subdirs
  for (const missingFile of status.missingCoreFiles) {
    const [subdir, filename] = missingFile.split('/');
    suggestions.push({
      path: path.join(domainPath, subdir, filename),
      reason: `${domain}/${missingFile} missing`,
      template: generateCoreFileTemplate(domain, domainLabel, subdir, filename, featureTitle),
    });
  }

  return suggestions;
}

function generateCoreFileTemplate(domain: string, domainLabel: string, subdir: string, filename: string, trigger: string): string {
  if (filename === 'business-rules.md') {
    return `# ${domainLabel} Domain — Business Rules\n\n**Created:** ${new Date().toISOString().split('T')[0]}\n**Trigger:** Auto-created when "${trigger}" was implemented\n**Status:** DRAFT\n\n---\n\n## Core Rules\n\n[Add domain-specific business rules here]\n\n## State Machine\n\nSee: states/\n\n## Related ADRs\n\nSee: adr/\n`;
  }
  if (filename === 'incident-log.md') {
    return `# ${domainLabel} Domain — Incident Log\n\n**Purpose:** Track all incidents for AI historical reasoning.\n**Auto-populated by:** post-task-hook.ts\n\n---\n\n## No incidents recorded yet\n`;
  }
  return `# ${domainLabel} Domain — ${subdir.charAt(0).toUpperCase() + subdir.slice(1)}\n\n**Created:** ${new Date().toISOString().split('T')[0]}\n**Trigger:** Auto-created when "${trigger}" was implemented\n\n[Fill in content]\n`;
}

function checkMissingDomainMemory(domains: string[], featureTitle: string): NewDocSuggestion[] {
  const statuses = scanDomainMemory(domains);
  const suggestions: NewDocSuggestion[] = [];

  for (const status of statuses) {
    if (!status.exists || status.missingSubdirs.length > 0 || status.missingCoreFiles.length > 0) {
      // Create domain root if needed
      fs.mkdirSync(status.domainPath, { recursive: true });
      suggestions.push(...generateDomainSkeletonFiles(status, featureTitle));
    }
  }
  return suggestions;
}


// ────────────────────────────────────────────────
// MISSING FLOW DOCS LOGIC
// ────────────────────────────────────────────────
const FLOW_DOC_MAP: Record<string, string> = {
  orders: 'orders-flow.md',
  drivers: 'drivers-flow.md',
  shipping: 'shipping-flow.md',
  finance: 'finance-flow.md',
  auth: 'auth-flow.md',
  inventory: 'inventory-flow.md'
};

function checkMissingFlowDocs(domains: string[]): string[] {
  const missing: string[] = [];
  for (const domain of domains) {
    const docName = FLOW_DOC_MAP[domain];
    if (docName) {
      const docPath = path.join(DOMAINS_DIR, domain, 'workflows', docName);
      if (!fs.existsSync(docPath)) {
        missing.push(docPath);
      }
    }
  }
  return missing;
}

function generateFlowDocTemplate(domain: string, title: string): string {
  return `# ${domain.toUpperCase()} Flow Documentation\n\n**Created for:** ${title}\n\n## 1. Trigger\n\n## 2. Steps\n\n## 3. Result\n`;
}

// ────────────────────────────────────────────────
// MAIN ANALYZER
// ────────────────────────────────────────────────
export interface AnalyzeInput {
  title: string;
  type: string;
  affectedFiles: string[];
  affectedDomains: string[];
  why: string;
  solution: string;
  severity?: string;
  changedCode?: string; // Optional: actual code snippet for deeper analysis
}

export function analyzeImpact(input: AnalyzeInput): ImpactAnalysis {
  const { title, affectedFiles, affectedDomains, why, solution, changedCode = '' } = input;

  const allText = [...affectedFiles, why, solution, changedCode].join(' ');

  // ── Detect architectural signals ──
  const architecturalReasons: string[] = [];
  for (const { pattern, reason } of ARCHITECTURAL_SIGNALS) {
    if (pattern.test(allText)) architecturalReasons.push(reason);
  }

  // ── Check for missing flow docs ──
  const missingFlowDocs = checkMissingFlowDocs(affectedDomains);

  // ── Check for missing ADR ──
  // ADR needed if: architectural signal OR finance/auth domain touched
  const needsADR = architecturalReasons.length > 0 ||
    affectedDomains.includes('finance') ||
    affectedDomains.includes('auth') ||
    affectedFiles.some(f => f.includes('schema.prisma'));

  // ── Determine CASE ──
  let impactCase: ImpactCase;
  let reason: string;

  if (missingFlowDocs.length > 0) {
    // CASE 3 takes priority — missing architecture memory is critical gap
    impactCase = 'CASE_3_MISSING_DOCS';
    reason = `Missing flow documentation for domains: ${affectedDomains.filter(d => FLOW_DOC_MAP[d]).join(', ')}`;
  } else if (architecturalReasons.length > 0 || needsADR) {
    impactCase = 'CASE_2_ARCHITECTURAL';
    reason = architecturalReasons[0] || `Core ${affectedDomains[0]} domain behavior changed`;
  } else {
    impactCase = 'CASE_1_MINOR';
    reason = 'No architectural signals detected — minor/local change';
  }

  // ── Build new doc suggestions ──
  const newDocSuggestions: NewDocSuggestion[] = missingFlowDocs.map(docPath => ({
    path: docPath,
    reason: `${path.basename(docPath, '.md')} domain has no flow documentation`,
    template: generateFlowDocTemplate(
      path.basename(docPath, '.md').replace('-flow', '').replace('-', ' '),
      title
    ),
  }));

  // ── Determine severity ──
  const severity = ((): ImpactAnalysis['severity'] => {
    if (input.severity) return input.severity as any;
    if (affectedDomains.includes('finance')) return 'CRITICAL';
    if (affectedFiles.some(f => f.includes('schema.prisma'))) return 'HIGH';
    if (impactCase === 'CASE_2_ARCHITECTURAL') return 'HIGH';
    if (impactCase === 'CASE_3_MISSING_DOCS') return 'MEDIUM';
    return 'LOW';
  })();

  return {
    impactCase,
    reason,
    severity,
    actions: {
      writeEvent: true,                                              // Always write event
      appendEngineeringLog: true,                                    // Always update log
      createADR: needsADR && impactCase !== 'CASE_1_MINOR',          // CASE 2+
      updateSpiderWeb: impactCase === 'CASE_2_ARCHITECTURAL',         // CASE 2 only
      createFlowDoc: missingFlowDocs.length > 0,                     // CASE 3
      missingDocPaths: missingFlowDocs,
      newDocSuggestions,
    },
  };
}

// ────────────────────────────────────────────────
// AUTO-CREATE MISSING DOCS
// ────────────────────────────────────────────────
export function executeDocCreation(suggestions: NewDocSuggestion[]): string[] {
  const created: string[] = [];
  for (const suggestion of suggestions) {
    if (!fs.existsSync(suggestion.path)) {
      fs.mkdirSync(path.dirname(suggestion.path), { recursive: true });
      fs.writeFileSync(suggestion.path, suggestion.template, 'utf-8');
      console.log(`[ImpactAnalyzer] 📄 Created missing doc: ${suggestion.path}`);
      created.push(suggestion.path);
    }
  }
  return created;
}

// ────────────────────────────────────────────────
// UPDATE spider-web-engine.md
// ────────────────────────────────────────────────
export function appendToSpiderWeb(title: string, domains: string[], reason: string): void {
  if (!fs.existsSync(SPIDER_WEB_PATH)) {
    console.warn(`[ImpactAnalyzer] spider-web-engine.md not found — skipping`);
    return;
  }

  const entry = `\n## [${new Date().toISOString().split('T')[0]}] ${title}\n` +
    `- **Domains:** ${domains.join(', ')}\n` +
    `- **Architectural reason:** ${reason}\n` +
    `- **Status:** Requires manual graph update + review\n`;

  const existing = fs.readFileSync(SPIDER_WEB_PATH, 'utf-8');
  const updateMarker = '## Recent Architectural Changes';

  if (existing.includes(updateMarker)) {
    fs.writeFileSync(SPIDER_WEB_PATH, existing.replace(updateMarker, updateMarker + entry), 'utf-8');
  } else {
    fs.appendFileSync(SPIDER_WEB_PATH, `\n---\n${updateMarker}\n${entry}`);
  }
  console.log(`[ImpactAnalyzer] 🕸️  spider-web-engine.md updated`);
}

// ────────────────────────────────────────────────
// PRINT ANALYSIS REPORT
// ────────────────────────────────────────────────
export function printAnalysisReport(analysis: ImpactAnalysis, title: string): void {
  const caseIcon = {
    CASE_1_MINOR:          '🟢',
    CASE_2_ARCHITECTURAL:  '🟠',
    CASE_3_MISSING_DOCS:   '🔴',
  }[analysis.impactCase];

  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  IMPACT ANALYSIS — "${title.slice(0, 30)}"`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  ${caseIcon} ${analysis.impactCase}`);
  console.log(`║  Severity: ${analysis.severity}`);
  console.log(`║  Reason: ${analysis.reason.slice(0, 45)}`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  Actions:`);
  console.log(`║   ${analysis.actions.writeEvent          ? '✅' : '⬜'} Write event JSON`);
  console.log(`║   ${analysis.actions.appendEngineeringLog ? '✅' : '⬜'} Append ENGINEERING_LOG`);
  console.log(`║   ${analysis.actions.createADR           ? '✅' : '⬜'} Create ADR`);
  console.log(`║   ${analysis.actions.updateSpiderWeb     ? '✅' : '⬜'} Update spider-web-engine.md`);
  console.log(`║   ${analysis.actions.createFlowDoc       ? '✅' : '⬜'} Create missing flow docs`);
  if (analysis.actions.missingDocPaths.length > 0) {
    console.log(`║   Missing: ${analysis.actions.missingDocPaths.map(p => path.basename(p)).join(', ')}`);
  }
  console.log(`╚══════════════════════════════════════════╝\n`);
}
