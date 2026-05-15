import neo4j, { Driver, Session } from 'neo4j-driver';
import { ParsedNode } from '../2_parser/index.js';

export class GraphDatabaseClient {
  private driver: Driver;

  constructor(uri: string = 'bolt://localhost:7687') {
    // Memgraph accepts Neo4j bolt connections
    this.driver = neo4j.driver(uri, neo4j.auth.basic('', ''));
    console.log(`[Memgraph] Connected via Bolt protocol.`);
  }

  public async close() {
    await this.driver.close();
    console.log(`[Memgraph] Connection closed.`);
  }

  /** Generic Cypher query — used by ask.ts Context Compiler */
  public async runQuery(cypher: string, params: Record<string, any> = {}): Promise<any[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records.map(r => r.toObject());
    } finally {
      await session.close();
    }
  }

  public async initializeSchema() {
    const session = this.driver.session();
    try {
      console.log(`[Memgraph] Initializing schema indexes...`);
      const indexes = [
        `CREATE INDEX ON :FileNode(path);`,
        `CREATE INDEX ON :FunctionNode(id);`,
        `CREATE INDEX ON :ClassNode(id);`,
        `CREATE INDEX ON :APINode(route);`,
        `CREATE INDEX ON :DBTableNode(name);`,
        `CREATE INDEX ON :BusinessFlowCluster(name);`
      ];

      for (const query of indexes) {
        try {
          await session.run(query);
        } catch (e: any) {
          // Ignore if index already exists
          if (!e.message.includes('already exists')) {
            console.error(`[Memgraph] Failed to create index:`, e.message);
          }
        }
      }
      console.log(`[Memgraph] Schema indexing complete.`);
    } finally {
      await session.close();
    }
  }

  public async upsertNodes(nodes: ParsedNode[]) {
    const session = this.driver.session();
    const tx = session.beginTransaction();
    try {
      
      // 1. Create all Nodes first
      for (const node of nodes) {
        if (node.type === 'Function') {
          await tx.run(
            `MERGE (n:FunctionNode {id: $id})
             SET n.name = $name, n.filePath = $filePath, n.complexity = $complexity`,
            { id: node.id, name: node.name, filePath: node.filePath, complexity: node.complexity }
          );
        } else if (node.type === 'File') {
          await tx.run(
            `MERGE (n:FileNode {path: $id})
             SET n.name = $name`,
            { id: node.id, name: node.name }
          );
        } else if (node.type === 'Class') {
          await tx.run(
            `MERGE (n:ClassNode {id: $id})
             SET n.name = $name, n.filePath = $filePath`,
            { id: node.id, name: node.name, filePath: node.filePath }
          );
        } else if (node.type === 'DBTable') {
          await tx.run(
            `MERGE (n:DBTableNode {name: $name})
             SET n.id = $id, n.filePath = $filePath`,
            { id: node.id, name: node.name, filePath: node.filePath }
          );
        }
      }

      // 2. Create the Edges (Dependency Graph Layer)
      for (const node of nodes) {
        // Handle CALLS and DB Operations for Functions
        if (node.type === 'Function') {
          if (node.calls && node.calls.length > 0) {
            for (const callName of node.calls) {
              
              // Check for potential violations in Node.js memory to log warnings
              const isServiceToController = node.filePath.includes('.service.ts') && callName.toLowerCase().includes('controller');
              if (isServiceToController) {
                 console.warn(`[EdgeValidator] ⚠️ VIOLATION DETECTED: Service ${node.name} calls Controller ${callName}`);
              }

              await tx.run(
                `MATCH (source:FunctionNode {id: $sourceId})
                 MATCH (target:FunctionNode) WHERE target.name = $callName
                 MERGE (source)-[r:CALLS]->(target)
                 SET r.isViolation = CASE 
                     WHEN source.filePath CONTAINS '.service.ts' AND target.filePath CONTAINS '.controller.ts' THEN true 
                     ELSE false 
                 END`,
                { sourceId: node.id, callName: callName }
              );
            }
          }

          // Handle Data Flow (QUERIES_MODEL)
          if (node.dbQueries && node.dbQueries.length > 0) {
            for (const modelName of node.dbQueries) {
              await tx.run(
                `MATCH (source:FunctionNode {id: $sourceId})
                 MERGE (target:DBTableNode {name: $modelName}) // Create node if missing
                 MERGE (source)-[:QUERIES_MODEL]->(target)`,
                { sourceId: node.id, modelName: modelName }
              );
            }
          }

          // Handle Data Flow (MUTATES_MODEL)
          if (node.dbMutates && node.dbMutates.length > 0) {
            for (const modelName of node.dbMutates) {
              await tx.run(
                `MATCH (source:FunctionNode {id: $sourceId})
                 MERGE (target:DBTableNode {name: $modelName})
                 MERGE (source)-[:MUTATES_MODEL]->(target)`,
                { sourceId: node.id, modelName: modelName }
              );
            }
          }
        }
        
        // Handle IMPORTS for Files
        if (node.type === 'File' && node.imports && node.imports.length > 0) {
          for (const importPath of node.imports) {
            const isServiceToController = node.id.includes('.service.ts') && importPath.toLowerCase().includes('controller');
            if (isServiceToController) {
               console.warn(`[EdgeValidator] ⚠️ VIOLATION DETECTED: Service ${node.name} imports Controller ${importPath}`);
            }

            await tx.run(
              `MATCH (source:FileNode {path: $sourceId})
               MERGE (target:FileNode {path: $importPath}) // Create target if not exists
               MERGE (source)-[r:IMPORTS_FROM]->(target)
               SET r.isViolation = CASE 
                   WHEN source.path CONTAINS '.service.ts' AND target.path CONTAINS '.controller.ts' THEN true 
                   ELSE false 
               END`,
              { sourceId: node.id, importPath: importPath }
            );
          }
        }
      }

      await tx.commit();
      console.log(`[Memgraph] Upserted ${nodes.length} nodes and their edges successfully.`);
    } catch (e) {
      console.error(`[Memgraph] Error upserting nodes/edges:`, e);
      await tx.rollback();
    } finally {
      await session.close();
    }
  }

  public async deleteFileEdges(filePath: string) {
    const session = this.driver.session();
    try {
      await session.run(
        `MATCH (n) WHERE n.filePath = $filePath
         MATCH (n)-[r]-()
         DELETE r`,
        { filePath }
      );
      console.log(`[Memgraph] Cleared old edges for ${filePath}`);
    } catch (e) {
      console.error(`[Memgraph] Error clearing edges:`, e);
    } finally {
      await session.close();
    }
  }

  public async deleteFileNodesAndEdges(filePath: string) {
    const session = this.driver.session();
    try {
      await session.run(
        `MATCH (n) WHERE n.filePath = $filePath OR n.path = $filePath
         DETACH DELETE n`,
        { filePath }
      );
      console.log(`[Memgraph] 🔴 ZOMBIE GRAPH SYNC: Deleted all Nodes and Edges for ${filePath}`);
    } catch (e) {
      console.error(`[Memgraph] Error deleting nodes/edges for ${filePath}:`, e);
    } finally {
      await session.close();
    }
  }

  public async clearGraph() {
    const session = this.driver.session();
    try {
      await session.run(`MATCH (n) DETACH DELETE n`);
      console.log(`[Memgraph] Graph cleared.`);
    } finally {
      await session.close();
    }
  }
}
