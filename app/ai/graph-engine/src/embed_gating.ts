import { GraphDatabaseClient } from './4_memgraph/index.js';
import { VectorEngineClient } from './6_chroma/index.js';

async function runGating() {
  console.log(`\n=================================================`);
  console.log(`🛡️  INITIATING VECTOR EMBEDDING GATING (PHASE 3)`);
  console.log(`=================================================\n`);

  const graphDb = new GraphDatabaseClient();
  const vectorDb = new VectorEngineClient();
  const session = (graphDb as any).driver.session();

  try {
    await vectorDb.initialize();

    console.log(`[EmbedGating] Querying Memgraph for High-Value Nodes...`);
    
    // Select nodes that are either tagged with a Flow, or have > 1 incoming calls
    const result = await session.run(
      `MATCH (n)
       WHERE n:FunctionNode OR n:ClassNode
       OPTIONAL MATCH (n)-[r:PART_OF_FLOW]->(:BusinessFlowCluster)
       OPTIONAL MATCH ()-[c:CALLS]->(n)
       WITH n, count(r) AS flowTags, count(c) AS callCount
       WHERE flowTags > 0 OR callCount > 1
       RETURN n.id AS id, n.name AS name, n.filePath AS filePath, n.complexity AS complexity`
    );

    const highValueNodes = result.records.map((r: any) => ({
      id: r.get('id'),
      name: r.get('name'),
      filePath: r.get('filePath'),
      type: r.get('complexity') !== null ? 'Function' : 'Class',
      complexity: r.get('complexity') || 0,
      content: `${r.get('name')} from ${r.get('filePath')}` // In a full implementation, we'd query the actual file content again
    }));

    console.log(`[EmbedGating] 📊 Found ${highValueNodes.length} High-Value Nodes eligible for Vector Embedding.`);

    if (highValueNodes.length > 0) {
      console.log(`[EmbedGating] Generating embeddings and persisting to ChromaDB...`);
      await vectorDb.embedAndUpsert(highValueNodes);
      console.log(`[EmbedGating] ✅ Successfully embedded ${highValueNodes.length} High-Value Nodes.`);
    } else {
      console.log(`[EmbedGating] ⚠️ No eligible nodes found.`);
    }

    console.log(`\n=================================================`);
    console.log(`✅ VECTOR EMBEDDING GATING COMPLETE`);
    console.log(`=================================================\n`);

  } catch (e) {
    console.error(`[EmbedGating] Failed:`, e);
  } finally {
    await session.close();
    await graphDb.close();
    process.exit(0);
  }
}

runGating().catch(console.error);
