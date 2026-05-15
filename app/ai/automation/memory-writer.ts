/**
 * memory-writer.ts — Automated Event + Log Writer
 * ─────────────────────────────────────────────────
 * Writes structured events to events/YYYY/MM/DD/*.json
 * and appends human-readable entries to ENGINEERING_LOG.md
 * 
 * This is SYSTEM memory — not AI memory.
 * Persistent, queryable, reproducible.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

export interface MemoryEvent {
  type: 'BUG_FIX' | 'FEATURE' | 'FEATURE_REMOVED' | 'SCHEMA' | 'REFACTOR' | 'CONFIG' | 'ARCH_DECISION' | 'INCIDENT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  why: string;
  root_cause: string;
  solution: string;
  blast_radius: string[];
  affected_files: string[];
  affected_nodes?: string[];
  affected_domains: string[];
  related_adr?: string[];
  caused_by?: string[];
  related_incidents?: string[];
  prevention?: string;
  rollback_strategy?: string;
  governance_approval?: boolean;
  data_loss?: boolean;
  data_loss_note?: string;
}

function getTodayPath(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return path.join(PROJECT_ROOT, 'events', String(y), m, d);
}

function getNextEventId(dir: string): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  if (!fs.existsSync(dir)) return `${dateStr}-001`;
  
  const existing = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => parseInt(f.split('-').slice(-1)[0]) || 0);
  
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${dateStr}-${String(next).padStart(3, '0')}`;
}

function slugify(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

export function writeEvent(event: MemoryEvent): string {
  const todayDir = getTodayPath();
  fs.mkdirSync(todayDir, { recursive: true });
  
  const eventId = getNextEventId(todayDir);
  const slug = slugify(event.title);
  const filename = `${eventId.split('-').slice(-1)[0].padStart(3, '0')}-${slug}.json`;
  const filepath = path.join(todayDir, filename);

  // Load workspace config for workspace_id
  const workspaceConfigPath = path.join(PROJECT_ROOT, 'workspace.config.json');
  const workspaceId = fs.existsSync(workspaceConfigPath)
    ? JSON.parse(fs.readFileSync(workspaceConfigPath, 'utf-8')).workspace_id
    : 'unknown';

  // Get git commit
  let gitCommit = 'no-git';
  try {
    gitCommit = execSync('git rev-parse --short HEAD', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
  } catch { /* no git */ }

  const fullEvent = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    workspace_id: workspaceId,
    git_commit: gitCommit,
    ...event,
    caused_by: event.caused_by || [],
    related_incidents: event.related_incidents || [],
    related_adr: event.related_adr || [],
    affected_nodes: event.affected_nodes || [],
    rollback_strategy: event.rollback_strategy,
    governance_approval: event.governance_approval,
    data_loss: event.data_loss || false,
  };

  fs.writeFileSync(filepath, JSON.stringify(fullEvent, null, 2), 'utf-8');
  console.log(`[MemoryWriter] ✅ Event written: ${filepath}`);

  // Also append to ENGINEERING_LOG.md
  appendToEngineeringLog(fullEvent);

  return filepath;
}

function appendToEngineeringLog(event: any): void {
  const logPath = path.join(PROJECT_ROOT, 'ENGINEERING_LOG.md');
  const today = new Date().toISOString().split('T')[0];
  
  const entry = `\n### [${event.type}] ${event.title}\n` +
    `- **Severity:** ${event.severity}\n` +
    `- **Root cause:** ${event.root_cause}\n` +
    `- **Fix:** ${event.solution}\n` +
    `- **Files:** ${event.affected_files.join(', ')}\n` +
    (event.prevention ? `- **Prevention:** ${event.prevention}\n` : '') +
    (event.data_loss ? `- ⚠️ **DATA LOSS:** ${event.data_loss_note || 'yes'}\n` : '');

  let content = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8') : '# ENGINEERING LOG — GEP ERP\n';
  
  // Insert under today's date header, create if missing
  const dateHeader = `## ${today}`;
  if (content.includes(dateHeader)) {
    content = content.replace(dateHeader, dateHeader + entry);
  } else {