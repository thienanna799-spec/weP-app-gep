/**
 * ask.ts — Context Compiler for GEP ERP AI OS
 * ─────────────────────────────────────────────
 * Pipeline:
 *  1. Intent Classifier   → detect domain from query
 *  2. Graph Retriever     → Memgraph nodes relevant to query
 *  3. Event Retriever     → scan events/ by domain + severity
 *  4. ADR Retriever       → scan decisions/ for relevant ADRs
 *  5. Relevance Scorer    → rank all retrieved items
 *  6. Context Packer      → enforce token budget
 *  7. Prompt Injector     → write context_package.md for LLM injection
 *
 * Usage:
 *   npm run ask -- "inventory race condition"
 *   npm run ask -- "tại sao proxy dùng 127.0.0.1"
 *   npm run ask -- "fix finance transaction"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GraphDatabaseClient } from './4_memgraph/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const EVENTS_DIR = path.join(PROJECT_ROOT, 'events');
const ADR_DIR = path.join(PROJECT_ROOT, 'app', 'ai', 'system', 'decisions');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'app', 'ai', 'graph-engine', 'context_package.md');

// Token budget (approximate: 1 token ≈ 4 chars)
const MAX_CONTEXT_CHARS = 12000 * 4;

// ──────────────────────────────────────────────
// 1. INTENT CLASSIFIER
// ──────────────────────────────────────────────
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  finance:     ['finance', 'payment', 'invoice', 'revenue', 'cost', 'tài chính', 'thanh toán', 'hóa đơn', 'công nợ'],
  inventory:   ['inventory', 'stock', 'roll', 'productroll', 'importbatch', 'kho', 'tồn kho', 'cuộn', 'nhập kho', 'xuất kho', 'sub-sku', 'xưởng'],
  orders:      ['order', 'đơn hàng', 'orderlog', 'approve', 'duyệt', 'status', 'trạng thái'],
  shipping:    ['shipping', 'delivery', 'giao hàng', 'shippingorder', 'deliverylog', 'tài xế', 'driver'],
  drivers:     ['driver', 'vehicle', 'tài xế', 'xe', 'fuel', 'ocr', 'fuellog', 'shift'],
  procurement: ['procurement', 'purchase', 'supplier', 'mua hàng', 'nhà cung cấp'],
  production:  ['production', 'productionorder', 'sản xuất', 'lệnh sản xuất'],
  auth:        ['auth', 'firebase', 'login', 'role', 'permission', 'jwt', 'token'],
  infra:       ['proxy', 'vite', 'socket', 'websocket', 'docker', 'cloudflare', 'tunnel', 'cors', 'port'],
  encoding:    ['unicode', 'utf8', 'encoding', 'nfc', 'nfd', 'charset', 'mojibake', 'vietnamese', 'tiếng việt'],
};

function classifyIntent(query: string): string[] {
  const q = query.toLowerCase();
  const matchedDomains: string[] = [];
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some(kw => q.includes(kw))) {
      matchedDomains.push(domain);
    }
  }
  return matchedDomains.length > 0 ? matchedDomains : ['general'];
}

// ──────────────────────────────────────────────
// 2. EVENT RETRIEVER
// ──────────────────────────────────────────────
interface EngineeringEvent {
  event_id: string;
  type: string;
  severity: string;
  title: string;
  root_cause: string;
  fix: string;
  impact: string;
  affected_domains: string[];
  affected_nodes: string[];
  adr_reference: string | null;
  caused_by: string[];
  related_incidents: string[];
  relevance_score: number;
}

const SEVERITY_WEIGHT: Record<string, number> = {
  CRITICAL: 1.0, HIGH: 0.9, MEDIUM: 0.6, LOW: 0.3, INFO: 0.1
};

function loadAllEvents(): EngineeringEvent[] {
  const events: EngineeringEvent[] = [];
  if (!fs.existsSync(EVENTS_DIR)) return events;

  function scanDir(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.json') && entry.name !== 'event.schema.json') {
        try {
          const raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          events.push({ ...raw, relevance_score: 0 });
        } catch { /* skip malformed */ }
      }
    }
  }
  scanDir(EVENTS_DIR);
  return events;
}

