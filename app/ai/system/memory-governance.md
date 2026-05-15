# Memory Governance – AI Architecture Maintenance Protocol

> **Purpose**: This document defines the rules for keeping the `ai/` memory layer perpetually synchronized with the GEP codebase. AI assistants MUST follow this protocol on every coding session.

---

## Core Principle

> The `ai/` directory is a **living architecture document**, not a static snapshot.
> Code and memory must always be in sync.
> Stale memory = AI hallucination = broken features.

---

## RULE 1: Read Before You Code

Before implementing any feature, AI MUST:

```
1. Identify which domains are affected
2. Read ai/domains/{domain}/skill.md
3. Read ai/domains/{domain}/workflow.md
4. Read ai/domains/{domain}/states.md
5. Read ai/system/engineering-rules.md
6. Read ai/system/event-standards.md
7. Read any domain-specific rules files (*.rules.md)
```

If the feature touches multiple domains, read ALL affected domains.

---

## RULE 2: Memory Update Triggers

### MANDATORY – AI MUST update `ai/` when changing:

| Change Type | Files to Update |
|------------|-----------------|
| New workflow step | `domains/{domain}/workflow.md` |
| New status / status transition | `domains/{domain}/states.md`, `shared/status-flows.md` |
| New API endpoint | `domains/{domain}/skill.md` (APIs table) |
| New DB model / field | `domains/{domain}/skill.md`, `system/database-philosophy.md` |
| New Socket.IO event | `system/event-standards.md`, `system/realtime.md`, `domains/{domain}/realtime.md` |
| Changed permission rules | `system/permissions.md`, `domains/{domain}/permissions.md` |
| New approval flow | `shared/approval.rules.md`, `domains/{domain}/workflow.md` |
| Changed notification logic | `shared/notification.rules.md` |
| New background job / queue | `system/queue-standards.md`, `shared/automation.rules.md` |
| Changed audit logging | `system/audit-policy.md`, `domains/{domain}/` audit files |
| Changed OCR / fraud logic | `shared/ocr.rules.md`, `domains/drivers/fraud.rules.md` |
| Changed finance reconciliation | `shared/finance.rules.md`, `domains/finance/` |
| Changed inventory behavior | `shared/qr-flow.md`, `domains/inventory/` |
| Changed shipping / delivery | `domains/shipping/workflow.md`, `domains/shipping/states.md` |
| Cross-domain logic change | ALL affected domain files |
| New automation / trigger | `shared/automation.rules.md` |

### NOT MANDATORY – AI does NOT need memory updates for:

| Change Type | Reason |
|------------|--------|
| CSS / TailwindCSS changes | No business logic impact |
| Spacing, colors, typography | Visual only |
| Icon changes | Visual only |
| Responsive layout | Visual only |
| Component rename (no logic change) | No behavior change |
| Comment-only edits | No behavior change |
| Test file changes | No production logic impact |

---

## RULE 3: Pre-Implementation Checklist

Before writing a single line of code, AI must answer:

```markdown
## Pre-Implementation Check

- [ ] Which domains does this feature touch?
  Domains: _______________

- [ ] Have I read all relevant ai/ memory files?
  Files read: _______________

- [ ] Does this change any status/state machine?
  If yes → will update: shared/status-flows.md + domains/{x}/states.md

- [ ] Does this add/change a Socket.IO event?
  If yes → will update: system/event-standards.md

- [ ] Does this add/change an API route?
  If yes → will update: domains/{x}/skill.md (APIs table)

- [ ] Does this change approval flow?
  If yes → will update: shared/approval.rules.md + domains/{x}/workflow.md

- [ ] Does this add/change audit logging?
  If yes → will update: system/audit-policy.md

- [ ] Does this change permissions?
  If yes → will update: system/permissions.md + domains/{x}/permissions.md

- [ ] Does this affect cross-domain logic?
  If yes → identify ALL impacted domains: _______________
```

---

## RULE 4: Post-Implementation Verification

After completing implementation, AI MUST verify:

### Code ↔ Memory Consistency Check

| Verification | How |
|-------------|-----|
| All new endpoints in skill.md? | Compare router.ts with domain skill.md API tables |
| All new statuses in states.md? | Compare Prisma enums with states.md |
| All new events in event-standards.md? | Search codebase for `io.emit(` |
| Workflow steps match code? | Trace controller logic vs workflow.md |
| Audit logs created where expected? | Check audit-policy.md gaps still accurate |

### Final Sync Statement

AI should output at end of each session:

```markdown
## Memory Sync Report

### Updated Files:
- ai/domains/orders/workflow.md – added failed delivery re-ship flow
- ai/system/event-standards.md – added payment_received event
- ai/shared/status-flows.md – added return_request resolution states

### Skipped (not mandatory):
- UI styling changes (3 files)

### Known Gaps (backlog):
- payment_received event not yet implemented in socket layer
```

