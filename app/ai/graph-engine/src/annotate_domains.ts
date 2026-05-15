import { GraphDatabaseClient } from './4_memgraph/index.js';

const DOMAIN_MAPPINGS = [
  { keyword: 'order', clusterName: 'OrderFlow' },
  { keyword: 'inventory', clusterName: 'InventoryFlow' },
  { keyword: 'shipping', clusterName: 'ShippingFlow' },
  { keyword: 'finance', clusterName: 'FinanceFlow' },
  { keyword: 'user', clusterName: 'UserManagementFlow' },
  { keyword: 'driver', clusterName: 'DriverFleetFlow' }
];

async function runAnnotation() {
  console.log(`\n=================================================`);
  console.log(`🏷️  INITIATING DYNAMIC SEMANTIC ANNOTATION (PHASE 2)`);
  console.log(`=================================================\n`);

  const graphDb = new GraphDatabaseClient();
  const session = (graphDb as any).driver.session();

  try {
    // 1. Tag CORE nodes (Controllers/API Routes) first based on filename matching
    for (const mapping of DOMAIN_MAPPINGS) {
      console.log(`[Annotation] Tagging Core nodes for [${mapping.clusterName}]...`);
      await session.run(
        `MATCH (n)
         WHERE (n:FunctionNode OR n:ClassNode OR n:FileNode) 
           AND (toLower(n.filePath) CONTAINS toLower($keyword) OR toLower(n.name) CONTAINS toLower($keyword))
         MERGE (cluster:BusinessFlowCluster {name: $clusterName})
         MERGE (n)-[:PART_OF_FLOW]->(cluster)`,
        { keyword: mapping.keyword, clusterName: mapping.clusterName }
      );
    }

    // 2. Multi-label Inference Traversal: Downstream nodes inherit upstream tags
    console.log(`[Annotation] Running Multi-Label Inference Traversal (AST Call Graph)...`);
    const inferenceResult = await session.run(
      `MATCH (core)-[:PART_OF_FLOW]->(cluster:BusinessFlowCluster)
       MATCH (core)-[:CALLS|IMPORTS_FROM*1..3]->(downstream)
       WHERE NOT (downstream:BusinessFlowCluster)
       MERGE (downstream)-[:PART_OF_FLOW]->(cluster)
       RETURN count(DISTINCT downstream) as taggedCount`
    );
    
    const inheritedCount = inferenceResult.records[0]?.get('taggedCount').toNumber() || 0;
    console.log(`[Annotation] ✅ Successfully multi-labeled ${inheritedCount} downstream utility/service nodes.`);

    console.log(`\n=================================================`);
    console.log(`✅ DYNAMIC SEMANTIC ANNOTATION COMPLETE`);
    console.log(`Next Step: Check Memgraph Lab to verify Utility nodes connecting to multiple Flows.`);
    console.log(`=================================================\n`);

  } catch (e) {
    console.error(`[Annotation] Failed:`, e);
  } finally {
    await session.close();
    await graphDb.close();
    process.exit(0);
  }
}

runAnnotation().catch(console.error);