function retrieveEvents(domains: string[], query: string): EngineeringEvent[] {
  const allEvents = loadAllEvents();
  const q = query.toLowerCase();

  return allEvents
    .map(evt => {
      let score = 0;
      // Domain match
      const domainMatch = evt.affected_domains?.some((d: string) => domains.includes(d));
      if (domainMatch) score += 0.5;
      // Severity weight
      score += (SEVERITY_WEIGHT[evt.severity] || 0) * 0.3;
      // Keyword match in title/root_cause
      if (evt.title?.toLowerCase().includes(q)) score += 0.4;
      if (evt.root_cause?.toLowerCase().includes(q)) score += 0.3;
      // Node match
      if (evt.affected_nodes?.some((n: string) => q.includes(n.toLowerCase()))) score += 0.3;

      return { ...evt, relevance_score: score };
    })
    .filter(evt => evt.relevance_score > 0.2)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5); // top 5
}

// ──────────────────────────────────────────────
// 3. ADR RETRIEVER
// ──────────────────────────────────────────────
interface ADRResult {
  filename: string;
  content: string;
  relevance_score: number;
}

function retrieveADRs(domains: string[], query: string): ADRResult[] {
  if (!fs.existsSync(ADR_DIR)) return [];
  const q = query.toLowerCase();

  return fs.readdirSync(ADR_DIR)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const content = fs.readFileSync(path.join(ADR_DIR, filename), 'utf-8');
      let score = 0;
      // Domain keywords in content
      if (domains.some(d => content.toLowerCase().includes(d))) score += 0.4;
      // Query match
      if (content.toLowerCase().includes(q)) score += 0.5;
      // Filename match
      if (filename.toLowerCase().includes(q.replace(/\s+/g, '-'))) score += 0.3;

      return { filename, content: content.slice(0, 1500), relevance_score: score };
    })
    .filter(adr => adr.relevance_score > 0.2)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 3); // top 3
}

// ──────────────────────────────────────────────
// 4. GRAPH RETRIEVER
// ──────────────────────────────────────────────
async function retrieveGraphNodes(query: string): Promise<string> {
  try {
    const graphDb = new GraphDatabaseClient();
    const keyword = query.split(' ').slice(0, 3).join(' ');
    const result = await graphDb.runQuery(
      `MATCH (n) WHERE toLower(n.name) CONTAINS toLower($kw) RETURN n.name as name, n.type as type, n.filePath as path LIMIT 10`,
      { kw: keyword }
    );
    await graphDb.close();
    if (!result || result.length === 0) return '';
    return result.map((r: any) => `  - [${r.type}] ${r.name} (${r.path || ''})`).join('\n');
  } catch {
    return '(Graph DB not available — run npm run start first)';
  }
}

// ──────────────────────────────────────────────
// 5. GOVERNANCE LOOKUP
// ──────────────────────────────────────────────
const GOVERNANCE_MAP: Record<string, string> = {
  finance: '🔴 LOCKED — Must use $transaction, integer VND only, no delete Payment',
  inventory: '🔴 LOCKED — Must emit inventory_updated, validate state machine, loi_hong is terminal',
  orders: '🔴 LOCKED — Must create OrderLog, emit order_updated, validate status transitions',
  shipping: '🟠 GUARDED — Must verify cross-domain impact on orders',
  drivers: '🟠 GUARDED — No DB writes in GET handlers, OCR idempotency required',
  procurement: '🟠 GUARDED — Must create MaterialTransaction atomically',
  production: '🟠 GUARDED — Must emit inventory_updated when rolls scan to stock',
  auth: '🟠 GUARDED — Firebase Admin only, never JWT-only',
  infra: '🟡 CAREFUL — Verify cross-environment compatibility',
  encoding: '🟡 CAREFUL — Always normalize to NFC from external sources',
  general: '🟢 FREE — No critical constraints detected',
};

// ──────────────────────────────────────────────
// 6. CONTEXT PACKER (token budget enforcer)
// ──────────────────────────────────────────────
function packContext(sections: { title: string; content: string; priority: number }[]): string {
  sections.sort((a, b) => b.priority - a.priority);
  let packed = '';
  let charCount = 0;

  for (const section of sections) {
    const sectionText = `\n## ${section.title}\n${section.content}\n`;
    if (charCount + sectionText.length > MAX_CONTEXT_CHARS) {
      packed += `\n## ${section.title}\n[TRUNCATED — exceeded context budget]\n`;
      break;
    }
    packed += sectionText;
    charCount += sectionText.length;
  }
  return packed;
}

