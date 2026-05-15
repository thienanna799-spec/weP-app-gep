import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../runtime/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRISMA_SCHEMA_PATH = resolve(__dirname, '../../server/prisma/schema.prisma');

export interface SchemaTruth {
  models: string[];
  enums: string[];
  lastScanned: number;
}

export class SchemaSensor {
  private cache: SchemaTruth | null = null;

  async getTruth(forceRefresh = false): Promise<SchemaTruth> {
    if (this.cache && !forceRefresh) {
      return this.cache;
    }

    try {
      const content = await fs.readFile(PRISMA_SCHEMA_PATH, 'utf-8');
      const models: string[] = [];
      const enums: string[] = [];

      // Simple regex to find model and enum declarations
      const modelRegex = /^model\s+([A-Za-z0-9_]+)\s*{/gm;
      const enumRegex = /^enum\s+([A-Za-z0-9_]+)\s*{/gm;

      let match;
      while ((match = modelRegex.exec(content)) !== null) {
        models.push(match[1]);
      }
      while ((match = enumRegex.exec(content)) !== null) {
        enums.push(match[1]);
      }

      this.cache = {
        models,
        enums,
        lastScanned: Date.now()
      };

      logger.info(`[Sensor] Schema Truth loaded: ${models.length} models, ${enums.length} enums.`);
      return this.cache;
    } catch (err) {
      logger.error(`[Sensor] Failed to read schema.prisma`, err);
      return { models: [], enums: [], lastScanned: Date.now() };
    }
  }

  /**
   * Format the truth for AI injection
   */
  async getPromptContext(): Promise<string> {
    const truth = await this.getTruth();
    return `
=== TRUTH LAYER: DATABASE SCHEMA ===
The following models ACTUALLY EXIST in the database. 
DO NOT hallucinate models that are not in this list.
If you need a new model, you MUST specify a database migration in your plan.

[Models]: ${truth.models.join(', ')}
[Enums]: ${truth.enums.join(', ')}
====================================
`;
  }
}

export const schemaSensor = new SchemaSensor();
