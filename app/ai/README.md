# GEP ERP – AI-Native Enterprise Architecture

> **Version:** Phase 8 Complete – Risk-Aware, Governance-Driven
> **Last Updated:** 2026-05-10
> **Total Files:** 90+

---

## 🚀 Quick Start for AI Assistants

**Step 1 – Read governance (mandatory):**
```
ai/system/ai-execution-governance.md   ← START HERE for any P0/P1 change
ai/system/memory-governance.md         ← Rules for keeping this memory in sync
ai/system/domain-criticality.md        ← Is the domain P0, P1, P2, or P3?
ai/system/risk-matrix.md               ← What risks does this change introduce?
```

**Step 2 – Read the domain:**
```
ai/domains/{domain}/skill.md           ← APIs, models
ai/domains/{domain}/workflow.md        ← Business flow
ai/domains/{domain}/states.md          ← Status machine
ai/domains/{domain}/permissions.md     ← Who can do what
```

**Step 3 – Build:**
```
ai/prompts/universal-build.prompt.md   ← Build template
ai/system/engineering-rules.md         ← 12 coding rules
```

---

## 📁 Full Directory Structure

```
ai/
├── README.md  ← YOU ARE HERE
│
├── system/                              ← 16 files
│   ├── ai-execution-governance.md      ⭐ Highest authority
│   ├── memory-governance.md            ⭐ Keep memory in sync
│   ├── domain-criticality.md           ⭐ P0/P1/P2/P3 map
│   ├── risk-matrix.md                  ⭐ 10 system risks
│   ├── technical-debt.md               ⭐ 10 debts with migration
│   ├── critical-workflows.md           ⭐ 6 protected workflows
│   ├── migration-roadmap.md            ⭐ 5-phase migration plan
│   ├── scalability-roadmap.md          ⭐ Bottlenecks + thresholds
│   ├── architecture.md                 Tech stack, data flow
│   ├── auth.md                         Firebase auth
│   ├── permissions.md                  RBAC
│   ├── realtime.md                     Socket.IO
│   ├── api-conventions.md              REST standards
│   ├── audit-policy.md                 Audit coverage
│   ├── engineering-rules.md            12 coding rules
│   ├── event-standards.md              Socket event registry
│   ├── database-philosophy.md          Prisma/MySQL decisions
│   ├── queue-standards.md              OCR queue
│   ├── naming-conventions.md           Code naming
│   └── decisions/                      Architecture Decision Records
│       ├── ADR-001-ocr-queue.md
│       ├── ADR-002-image-storage.md
│       ├── ADR-003-soft-delete.md
│       ├── ADR-004-event-driven-architecture.md
│       └── ADR-005-audit-log-immutability.md
│
├── shared/                              ← 10 files
│   ├── status-flows.md                 All state machines
│   ├── qr-flow.md                      QR lifecycle
│   ├── approval.rules.md               Approval chains
│   ├── notification.rules.md           Telegram bot
│   ├── finance.rules.md                Revenue/AR/AP
│   ├── ocr.rules.md                    OCR pipeline
│   ├── logging.rules.md                Audit logging
│   ├── upload.rules.md                 Image storage
│   ├── automation.rules.md             Auto-triggers
│   └── ui-ux.rules.md                  Frontend patterns
│
├── domains/                             ← 50+ files across 13 domains
│   ├── customers/    skill, workflow, states, permissions, crm, pricing.rules
│   ├── orders/       skill, workflow, states, permissions, prompts/
│   ├── production-orders/ skill, workflow, states, permissions
│   ├── production/   skill
│   ├── inventory/    skill, workflow, states, stocktake
│   ├── materials/    skill, workflow, states, bom
│   ├── procurement/  skill, workflow
│   ├── shipping/     skill, workflow, states
│   ├── drivers/      skill, workflow, states, permissions, fraud.rules
│   ├── finance/      skill, workflow, credit.rules
│   ├── reports/      skill, cache
│   ├── dashboard/    skill, realtime
│   └── admin/        skill, permissions
│
└── prompts/                             ← 3 files
    ├── universal-build.prompt.md
    ├── universal-refactor.prompt.md
    └── universal-audit.prompt.md
```

---

## 🔴 Critical Issues (Fix Before Any Major Feature)

| ID | Issue | File | Priority |
|----|-------|------|---------|
| DEBT-003 | DB writes inside GET handlers | drivers.controller.ts | P1 |
| DEBT-009 | N+1 trust score queries | drivers.controller.ts | P1 |
| RISK-009 | imageHash never populated (fraud bypass) | drivers.controller.ts | P1 |
| RISK-007 | 3 missing socket events | materials, production-orders, finance | P2 |

---

## 🏗 Phase Completion Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | System + Shared foundation | ✅ Complete |
| Phase 2 | Domain skill maps | ✅ Complete |
| Phase 3 | Workflows + States | ✅ Complete |
| Phase 4 | Permissions + Rules | ✅ Complete |
| Phase 5 | Prompts + Templates | ✅ Complete |
| Phase 6 | Specialist files (BOM, cache, stocktake) | ✅ Complete |
| Phase 7 | Memory Governance | ✅ Complete |
| **Phase 8** | **Risk-Aware Governance** | ✅ **Complete** |

---

## ⭐ Architecture Highlights

| Achievement | Description |
|------------|-------------|
| AI-Readable | Every domain has workflow, states, permissions, APIs documented |
| Risk-Aware | 10 risks classified with detection + mitigation |
| Debt-Tracked | 10 technical debts with severity, effort, migration path |
| Decision-Recorded | 5 ADRs explaining WHY architecture decisions were made |
| Governance-Enforced | Domain-level LOCKED/GUARDED/CAREFUL/FREE execution rules |
| Migration-Planned | 5-phase migration roadmap from current to target architecture |
| Scale-Aware | 6 bottlenecks with thresholds and mitigation strategies |
| Workflow-Protected | 6 critical workflows with immutability and transaction rules |
