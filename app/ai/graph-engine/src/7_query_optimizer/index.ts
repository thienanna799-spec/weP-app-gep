import { GraphDatabaseClient } from '../4_memgraph/index.js';
import { CacheEngine } from '../5_cache_engine/index.js';
import { VectorEngineClient } from '../6_chroma/index.js';

export class QueryOptimizer {
  constructor(
    private graphDb: GraphDatabaseClient,
    private vectorDb: VectorEngineClient,
    private cache: CacheEngine
  ) {}

  /**
   * Finds the shortest dependency path between two nodes
   */
  public async findShortestPath(sourceNodeId: string, targetNodeId: string) {
    const cacheKey = `path:${sourceNodeId}->${targetNodeId}`;
    const cached = this.cache.getHotNode(cacheKey);
    if (cached) return cached;

    console.log(`[QueryOptimizer] Calculating shortest path: ${sourceNodeId} -> ${targetNodeId}`);
    
    const session = (this.graphDb as any).driver.session(); // accessing private for demo
    try {
      const result = await session.run(
        `MATCH path = shortestPath((source {id: $sourceNodeId})-[*]-(target {id: $targetNodeId}))
         RETURN path`,
        { sourceNodeId, targetNodeId }
      );
      
      const pathData = result.records.map((r: any) => r.get('path'));
      this.cache.setHotNode(cacheKey, pathData);
      return pathData;
    } catch (e) {
      console.error(`[QueryOptimizer] Error finding path:`, e);
      return null;
    } finally {
      await session.close();
    }
  }

  /**
   * Combines Vector Search with Graph Subgraph Fetch
   */
  public async hybridSearch(query: string) {
    // 1. Vector Search to find the entry point
    const vectorResults = await this.vectorDb.searchSimilar(query, 1);
    if (!vectorResults || !vectorResults.ids[0] || vectorResults.ids[0].length === 0) {
      return null;
    }

    const entryNodeId = vectorResults.ids[0][0];
    
    // 2. Fetch the subgraph (Precedence: Data Flow)
    const session = (this.graphDb as any).driver.session();
    try {
      const result = await session.run(
        `MATCH (n {id: $entryNodeId})-[r:TRIGGERS_SERVICE|MUTATES_MODEL|WRITES_DB*1..3]->(downstream)
         RETURN n, r, downstream`,
        { entryNodeId }
      );
      
      return {
        entryNode: entryNodeId,
        subgraph: result.records
      };
    } finally {
      await session.close();
    }
  }
}
