import { ASTParser } from './2_parser/index.js';
import { PrismaParser } from './2_parser/prisma.parser.js';
import { GraphDatabaseClient } from './4_memgraph/index.js';
import { VectorEngineClient } from './6_chroma/index.js';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../../../../');

// Load workspace identity from workspace.config.json (portable — no hardcoded paths)
function loadWorkspaceConfig(): Record<string, any> {
  const configPath = path.join(PROJECT_ROOT, 'workspace.config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  return { workspace_id: 'unknown', project_name: 'unknown' };
}

// Get current git commit hash (for graph versioning)
function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return 'no-git';
  }
}

// Parse CLI Arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry');
const targetArg = args.find(a => a.startsWith('--target='));
const targetKeyword = targetArg ? targetArg.split('=')[1] : null;

if (!targetKeyword) {
  console.error("❌ ERROR: Must provide a --target. Example: npm run hydrate -- --dry --target=order");
  process.exit(1);
}

function findTargetFiles(dir: string, keyword: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        
        // P2: FRONTEND GATING - Skip noisy UI components
        if (fullPath.includes(path.join('app', 'src'))) {
          const ignoredDirs = ['components', 'utils', 'hooks', 'assets', 'types', 'i18n'];
          if (ignoredDirs.includes(file)) {
            continue; // Skip entire noise directory
          }
        }

        findTargetFiles(fullPath, keyword, fileList);
      }
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        if (keyword === 'all' || fullPath.toLowerCase().includes(keyword.toLowerCase())) {
          fileList.push(fullPath);
        }
      }
    }
  }
  return fileList;
}

async function runHydration() {
  console.log(`\n=================================================`);
  console.log(`🌊 INITIATING HYDRATION ROLLOUT`);
  console.log(`Target Keyword: "${targetKeyword}"`);
  console.log(`Dry Run Mode (No Vector Embedding): ${isDryRun ? 'ENABLED 🛡️' : 'DISABLED ⚠️'}`);
  console.log(`=================================================\n`);

  const keywordToUse = targetKeyword || '';
  const serverFiles = findTargetFiles(path.join(PROJECT_ROOT, 'app', 'server', 'src'), keywordToUse);
  
  // P2: Client Hydration enabled! Noise UI folders are gated out.
  const clientFiles = findTargetFiles(path.join(PROJECT_ROOT, 'app', 'src'), keywordToUse);
  
  const allFiles = [...serverFiles, ...clientFiles];

  if (allFiles.length === 0) {
    console.log(`❌ No files found matching target "${targetKeyword}". Aborting.`);
    process.exit(0);
  }

  console.log(`[Hydration] Found ${allFiles.length} files matching "${targetKeyword}".\n`);

  const parser = new ASTParser();
  const prismaParser = new PrismaParser();
  const graphDb = new GraphDatabaseClient();

  // Initialize DB Schema
  await graphDb.initializeSchema();
  // We always clear the graph before full hydration to rebuild cleanly
  await graphDb.clearGraph();
  console.log(`[Hydration] Cleared existing graph for clean structural build.`);

  // Parse Prisma Schema first to build DBTable nodes
  const prismaFilePath = path.join(PROJECT_ROOT, 'app', 'server', 'prisma', 'schema.prisma');
  try {
    const dbNodes = prismaParser.parseSchema(prismaFilePath);
    if (dbNodes.length > 0) {
      await graphDb.upsertNodes(dbNodes);
    }
  } catch (e) {
    console.error(`[Hydration] Failed to parse Prisma schema`, e);
  }

  for (const filePath of allFiles) {
    console.log(`[Hydration] Processing: ${path.relative(PROJECT_ROOT, filePath)}`);
    
    try {
      const nodes = parser.parseFile(filePath);
      if (nodes.length > 0) {
        // Always upsert to Memgraph to build Structure and Edges
        await graphDb.upsertNodes(nodes);
      }
    } catch (e) {
      console.error(`[Hydration] Failed to parse ${filePath}`, e);
    }
  }

  console.log(`\n=================================================`);
  console.log(`✅ HYDRATION COMPLETE`);
  console.log(`Files Processed: ${allFiles.length}`);
  if (isDryRun) {
    console.log(`Status: SAFE MODE. Nodes and Edges generated. Vector embedding skipped.`);
    console.log(`Next Step: Open Memgraph Lab (http://localhost:7444) to visually verify the graph.`);
  } else {
    console.log(`Status: FULL HYDRATION. Graph structure and Vector embeddings successfully recorded.`);
  }
  console.log(`=================================================\n`);

  // Write graph versioning metadata (solves Graph Versioning blind spot)
  const workspaceConfig = loadWorkspaceConfig();
  const gitCommit = getGitCommit();
  const metadata = {
    workspace_id: workspaceConfig.workspace_id || 'unknown',
    project_name: workspaceConfig.project_name || 'unknown',
    hydration_timestamp: new Date().toISOString(),
    git_commit: gitCommit,
    target_keyword: targetKeyword,
    files_processed: allFiles.length,
    mode: isDryRun ? 'DRY_RUN' : 'FULL_HYDRATION',
    graph_version: `${gitCommit}-${Date.now()}`,
  };
  const metaPath = path.join(PROJECT_ROOT, 'app', 'ai', 'graph-engine', 'hydration_metadata.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  console.log(`[Hydration] Graph version written: ${metadata.graph_version}`);

  await graphDb.close();
  process.exit(0);
}

runHydration().catch(console.error);
