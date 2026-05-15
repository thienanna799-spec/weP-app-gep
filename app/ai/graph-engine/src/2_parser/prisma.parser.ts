import fs from 'fs';
import { ParsedNode } from './index.js';

export class PrismaParser {
  public parseSchema(filePath: string): ParsedNode[] {
    if (!fs.existsSync(filePath)) {
      console.warn(`[PrismaParser] Schema file not found: ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const nodes: ParsedNode[] = [];
    
    // Regex to match "model ModelName {"
    const modelRegex = /^model\s+([A-Za-z0-9_]+)\s*\{/gm;
    let match;

    while ((match = modelRegex.exec(content)) !== null) {
      const modelName = match[1];
      nodes.push({
        id: `db_table_${modelName}`,
        type: 'DBTable',
        name: modelName,
        filePath: filePath,
        codeSnippet: `model ${modelName} { ... }`, // Minimal snippet for tables
        docstring: '',
        complexity: 0,
        imports: [],
        calls: []
      });
    }

    console.log(`[PrismaParser] Parsed ${nodes.length} DBTable Nodes from schema.`);
    return nodes;
  }
}
