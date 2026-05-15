/**
 * change-detector.ts — File Watcher + Change Classifier
 * ────────────────────────────────────────────────────────
 * Watches the codebase for changes and classifies them by:
 * - Domain (finance/inventory/orders/...)
 * - Change type (FEATURE/BUG_FIX/SCHEMA/REFACTOR/...)
 * - Severity (CRITICAL/HIGH/MEDIUM/LOW)
 * 
 * Does NOT write memory directly — emits classified change events
 * to impact-analyzer.ts for blast radius calculation first.
 */

import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

export interface DetectedChange {
  filePath: string;
  relativePath: string;
  changeType: 'add' | 'change' | 'unlink';
  domain: string[];
  classification: 'FEATURE' | 'BUG_FIX' | 'SCHEMA' | 'REFACTOR' | 'CONFIG' | 'FEATURE_REMOVED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  timestamp: string;
}

// Domain classification by file path patterns
const DOMAIN_PATH_MAP: Record<string, string[]> = {
  finance:     ['finance', 'payment', 'invoice', 'reconcil'],
  inventory:   ['inventory', 'stock', 'roll', 'import-batch', 'warehouse'],
  orders:      ['order', 'orders'],
  shipping:    ['shipping', 'delivery'],
  drivers:     ['driver', 'vehicle', 'fuel', 'gps', 'ocr'],
  procurement: ['procurement', 'purchase', 'material'],
  production:  ['production'],
  auth:        ['auth', 'middleware', 'firebase'],
  infra:       ['vite.config', 'docker', 'server.ts', 'startup'],
};

// Severity by path pattern
const SEVERITY_MAP: Array<{ pattern: RegExp; severity: DetectedChange['severity'] }> = [
  { pattern: /finance|payment|invoice|reconcil/i, severity: 'CRITICAL' },
  { pattern: /prisma\/schema\.prisma/i,           severity: 'HIGH' },
  { pattern: /inventory|productroll|importbatch/i, severity: 'HIGH' },
  { pattern: /orders\.controller|order.*service/i, severity: 'HIGH' },
  { pattern: /auth|middleware/i,                  severity: 'HIGH' },
  { pattern: /vite\.config|server\.ts/i,          severity: 'MEDIUM' },
  { pattern: /\.tsx?$/i,                          severity: 'LOW' },
];

function classifyDomain(filePath: string): string[] {
  const rel = filePath.toLowerCase();
  const domains: string[] = [];
  for (const [domain, patterns] of Object.entries(DOMAIN_PATH_MAP)) {
    if (patterns.some(p => rel.includes(p))) domains.push(domain);
  }
  return domains.length > 0 ? domains : ['general'];
}

function classifySeverity(filePath: string): DetectedChange['severity'] {
  for (const { pattern, severity } of SEVERITY_MAP) {
    if (pattern.test(filePath)) return severity;
  }
  return 'INFO';
}

function classifyChangeType(changeType: 'add' | 'change' | 'unlink', filePath: string): DetectedChange['classification'] {
  if (changeType === 'unlink') return 'FEATURE_REMOVED';
  if (changeType === 'add') return 'FEATURE';
  if (filePath.includes('schema.prisma')) return 'SCHEMA';
  if (filePath.includes('config') || filePath.includes('.env')) return 'CONFIG';
  return 'REFACTOR'; // default for changes — will be refined by post-task-hook
}

// Files/dirs to IGNORE (noise — not worth tracking)
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist\//,
  /events\//,        // Don't watch our own event files
  /ENGINEERING_LOG/, // Don't watch the log file
  /context_package/, // Don't watch ask.ts output
  /hydration_metadata/,
  /\.next\//,
  /coverage\//,
  /\.(jpg|png|svg|ico|webp|gif)$/i,
  /\.(lock|sum)$/,
];

export type ChangeHandler = (change: DetectedChange) => void;

export class ChangeDetector {
  private watcher: FSWatcher | null = null;
  private handlers: ChangeHandler[] = [];
  
  // Debounce to avoid duplicate events for same file
  private pendingChanges = new Map<string, NodeJS.Timeout>();

  public onChange(handler: ChangeHandler) {
    this.handlers.push(handler);
  }

  public start(watchPath: string = path.join(PROJECT_ROOT, 'app')) {
    console.log(`[ChangeDetector] 👁️  Watching: ${watchPath}`);
    
    this.watcher = chokidar.watch(watchPath, {
      ignored: (filePath: string) => IGNORE_PATTERNS.some(p => p.test(filePath)),
      persistent: true,
      ignoreInitial: true, // Don't fire on startup — only new changes
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
    });

    const handleChange = (type: 'add' | 'change' | 'unlink') => (filePath: string) => {
      // Debounce — wait 1s after last change to same file
      if (this.pendingChanges.has(filePath)) {
        clearTimeout(this.pendingChanges.get(filePath)!);
      }
      this.pendingChanges.set(filePath, setTimeout(() => {
        this.pendingChanges.delete(filePath);
        const change: DetectedChange = {
          filePath,
          relativePath: path.relative(PROJECT_ROOT, filePath),
          changeType: type,
          domain: classifyDomain(filePath),
          classification: classifyChangeType(type, filePath),
          severity: classifySeverity(filePath),
          timestamp: new Date().toISOString(),
        };
        
        // Only emit if HIGH severity or above (filter noise)
        if (['CRITICAL', 'HIGH', 'MEDIUM'].includes(change.severity)) {
          console.log(`[ChangeDetector] 📝 Detected: ${change.classification} in [${change.domain.join(',')}] — ${change.relativePath} (${change.severity})`);
          this.handlers.forEach(h => h(change));
        }
      }, 1000));
    };

    this.watcher
      .on('add', handleChange('add'))
      .on('change', handleChange('change'))
      .on('unlink', handleChange('unlink'));

    return this;
  }

  public async stop() {
    if (this.watcher) await this.watcher.close();
    console.log('[ChangeDetector] Stopped.');
  }
}
