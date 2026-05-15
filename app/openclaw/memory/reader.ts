// ============================================================
// OpenClaw – Memory Reader
// Reads all ai/**/*.md files and parses domain memory
// ============================================================

import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, relative, basename, dirname } from 'path';
import { glob } from 'glob';
import type { MemoryFile } from '../runtime/types.js';
import { logger } from '../runtime/logger.js';

type FileType = MemoryFile['type'];

function inferFileType(filePath: string): FileType {
  const rel = filePath.replace(/\\/g, '/');
  if (rel.includes('/system/'))           return 'system';
  if (rel.includes('/shared/'))           return 'shared';
  if (rel.includes('/prompts/'))          return 'prompt';
  const name = basename(filePath);
  if (name === 'skill.md')                return 'skill';
  if (name === 'workflow.md')             return 'workflow';
  if (name === 'states.md')              return 'states';
  if (name === 'permissions.md')          return 'permissions';
  return 'shared';
}

function inferDomain(filePath: string): string {
  const rel = filePath.replace(/\\/g, '/');
  const match = rel.match(/domains\/([^/]+)/);
  if (match) return match[1];
  if (rel.includes('/system/')) return 'system';
  if (rel.includes('/shared/')) return 'shared';
  return 'global';
}

export class MemoryReader {
  private aiPath: string;
  private cache: Map<string, MemoryFile> = new Map();

  constructor(aiPath: string) {
    this.aiPath = aiPath;
    if (!existsSync(aiPath)) {
      throw new Error(`AI memory path not found: ${aiPath}`);
    }
  }

  /** Read all markdown files from the ai/ directory */
  async readAll(): Promise<MemoryFile[]> {
    const pattern = resolve(this.aiPath, '**/*.md').replace(/\\/g, '/');
    const files = await glob(pattern, { nodir: true });

    logger.debug(`Reading ${files.length} memory files from ${this.aiPath}`);

    const memoryFiles: MemoryFile[] = [];
    for (const filePath of files) {
      try {
        const file = this.readFile(filePath);
        memoryFiles.push(file);
        this.cache.set(filePath, file);
      } catch (err) {
        logger.warn(`Failed to read memory file: ${filePath}`, { error: String(err) });
      }
    }

    logger.info(`Memory loaded: ${memoryFiles.length} files`);
    return memoryFiles;
  }

  /** Read a single markdown file */
  readFile(filePath: string): MemoryFile {
    const content = readFileSync(filePath, 'utf-8');
    const stat = statSync(filePath);
    const relPath = relative(this.aiPath, filePath).replace(/\\/g, '/');

    return {
      path: relPath,
      domain: inferDomain(relPath),
      type: inferFileType(relPath),
      content,
      lastModified: stat.mtime,
    };
  }

  /** Read files for a specific domain */
  async readDomain(domain: string): Promise<MemoryFile[]> {
    const all = await this.readAll();
    return all.filter(f => f.domain === domain);
  }

  /** Read a specific file by relative path */
  readByPath(relPath: string): MemoryFile | null {
    const absPath = resolve(this.aiPath, relPath);
    if (!existsSync(absPath)) return null;
    return this.readFile(absPath);
  }

  /** Read system files (architecture, governance, risks) */
  async readSystemFiles(): Promise<MemoryFile[]> {
    const all = await this.readAll();
    return all.filter(f => f.domain === 'system');
  }

  /** Extract API endpoints from skill.md content */
  extractApis(content: string): string[] {
    const apiPattern = /(?:GET|POST|PUT|PATCH|DELETE)\s+(\/[\w/:?=&-]+)/g;
    const matches = [...content.matchAll(apiPattern)];
    return [...new Set(matches.map(m => m[0].trim()))];
  }

  /** Extract status values from states.md content */
  extractStates(content: string): string[] {
    const statePattern = /`([a-z_]+)`.*←|^\|\s*`([a-z_]+)`/gm;
    const matches = [...content.matchAll(statePattern)];
    return [...new Set(
      matches.map(m => m[1] || m[2]).filter(Boolean)
    )];
  }

  /** Extract socket events from content */
  extractEvents(content: string): string[] {
    const eventPattern = /io\.emit\(['"]([^'"]+)['"]/g;
    const listPattern = /`([a-z_]+_(?:updated|changed|received|created))`/g;
    const emitMatches = [...content.matchAll(eventPattern)].map(m => m[1]);
    const listMatches = [...content.matchAll(listPattern)].map(m => m[1]);
    return [...new Set([...emitMatches, ...listMatches])];
  }

  /** Get summary stats of loaded memory */
  async getStats(): Promise<{
    total: number;
    byDomain: Record<string, number>;
    byType: Record<string, number>;
    totalSizeKB: number;
  }> {
    const files = await this.readAll();
    const byDomain: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalSize = 0;

    for (const file of files) {
      byDomain[file.domain] = (byDomain[file.domain] ?? 0) + 1;
      byType[file.type] = (byType[file.type] ?? 0) + 1;
      totalSize += Buffer.byteLength(file.content, 'utf-8');
    }

    return {
      total: files.length,
      byDomain,
      byType,
      totalSizeKB: Math.round(totalSize / 1024),
    };
  }
}
