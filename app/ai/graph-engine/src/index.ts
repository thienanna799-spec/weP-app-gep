import { FileSystemWatcher } from './1_watcher/index.js';
import { ASTParser } from './2_parser/index.js';
import { IncrementalSyncEngine } from './3_incremental/index.js';
import { GraphDatabaseClient } from './4_memgraph/index.js';
import { CacheEngine } from './5_cache_engine/index.js';
import { VectorEngineClient } from './6_chroma/index.js';
import { QueryOptimizer } from './7_query_optimizer/index.js';
import { ImpactSimulationEngine } from './8_simulation/index.js';
import { ExecutionGuard } from './9_guard/index.js';
import { GraphConsistencyEngine } from './10_consistency/index.js';
import { OpenClawIntegration } from './11_planner/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const WATCH_PATHS = [
  path.join(PROJECT_ROOT, 'app', 'server'),
  path.join(PROJECT_ROOT, 'app', 'client')
];

class GraphEngineOS {
  // 11 Layers
  private watcher: FileSystemWatcher;
  private parser: ASTParser;
  private syncEngine: IncrementalSyncEngine;
  private graphDb: GraphDatabaseClient;
  private cacheEngine: CacheEngine;
  private vectorDb: VectorEngineClient;
  private optimizer: QueryOptimizer;
  private simulator: ImpactSimulationEngine;
  private guard: ExecutionGuard;
  private consistency: GraphConsistencyEngine;
  public plannerIntegration: OpenClawIntegration;

  constructor() {
    this.watcher = new FileSystemWatcher(WATCH_PATHS);
    this.parser = new ASTParser();
    this.graphDb = new GraphDatabaseClient();
    this.cacheEngine = new CacheEngine();
    this.syncEngine = new IncrementalSyncEngine(this.graphDb, this.cacheEngine);
    this.vectorDb = new VectorEngineClient();
    this.optimizer = new QueryOptimizer(this.graphDb, this.vectorDb, this.cacheEngine);
    this.simulator = new ImpactSimulationEngine(this.graphDb);
    this.guard = new ExecutionGuard();
    this.consistency = new GraphConsistencyEngine(this.graphDb, this.vectorDb);
    this.plannerIntegration = new OpenClawIntegration(this.optimizer, this.simulator, this.guard);
  }

  public async start() {
    console.log(`\n=================================================`);
    console.log(`🚀 BOOTING AI CODE INTELLIGENCE OS (v3.2)`);
    console.log(`=================================================\n`);

    // 1. Initialize DBs & Schema
    await this.graphDb.initializeSchema();
    await this.vectorDb.initialize();

    // 2. Run Self-Healing Consistency Check
    await this.consistency.runHealthCheck();

    // 3. Start Incremental Watcher
    this.watcher.start();

    // 4. Listen for sync events (Debounced)
    this.watcher.on('sync_required', async (fileEvents: { filePath: string, type: 'add' | 'change' | 'unlink' }[]) => {
      console.log(`[OS] Detected changes in ${fileEvents.length} files. Initiating Incremental Sync...`);
      try {
        for (const { filePath, type } of fileEvents) {
          
          if (type === 'unlink') {
            // P0: ZOMBIE VECTOR SYNC
            console.log(`[OS] 🔴 UNLINK detected for ${filePath}. Purging from Cache, Graph, and Vector DB...`);
            this.cacheEngine.invalidateFile(filePath);
            await this.graphDb.deleteFileNodesAndEdges(filePath);
            await this.vectorDb.deleteVectorsByFilePath(filePath);
            continue; // Skip parsing for deleted files
          }

          // Parse AST for 'add' or 'change'
          const nodes = this.parser.parseFile(filePath);
          
          if (nodes.length > 0) {
            // Invalidate Cache and Drop old Edges
            await this.syncEngine.processDelta(filePath, nodes);
            
            // Upsert Graph (Structure & Data Flow)
            await this.graphDb.upsertNodes(nodes);
            
            // Upsert Vector (AST Semantics)
            await this.vectorDb.embedAndUpsert(nodes);
          }
        }
        console.log(`[OS] System State Synchronized.`);
      } catch (error) {
        console.error(`[OS] Sync Error:`, error);
      }
    });

    console.log(`\n[OS] System is online and listening. OpenClaw connection ready.\n`);
  }

  public async shutdown() {
    console.log(`[OS] Shutting down OS safely...`);
    this.watcher.stop();
    await this.graphDb.close();
    process.exit(0);
  }
}

// Bootstrap
const os = new GraphEngineOS();
os.start().catch(console.error);

process.on('SIGINT', () => os.shutdown());
process.on('SIGTERM', () => os.shutdown());
