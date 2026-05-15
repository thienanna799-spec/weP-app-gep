# OpenClaw – Responsibilities

> Full specification of OpenClaw's operational responsibilities across all lifecycle phases.

---

## Responsibility 1: Architecture Intelligence

OpenClaw is the **single source of architectural truth** for GEP ERP.

### What this means:

```
INPUT:  ai/system/* + ai/shared/* + ai/domains/* + openclaw/configs/*
OUTPUT: Live dependency graph + risk map + constraint registry
```

### Responsibilities:

- **Read and parse** all 99+ AI memory files on every execution
- **Build context graph** mapping domain relationships, cross-domain links, event flows
- **Detect architecture drift** – when code diverges from documented patterns
- **Track ADR compliance** – enforce Architecture Decision Records (ADR-001 through ADR-009)
- **Identify hidden coupling** – flag undocumented dependencies between domains
- **Report outdated memory** – flag ai/ files that no longer match codebase reality

### Trigger: Always. Every request. No exceptions.

---

## Responsibility 2: Governance Enforcement

OpenClaw is the **enforcement layer** between user requests and code execution.

### Governance Levels:

```
🔴 LOCKED   → finance, inventory, orders
   Action:  Block unless ALL constraints satisfied
   Requires: Transaction, audit log, event emit, human-readable plan

🟠 GUARDED  → shipping, drivers, procurement, production-orders
   Action:  Review + approve with conditions
   Requires: Impact analysis, cross-domain check, memory sync

🟡 CAREFUL  → customers, materials, production, admin, reports
   Action:  Advise + flag risks
   Requires: Pattern compliance, event emit check

🟢 FREE     → dashboard
   Action:  Log and observe
   Requires: Nothing critical
```

### Immutable Governance Rules (NEVER relaxed):

1. `$transaction` required for ALL P0 domain multi-step mutations
2. Audit log creation mandatory alongside ALL P0/P1 mutations
3. Socket event emission required after ALL P0/P1 mutations
4. `io.emit()` transport must include `polling` before `websocket`
5. VND amounts are integers only – no floating-point arithmetic
6. OCR pipeline is ALWAYS fire-and-forget – never block main thread
7. Payment records are IMMUTABLE – no update, no delete, ever
8. Audit log records are IMMUTABLE – no update, no delete, ever
9. Vietnamese enum values in DB are FROZEN – never rename @map values
10. Firebase Admin SDK is the ONLY auth verification method

---

## Responsibility 3: Risk Engine

OpenClaw classifies every request into a risk tier BEFORE execution.

### Risk Classification:

| Tier | Description | Action |
|------|-------------|--------|
| **P0 Critical** | Financial integrity, audit trail, data loss | Block if constraints not met |
| **P1 Business Critical** | Operations, shipping, drivers, procurement | Review + conditional approve |
| **P2 Normal Feature** | Standard CRUD, reporting, UI improvements | Advise + approve |
| **P3 UI / Refactor** | Cosmetic, dashboard, minor UX | Auto-approve |

### 10 System Risks (from ai/system/risk-matrix.md):

| ID | Risk | Severity |
|----|------|---------|
| RISK-001 | Data loss via hard delete | 🔴 CRITICAL |
| RISK-002 | Audit break (missing logs) | 🔴 CRITICAL |
| RISK-003 | Financial mismatch | 🔴 CRITICAL |
| RISK-004 | Stock corruption | 🔴 CRITICAL |
| RISK-005 | Hidden mutation in GET | 🟠 HIGH |
| RISK-006 | Queue loss (OCR) | 🟠 HIGH |
| RISK-007 | Realtime desync | 🟡 MEDIUM |
| RISK-008 | Duplicate processing | 🟡 MEDIUM |
| RISK-009 | Fraud bypass (imageHash) | 🟡 MEDIUM |
| RISK-010 | Stale cache | 🟡 MEDIUM |

---

## Responsibility 4: Execution Orchestration

OpenClaw **plans before building** and **validates after building**.

### Pre-Build Orchestration:
1. Read memory context for impacted domains
2. Generate multi-phase execution plan
3. Identify files to create/modify
4. Generate pre-build constraint checklist
5. Generate Antigravity builder prompt (full context prompt)
6. Block if CRITICAL violations detected

### Post-Build Orchestration:
1. Receive Antigravity output (code snippets or description)
2. Run governance review against actual output
3. Check anti-patterns (10 defined patterns)
4. Verify $transaction, audit log, event emit compliance
5. Generate compliance score (0-100)
6. Approve or request corrections

---

## Responsibility 5: Memory Synchronization

OpenClaw ensures the `ai/` memory layer never drifts from reality.

### Sync triggers:
- After every successful build
- After any domain workflow change
- After any new API endpoint is added
- After any status machine change
- Periodically (daily minimum)

### What gets synced:
- `workflow.md` – if execution steps changed
- `states.md` – if new status added or removed
- `skill.md` – if new API endpoints created
- `event-standards.md` – if new socket events added
- `technical-debt.md` – if new debt identified
- `risk-matrix.md` – if new risk identified

---

## Responsibility 6: Model Routing

OpenClaw routes AI tasks to the right model for accuracy + cost efficiency.

| Task | Model | Reason |
|------|-------|--------|
| Governance / Architecture / Risk / Review | `gemini-2.5-pro-preview` | Highest reasoning, large context |
| Planning / Execution plan / Prompt generation | `gemini-2.5-flash-preview` | Fast, accurate, cost-effective |
| Logs / Formatting / Memory sync | `gemini-2.5-flash-lite` | Lightweight, fast, cheap |
| Code review (technical) | `gpt-4o` (via OpenRouter) | Strong code analysis |
| Multi-model fallback | OpenRouter | Cost optimization, redundancy |

---

## Responsibility 7: Governance Logging

OpenClaw maintains an auditable log of all governance decisions.

### Log entries include:
- Request ID, timestamp, request text
- Domain(s) affected + governance level
- Risk score + identified risks
- Compliance score + violations
- Approved / Blocked decision
- Blocker reasons (if blocked)
- Memory sync suggestions

### Log locations:
```
openclaw/logs/governance/   ← All governance decisions
openclaw/logs/review/       ← All review results
openclaw/logs/violation/    ← Architecture violations
openclaw/logs/execution/    ← Pipeline execution trace
openclaw/logs/sync/         ← Memory drift reports
```
