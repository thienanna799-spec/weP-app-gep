import { ParsedNode } from '../2_parser/index.js';
import { GraphDatabaseClient } from '../4_memgraph/index.js';
import { CacheEngine } from '../5_cache_engine/index.js';

export class IncrementalSyncEngine {
  constructor(
    private graphDb: GraphDatabaseClient,
    private cacheEngine: CacheEngine
  ) {}

  public async processDelta(filePath: string, updatedNodes: ParsedNode[]) {
    console.log(`[IncrementalSync] Processing delta for ${filePath}`);
    
    // 1. Invalidate Cache
    this.cacheEngine.invalidateFile(filePath);

    // 2. Remove old edges for this file in Memgraph
    await this.graphDb.deleteFileEdges(filePath);

    // 3. Let main engine handle the upsert of new nodes
    return updatedNodes;
  }
}