---

## RULE 5: Domain Impact Matrix

When changing logic in one domain, check ALL potentially affected domains:

```
orders changed →
  check: production-orders (auto-trigger?)
  check: inventory (roll assignment?)
  check: shipping (shipment creation?)
  check: finance (revenue impact?)
  check: customers (totalOrders counter?)

inventory changed →
  check: production (rolls available?)
  check: shipping (rolls to ship?)
  check: materials (stock consumed?)

shipping changed →
  check: orders (status updated?)
  check: drivers (assignment changed?)
  check: finance (revenue finalized?)

drivers changed →
  check: shipping (driver available?)
  check: vehicles (vehicle in use?)

finance changed →
  check: orders (paymentStatus updated?)
  check: customers (credit available?)
  check: reports (KPIs changed?)

materials changed →
  check: production-orders (material availability?)
  check: procurement (auto-suggest PO?)
  check: reports (material cost changed?)
```

---

## RULE 6: Memory File Ownership

Each domain team (or AI session) owns specific files:

| Owner Domain | Owns Files |
|-------------|-----------|
| System | `ai/system/*.md` |
| Orders | `ai/domains/orders/*.md` |
| Inventory | `ai/domains/inventory/*.md`, `ai/shared/qr-flow.md` |
| Finance | `ai/domains/finance/*.md`, `ai/shared/finance.rules.md` |
| Drivers | `ai/domains/drivers/*.md`, `ai/shared/ocr.rules.md` |
| Cross-cutting | `ai/shared/status-flows.md`, `ai/shared/approval.rules.md` |

---

## RULE 7: Memory Drift Detection

Run this check at the start of any major refactor session:

```bash
# Search for socket events in code
grep -r "io.emit(" server/src/ --include="*.ts" | grep -oP "'[^']+'" | sort -u

# Compare with event-standards.md event table
# Any event in code NOT in memory → update event-standards.md

# Search for new status enums
grep -r "enum.*Status" server/prisma/schema.prisma

# Compare with shared/status-flows.md
# Any status NOT in memory → update status-flows.md

# Search for new routes
grep -r "router\." server/src/router.ts | grep -oP "'\\/[^']+'"

# Compare with domain skill.md API tables
```

---

## RULE 8: Memory File Length Limits

To prevent context bloat:

| File Type | Max Lines | Strategy |
|-----------|----------|---------|
| skill.md | 150 lines | Split into sub-files if needed |
| workflow.md | 200 lines | One workflow per section |
| states.md | 100 lines | State machine diagram + table |
| permissions.md | 80 lines | Matrix table format |
| *.rules.md | 120 lines | Numbered rules, no prose |
| system/*.md | 200 lines | Reference format, not tutorials |

---

## RULE 9: Memory Versioning

When making a **breaking change** to business logic:

1. Add `> ⚠️ CHANGED [date]: [what changed]` alert at top of affected section
2. Document old behavior in a `## Migration Notes` section
3. Remove the note after 30 days (once all code is updated)

Example:
```markdown
> ⚠️ CHANGED 2026-05-10: Revenue now recognized only on 'hoan_thanh', 
> previously included 'dang_giao'. Finance summary calculation updated.
```

---

## RULE 10: New Domain Creation Checklist

When adding a **new domain** to GEP:

```markdown
## New Domain Checklist: {domain-name}

- [ ] Create ai/domains/{domain}/skill.md
- [ ] Create ai/domains/{domain}/workflow.md
- [ ] Create ai/domains/{domain}/states.md (if entity has statuses)
- [ ] Create ai/domains/{domain}/permissions.md
- [ ] Add domain to ai/README.md domain overview table
- [ ] Add new socket events to ai/system/event-standards.md
- [ ] Add new API routes to domain skill.md
- [ ] Add new DB models to ai/system/database-philosophy.md
- [ ] Add cross-domain connections to relevant existing domains
- [ ] Create ai/domains/{domain}/prompts/build.prompt.md
- [ ] Create ai/domains/{domain}/prompts/refactor.prompt.md
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Risk |
|-------------|------|
| Skipping memory read before coding | AI hallucinates workflow, breaks existing logic |
| Only updating code, not memory | Memory drifts, next AI session makes wrong assumptions |
| Copy-pasting memory structure across domains | Generic memory = useless memory |
| Documenting ideal state, not actual state | AI builds on assumptions, not reality |
| Memory files > 200 lines | Context overflow, AI loses focus |
| Writing prose instead of structured rules | Hard to parse, wastes tokens |
