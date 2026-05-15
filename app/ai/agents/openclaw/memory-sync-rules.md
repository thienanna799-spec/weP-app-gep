# OpenClaw – Memory Sync Rules

> Rules governing how OpenClaw maintains synchronization between
> the codebase (source of truth) and the ai/ memory layer (knowledge base).
> **Memory drift = AI hallucination risk = dangerous builds.**

---

## Core Principle

```
ai/ files ARE NOT documentation.
ai/ files ARE the AI's working memory.

When ai/ drifts from codebase → AI builds against wrong mental model.
When AI builds against wrong mental model → bugs, violations, regressions.
```

---

## Rule 1: Memory Always Reflects Reality

The ai/ files must reflect the CURRENT state of the codebase, not the intended or ideal state.

- If the codebase has a bug, ai/ must document the bug (not pretend it's fixed)
- If a workflow deviates from plan, ai/ reflects the actual workflow
- If a domain is missing features, ai/ marks them as gaps/missing

---

## Rule 2: Mandatory Update Triggers

OpenClaw MUST flag memory for update when ANY of the following change:

| Change | Files to Update |
|--------|----------------|
| New API endpoint added | `domains/{domain}/skill.md` |
| Status machine changed | `domains/{domain}/states.md` |
| Workflow step added/removed | `domains/{domain}/workflow.md` |
| New socket event added | `system/event-standards.md` |
| New model added to schema | `domains/{domain}/skill.md` |
| New permission rule | `domains/{domain}/permissions.md` |
| New background job | `system/queue-standards.md` |
| New cross-domain link | `shared/status-flows.md` |
| New technical debt identified | `system/technical-debt.md` |
| New risk identified | `system/risk-matrix.md` |
| ADR created or updated | `system/decisions/ADR-*.md` |
| New approval flow | `shared/approval.rules.md` |
| New fraud/OCR rule | `shared/ocr.rules.md` |
| New automation | `shared/automation.rules.md` |
| New audit log model | `system/audit-policy.md` |

---

## Rule 3: Urgency Classification

Each detected drift gets urgency classification:

### 🔴 IMMEDIATE (must fix before next build)
- Documented API no longer exists in router.ts
- Status value documented but removed from schema enum
- Workflow step documented but controller logic completely changed
- Cross-domain link broken (domain removed or renamed)

### 🟠 SOON (fix within current sprint)
- New API endpoint not yet in skill.md
- New status value not yet in states.md
- New socket event not in event-standards.md
- Bug fixed but still documented as bug in ai/ files

### 🟡 BACKLOG (track and schedule)
- New feature not yet in workflow.md
- Schema field added but not referenced in memory
- New cross-domain dependency not yet documented

---

## Rule 4: Drift Detection Strategy

OpenClaw detects drift by:

### Strategy A: Router → Skill.md Comparison
```
1. Parse server/src/router.ts → extract all route registrations
2. For each route, search ai/ for documentation
3. Flag undocumented routes as drift
```

### Strategy B: Controller → Memory Comparison
```
1. Scan controller files for prisma mutations
2. Check if mutation appears in workflow.md for that domain
3. Flag new mutation patterns as potential drift
```

### Strategy C: Schema → Skill Comparison
```
1. Parse schema.prisma → extract all model names
2. For each model, check if referenced in at least one skill.md
3. Flag unreferenced models as drift
```

### Strategy D: Event → Event-Standards Comparison
```
1. Scan all server TS files for io.emit() calls
2. Extract event names
3. Compare against event-standards.md registry
4. Flag: events in code but not in memory, events in memory but not in code
```

### Strategy E: Known Gap Tracking
```
Known gaps always checked:
- material_stock_changed: missing from code
- production_order_updated: missing from code
- payment_received: missing from code
- imageHash: never populated in FuelLog
- GET /drivers → DB write (confirmed bug)
```

---

## Rule 5: Memory Update Format

When updating ai/ files, follow this format:

```markdown
<!-- Last updated: YYYY-MM-DD by OpenClaw -->
<!-- Reason: [description of what changed] -->
```

Add to top of any file that OpenClaw updates.

---

## Rule 6: Memory File Size Limits

| File Type | Soft Limit | Hard Limit |
|-----------|-----------|-----------|
| skill.md | 200 lines | 350 lines |
| workflow.md | 150 lines | 250 lines |
| states.md | 100 lines | 200 lines |
| permissions.md | 80 lines | 150 lines |
| system files | 300 lines | 500 lines |

> If a file exceeds hard limit, split into focused sub-files.

---

## Rule 7: New Domain Onboarding Checklist

When a new domain/controller is added to GEP:

```
□ Create ai/domains/{domain}/skill.md (API map)
□ Create ai/domains/{domain}/workflow.md (lifecycle)
□ Create ai/domains/{domain}/states.md (status machine)
□ Create ai/domains/{domain}/permissions.md (role matrix)
□ Add domain to domains.config.ts in openclaw/configs/
□ Add domain to ai/system/domain-criticality.md
□ Add cross-domain links to memory/graph.ts
□ Create ai/domains/{domain}/prompts/build.prompt.md
□ Update ai/README.md domain list
□ Run: openclaw sync to verify no drift
```

---

## Rule 8: Drift Report Format

OpenClaw sync reports use this structure:

```json
{
  "scannedAt": "2026-05-10T12:00:00Z",
  "driftsDetected": [
    {
      "file": "domains/finance/skill.md",
      "driftType": "api_changed",
      "description": "New endpoint POST /finance/reversal not documented",
      "suggestedUpdate": "Add to finance/skill.md API section",
      "urgency": "soon"
    }
  ],
  "upToDate": ["domains/orders/skill.md", "..."],
  "totalFiles": 99,
  "requiresAction": true
}
```

---

## Rule 9: Memory Governance Log

Every memory sync run is logged:

```
openclaw/logs/sync/YYYY-MM-DD.json
  → scannedAt
  → drifts: count + urgency breakdown
  → filesChecked
  → elapsedMs
```

If `immediate` drifts detected:
- Telegram alert sent (if enabled)
- Next `run` command shows drift warning in output

---

## Rule 10: Memory Cannot Lie

If OpenClaw is unsure whether memory reflects reality:

1. **Do not guess** – mark as `[UNVERIFIED]` in memory
2. **Do not fabricate** – leave section blank with `[TODO: verify against codebase]`
3. **Do not hallucinate** – acknowledge uncertainty in governance report

Better to have a memory gap than incorrect memory.