// ──────────────────────────────────────────────
// 7. MAIN — BUILD CONTEXT PACKAGE
// ──────────────────────────────────────────────
async function buildContextPackage(query: string) {
  console.log(`\n🧠 CONTEXT COMPILER — GEP ERP AI OS`);
  console.log(`Query: "${query}"`);
  console.log(`─────────────────────────────────────\n`);

  // Step 1: Classify
  const domains = classifyIntent(query);
  console.log(`[1] Intent: domains = [${domains.join(', ')}]`);

  // Step 2: Graph
  console.log(`[2] Querying Graph...`);
  const graphNodes = await retrieveGraphNodes(query);

  // Step 3: Events
  console.log(`[3] Scanning Event Stream...`);
  const events = retrieveEvents(domains, query);
  console.log(`    → ${events.length} relevant events found`);

  // Step 4: ADRs
  console.log(`[4] Scanning ADR Library...`);
  const adrs = retrieveADRs(domains, query);
  console.log(`    → ${adrs.length} relevant ADRs found`);

  // Step 5: Governance
  const governance = domains.map(d => GOVERNANCE_MAP[d] || GOVERNANCE_MAP.general).join('\n');

  // Step 6: Pack context
  console.log(`[5] Packing context (budget: ${MAX_CONTEXT_CHARS / 4} tokens)...`);

  const sections = [
    {
      title: '🎯 QUERY',
      content: query,
      priority: 100,
    },
    {
      title: '⚖️ GOVERNANCE RULES (MUST FOLLOW)',
      content: governance,
      priority: 95,
    },
    {
      title: '📊 GRAPH NODES (relevant code structure)',
      content: graphNodes || '(no matches)',
      priority: 80,
    },
    {
      title: `🚨 INCIDENT HISTORY (${events.length} relevant events)`,
      content: events.length === 0
        ? '(no relevant incidents found)'
        : events.map(e =>
            `**[${e.severity}] ${e.event_id} — ${e.title}**\n` +
            `Root cause: ${e.root_cause}\n` +
            `Fix: ${e.fix}\n` +
            `Nodes: ${(e.affected_nodes || []).join(', ')}\n` +
            `Causal chain: caused_by=[${(e.caused_by || []).join(', ')}] related=[${(e.related_incidents || []).join(', ')}]`
          ).join('\n\n'),
      priority: 85,
    },
    {
      title: `📜 RELEVANT ADRs (${adrs.length} found)`,
      content: adrs.length === 0
        ? '(no relevant ADRs found)'
        : adrs.map(a => `### ${a.filename}\n${a.content}`).join('\n\n---\n\n'),
      priority: 70,
    },
  ];

  const contextBody = packContext(sections);

  // Step 7: Write output
  const header = `# 🧠 GEP ERP — Context Package\n` +
    `**Generated:** ${new Date().toISOString()}\n` +
    `**Domains:** ${domains.join(', ')}\n` +
    `**Events loaded:** ${events.length} | **ADRs loaded:** ${adrs.length}\n\n` +
    `> Inject this entire file into Antigravity before asking your question.\n\n---\n`;

  fs.writeFileSync(OUTPUT_FILE, header + contextBody, 'utf-8');

  console.log(`\n✅ Context package built: ${OUTPUT_FILE}`);
  console.log(`   Approx tokens: ${Math.round((header + contextBody).length / 4)}`);
  console.log(`\n📋 SUMMARY:`);
  console.log(`   Domains detected: [${domains.join(', ')}]`);
  console.log(`   Governance level: ${domains[0] ? (GOVERNANCE_MAP[domains[0]] || '').split('—')[0].trim() : 'FREE'}`);
  console.log(`   Graph nodes: ${graphNodes ? graphNodes.split('\n').length : 0}`);
  console.log(`   Incidents: ${events.length} (severity: ${events.map(e => e.severity).join(', ') || 'none'})`);
  console.log(`   ADRs: ${adrs.length}`);
  console.log(`\n👉 Next: paste context_package.md into your chat with Antigravity\n`);
}

// Entry point
const query = process.argv.slice(2).join(' ');
if (!query) {
  console.error('❌ Usage: npm run ask -- "your question here"');
  process.exit(1);
}

buildContextPackage(query).catch(console.error);
