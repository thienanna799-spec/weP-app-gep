# AI Code Intelligence OS (Version 3.3 - Enterprise Hydration)

> **Core Philosophy:** "AI Software Engineering Operating System"
> **Evolution:** This document represents the absolute pinnacle of the system design, incorporating Graph Precedence, Multi-level Caching, Compile-time Guards, and Git-backed Self-Healing.

## 1. DOCKER DEPLOYMENT ARCHITECTURE (SSD PORTABLE COMPATIBLE)

```yaml
version: '3.8'
services:
  graph-db:
    image: memgraph/memgraph-mage:latest
    container_name: gep_memgraph
    ports:
      - "7687:7687"
      - "7444:7444"
    volumes:
      - ${PROJECT_DIR}portable/memgraph_lib:/var/lib/memgraph
      - ${PROJECT_DIR}portable/memgraph_log:/var/log/memgraph

  vector-db:
    image: chromadb/chroma:latest
    container_name: gep_chroma
    ports:
      - "8000:8000"
    volumes:
      - ${PROJECT_DIR}portable/chroma_data:/chroma/chroma
```

---

## 2. THE 11-LAYER OS ARCHITECTURE

The pipeline transforms raw code into a self-healing, reasoning-capable engineering brain.

```text
E:\weP-APP-main\app\ai\graph-engine\
  ├── 1_watcher/             # File Watcher & Incremental Sync
  ├── 2_parser/              # AST Parser (ts-morph / Tree-sitter)
  ├── 3_incremental/         # Incremental Graph Builder & Cache Invalidation
  ├── 4_memgraph/            # 3-Layer Graph System (with Precedence Model)
  ├── 5_cache_engine/        # Multi-level Cache (L1 Hot, L2 Fragment, L3 Vector)
  ├── 6_chroma/              # Vector Engine (AST + Context + Code)
  ├── 7_query_optimizer/     # Graph Query Optimizer + Caching Strategy
  ├── 8_simulation/          # Impact Simulation Engine (Blast radius)
  ├── 9_guard/               # Execution Guard (Compile-time check, Diff, Sandbox)
  ├── 10_consistency/        # Self-healing Graph System (Git-backed Recovery)
  ├── 11_planner/            # OpenClaw Planner Agent Integration
```

---

## 3. THE 3-LAYER GRAPH SYSTEM (WITH PRECEDENCE MODEL)

To prevent AI from returning contextually incorrect runtime logic, the system enforces a strict **Graph Precedence Model** during traversal:

### Priority 1: Data Flow Graph (Runtime Truth - Highest Priority)
*Tracks exact execution paths, including Database mappings.*
```cypher
(APINode)-[:TRIGGERS_SERVICE]->(FunctionNode)-[:MUTATES_MODEL]->(ClassNode)-[:WRITES_DB]->(DBTableNode)
(FunctionNode)-[:QUERIES_MODEL]->(DBTableNode)
```

### Priority 2: Dependency Graph (Structural Truth - Medium Priority)
*Tracks static codebase imports and couplings.*
```cypher
(FileNode)-[:IMPORTS_FROM]->(FileNode)
(FunctionNode)-[:CALLS]->(FunctionNode)
```

### Priority 3: Semantic Graph (Interpretative Truth - Base Priority)
*Tracks human-defined business logic groupings.*
```cypher
(FunctionNode)-[:PART_OF_FLOW]->(BusinessFlowCluster {name: 'InventoryFlow'})
```

---

## 3.5. ENTERPRISE HYDRATION (v3.3 UPGRADES)

To ensure maximum safety and avoid AI Hallucinations, v3.3 introduces three critical architectural guardrails:

1. **Zombie Vector Sync (P0):** Total synchronization between local disk and AI memory. If a file is deleted (`unlink`), the FileSystemWatcher triggers a cascade `DETACH DELETE` in Memgraph and a Metadata Filter deletion in ChromaDB. "Graph is Truth, Vector is Memory, Sync is Intelligence."
2. **Data Flow & DB Mapping (P1):** AST Parser dynamically extracts Prisma queries (`prisma.order.findUnique`, `prisma.invoice.create`) and explicitly creates `[:QUERIES_MODEL]` and `[:MUTATES_MODEL]` edges linking directly to physical `DBTableNode` entities extracted from `schema.prisma`.
3. **Frontend Gating (P2):** Controlled hydration of the React client. Strictly filters out noise (`components`, `utils`, `assets`) and only indexes structural hubs (`views`, `modules`, `context`, `services`).

---

## 4. MULTI-LEVEL CACHE ENGINE & GRAPH OPTIMIZER

To achieve real-time latency without overloading Memgraph/ChromaDB:

1. **L1 Cache (RAM - Hot Nodes):** High-frequency nodes like `DatabaseConnection` or `BaseController` are cached in Node.js memory.
2. **L2 Cache (Graph Fragments):** Pre-fetched subgraphs for heavily accessed business flows (e.g., the entire `OrderFlow` subgraph is cached).
3. **L3 Cache (Vector):** Cached embedding results for common queries to bypass the local embedding model.

---

## 5. SELF-HEALING GRAPH SYSTEM (REBUILD + RECOVERY)

Moving beyond simple "pruning", the system actively repairs itself:

1. **Detection:** CRON job detects orphaned nodes or state drift.
2. **Git-Backed Recovery Strategy:** 
   - Instead of deleting a missing node, the system queries the local `.git` history to re-derive the node's previous state.
   - It attempts to reconstruct the AST from the last commit and gracefully rebuild edges, ensuring the Graph remains structurally sound even during messy Git merges.

---

## 6. EXECUTION GUARD (COMPILE-TIME VERIFICATION)

The ultimate safety net. AI is an "Engineering System", not just an "Assistant" (See `ADR-010-ai-bias-vs-enforcement.md` for why .cursorrules is not enough).

1. **AST Safety Check:** Validates that the AI's proposed code modifications form a valid Abstract Syntax Tree.
2. **Physical Enforcement Engine:** Intercepts output before disk write. Blocks any changes that violate Graph rules (e.g., Service calling Controller).
3. **Compile-Time Layer:** Runs `tsc --noEmit` and ESLint checks on the modified files in memory.
4. **Diff Validation:** Ensures the patch does not unintentionally delete surrounding context.
5. **Simulation Sandbox:** (Optional) Executes critical pure functions in an isolated runtime to verify expected output before disk write.

---

## 7. STRICT OUTPUT FORMAT STANDARD

```json
{
  "A_Affected_Modules": ["shipping", "finance"],
  "B_Dependency_Path": {
    "Precedence": "Data_Flow_Priority",
    "Path": "ShippingAPI -> ShippingService -> LedgerModel"
  },
  "C_Risk_Level": "HIGH",
  "D_Execution_Plan": [
    "Modify calculateFreight() in shipping.service.ts",
    "Run Execution Guard compile-check (tsc)",
    "Update LedgerTable schema"
  ],
  "E_Files_To_Modify": ["app/server/services/shipping.ts"],
  "F_Database_Impact": ["LedgerTable schema update required"],
  "G_Frontend_Impact": ["None detected"]
}
```
