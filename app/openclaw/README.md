# OpenClaw – AI Engineering Supervisor

> **OpenClaw** operates as a Senior Architect, Staff Engineer, QA Lead, and Governance System for the GEP ERP codebase.
> It reads the AI architecture memory layer (`ai/`), analyzes build requests, generates execution plans, and enforces governance policies.

---

## Architecture

```
openclaw/
├── runtime/           ← types.ts, logger.ts
├── orchestrator/      ← flow.ts (8-step pipeline)
├── planners/          ← impact, risk, execution planners
├── reviewers/         ← governance reviewer
├── memory/            ← reader, graph, sync
├── providers/         ← gemini, openai, openrouter
├── configs/           ← domains, policies, main config
├── integrations/      ← telegram
├── scripts/           ← CLI commands
└── logs/              ← execution/, governance/, review/, violation/, sync/
```

---

## Installation

```bash
cd openclaw
npm install
cp .env.example .env
# Edit .env with your API keys
```

---

## Environment Variables

```bash
# Required: at least one AI provider key
GEMINI_API_KEY=your_key_here        # Recommended (large context)
OPENAI_API_KEY=your_key_here        # Optional
OPENROUTER_API_KEY=your_key_here    # Optional (multi-model)

# Paths (auto-detected if openclaw/ is inside weP-APP-main)
AI_MEMORY_PATH=../ai
GEP_ROOT_PATH=../

# Optional Telegram
TELEGRAM_ENABLED=false
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id

# Governance
OPENCLAW_GOVERNANCE_MODE=strict     # strict | standard | permissive
OPENCLAW_DEFAULT_PROVIDER=gemini
```

---

## CLI Usage

### `openclaw run` – Analyze a build request

```bash
# Basic build request
npx tsx scripts/run.ts run "add payment reversal to finance domain"

# With domain hint
npx tsx scripts/run.ts run "add inventory stocktake" --domain inventory

# Review mode (check existing code)
npx tsx scripts/run.ts run "review inventory scan endpoint" --type review

# Output JSON
npx tsx scripts/run.ts run "add driver trust score cache" --json
```

### `openclaw review` – Domain compliance review

```bash
npx tsx scripts/run.ts review --domain finance
npx tsx scripts/run.ts review --domain inventory --json
```

### `openclaw sync` – Memory drift detection

```bash
# Detect drift between ai/ and codebase
npx tsx scripts/run.ts sync

# Output JSON for CI/CD
npx tsx scripts/run.ts sync --json
```

### `openclaw audit` – Architecture audit

```bash
# Audit all P0/P1 domains
npx tsx scripts/run.ts audit

# Audit specific domain
npx tsx scripts/run.ts audit --domain finance
```

### `openclaw stats` – Memory statistics

```bash
npx tsx scripts/run.ts stats
```

---

## Orchestration Flow (8 Steps)

```
USER REQUEST
  │
  ▼ Step 1: MEMORY READ
  → Reads all ai/**/*.md files
  → Builds context graph with domain memory
  │
  ▼ Step 2: IMPACT ANALYSIS
  → Detects primary domain (keyword matching + NLP)
  → Maps secondary domain side effects
  → Checks cross-domain links
  │
  ▼ Step 3: RISK ANALYSIS
  → Matches request against 10 system risks
  → Calculates risk score (0-100)
  → Determines escalation requirement
  │
  ▼ Step 4: EXECUTION PLAN
  → Generates phased implementation plan
  → Pre-checks for LOCKED/GUARDED domains
  → Lists files to create/modify
  │
  ▼ Step 5: BUILDER PROMPT
  → Assembles full AI prompt with:
     - System memory context
     - Domain workflow + states + APIs
     - Governance rules (MUST/MUST NOT)
     - Post-build checklist
  │
  ▼ Step 6: REVIEW
  → Checks governance policy compliance
  → Detects anti-patterns
  → Validates transaction, audit, realtime requirements
  → Calculates compliance score (0-100)
  │
  ▼ Step 7: MEMORY SYNC
  → Scans codebase for drift vs ai/ memory
  → Reports: new APIs, missing events, schema changes
  │
  ▼ Step 8: GOVERNANCE REPORT
  → Overall compliance score
  → Approved/Blocked decision
  → Telegram notification (if enabled)
  → Log entry in logs/governance/
```

---

## Execution Policies

| Governance | Domains | Behavior |
|-----------|---------|---------|
| 🔴 LOCKED | finance, inventory, orders | Blockers checked; $transaction required; audit mandatory |
| 🟠 GUARDED | shipping, drivers, production-orders, procurement | Pre-checks required; cross-domain verified |
| 🟡 CAREFUL | customers, materials, production, admin, reports | Follow patterns; emit events |
| 🟢 FREE | dashboard | Safe to optimize; minimal constraints |

---

## Provider Strategy

| Provider | Best For | Model |
|---------|---------|-------|
| Gemini 2.5 Pro | Large memory context (planning) | `gemini-2.5-pro-preview-05-06` |
| GPT-4o | Code review, analysis | `gpt-4o` |
| OpenRouter | Cost-effective, multi-model | `claude-sonnet-4-5`, `llama-3.3-70b` |

Configure with `OPENCLAW_DEFAULT_PROVIDER=gemini`

---

## Example Output

```
════════════════════════════════════════════════════════════
🦞 OPENCLAW GOVERNANCE REPORT [a3f8c2b1]
════════════════════════════════════════════════════════════

📋 Request: "add payment reversal to finance"
🕒 Timestamp: 2026-05-10T12:00:00.000Z
❌ Status: BLOCKED
📊 Overall Score: 45/100

────────────────────────────────────────────────────────────
🎯 IMPACT ANALYSIS
────────────────────────────────────────────────────────────
🔴 PRIMARY DOMAIN: FINANCE [LOCKED]
   Priority: P0

⚡ SECONDARY DOMAINS: orders, customers

🔗 CROSS-DOMAIN IMPACTS (2):
   finance → orders: Payment recorded → order paymentStatus changes
   finance → customers: Payment reduces customer debt

⚠️ Pre-execution checklist REQUIRED (LOCKED/GUARDED domain)

────────────────────────────────────────────────────────────
❌ VIOLATIONS (1):
  🔴 [CRITICAL] Request may violate: "Delete Payment records"
       → Fix: Payments are immutable. Create reversal entry instead.
```

---

## Logs

All logs written to `openclaw/logs/`:

| Directory | Content |
|-----------|---------|
| `execution/` | Full pipeline execution trace |
| `governance/` | Governance decisions (approved/blocked) |
| `review/` | Review results per domain |
| `violation/` | Architecture violations detected |
| `sync/` | Memory drift reports |

---

## Telegram Integration

When `TELEGRAM_ENABLED=true`, OpenClaw sends:
- 🔴 CRITICAL violations → immediate alert
- Governance report summary after each `run`
- Memory drift alerts (IMMEDIATE urgency only)

```bash
# Test Telegram connection
npx tsx scripts/run.ts run "test telegram" --type audit
```

---

## CI/CD Integration

```yaml
# Example GitHub Actions step
- name: OpenClaw Governance Check
  run: |
    cd openclaw
    npm ci
    npx tsx scripts/run.ts sync --json > sync-report.json
    npx tsx scripts/run.ts audit --domain finance
```
