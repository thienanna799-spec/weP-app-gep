import { promises as fs } from 'fs';
import { resolve, join, dirname, relative, extname } from 'path';
import { logger } from '../runtime/logger.js';

export class DependencySensor {
  // target module (no ext) -> set of modules that import it (no ext)
  private inverseGraph: Map<string, Set<string>> = new Map();
  private rootDir: string;

  constructor() {
    // OpenClaw processes run from openclaw/ directory, so root is one level up
    this.rootDir = resolve(process.cwd(), '..');
  }

  /**
   * Initializes the graph by scanning the workspace
   */
  async init(): Promise<void> {
    try {
      this.inverseGraph.clear();
      
      const serverSrc = join(this.rootDir, 'server', 'src');
      const frontendSrc = join(this.rootDir, 'src');

      const allFiles: string[] = [];
      await this.walk(serverSrc, allFiles);
      await this.walk(frontendSrc, allFiles);

      for (const filePath of allFiles) {
        await this.processFile(filePath);
      }

      logger.info(`[DependencySensor] Graph built: ${this.inverseGraph.size} semantic nodes connected.`);
    } catch (err) {
      logger.error(`[DependencySensor] Failed to build dependency graph:`, { error: String(err) });
    }
  }

  private async walk(dir: string, fileList: string[]): Promise<void> {
    let list;
    try {
      list = await fs.readdir(dir, { withFileTypes: true });
    } catch (e) {
      return; // directory might not exist
    }

    for (const dirent of list) {
      const fullPath = join(dir, dirent.name);
      if (dirent.isDirectory()) {
        await this.walk(fullPath, fileList);
      } else {
        if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
          fileList.push(fullPath);
        }
      }
    }
  }

  private normalizeNodeName(absolutePath: string): string {
    // Relative to project root
    let rel = relative(this.rootDir, absolutePath);
    // Strip extension
    const ext = extname(rel);
    if (ext) {
      rel = rel.slice(0, -ext.length);
    }
    // Normalize to forward slashes
    return rel.replace(/\\/g, '/');
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const sourceNode = this.normalizeNodeName(filePath);
      const fileDir = dirname(filePath);

      // Regex to match ES6 imports (multiline supported)
      // matches: import ... from 'path', import 'path', export ... from 'path'
      const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"](.*?)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];

        // We only care about internal relative imports
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          // Resolve relative to the importing file
          let absoluteTarget = resolve(fileDir, importPath);
          const targetNode = this.normalizeNodeName(absoluteTarget);

          // Skip self or node_modules somehow creeping in
          if (targetNode !== sourceNode && !targetNode.includes('node_modules')) {
            if (!this.inverseGraph.has(targetNode)) {
              this.inverseGraph.set(targetNode, new Set());
            }
            this.inverseGraph.get(targetNode)!.add(sourceNode);
          }
        }
      }
    } catch (e) {
      // ignore read errors
    }
  }

  /**
   * Generates a concise markdown representation of the dependency graph
   */
  getPromptContext(): string {
    if (this.inverseGraph.size === 0) return '';

    let output = `## SEMANTIC DEPENDENCY GRAPH (Inverse)\n`;
    output += `Use this to understand the Blast Radius. If you modify a TARGET, the IMPORTED BY files will be affected.\n\n`;

    // Only include critical nodes to save tokens. 
    // Heuristic: If it's a service, controller, route, or hook.
    const criticalPatterns = ['.service', '.controller', '.route', 'use', 'Context'];

    const entries = Array.from(this.inverseGraph.entries())
      .filter(([target]) => criticalPatterns.some(p => target.includes(p)))
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (entries.length === 0) return '';

    for (const [target, sources] of entries) {
      output += `- **${target}** is imported by:\n`;
      const sortedSources = Array.from(sources).sort();
      for (const src of sortedSources) {
        output += `  - ${src}\n`;
      }
    }

    return output;
  }
}

export const dependencySensor = new DependencySensor();
