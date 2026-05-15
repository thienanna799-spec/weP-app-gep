# Technical Debt Registry – GEP ERP

> All technical debt identified from real codebase analysis.
> Prioritized by severity, business impact, and migration complexity.

---

## Debt Classification

| Severity | Meaning |
|----------|---------|
| 🔴 CRITICAL | Active risk of data corruption or financial loss |
| 🟠 HIGH | Significant scaling/reliability risk at production load |
| 🟡 MEDIUM | Operational friction; workarounds exist |
| 🟢 LOW | Code quality / maintainability debt |

---

## DEBT-001: OCR Queue In-Memory (No Persistence)

| Field | Value |
|-------|-------|
| Severity | 🔴 CRITICAL |
| Priority | P0 |
| Location | `server/src/services/ocr/queue/` |
| Risk Type | `queue_loss` |
| Business Impact | Fraud detection silently fails on server restart |
| Architecture Impact | Cannot scale horizontally (queue not shared across instances) |
| Scaling Risk | HIGH – every 1 additional server instance = 1 separate queue |
| Migration Complexity | LOW – well-defined BullMQ + Redis migration path |
| Current Workaround | Server runs 24/7; restarts are rare |
| Migration Path | `npm install bullmq ioredis` → implement BullMQ worker → replace OcrQueue interface |
| Estimated Effort | 2-3 days |

---

## DEBT-002: Hard Delete Everywhere (No Soft Delete)

| Field | Value |
|-------|-------|
| Severity | 🔴 CRITICAL |
| Priority | P0 |
| Location | All controllers (`prisma.model.delete()`) |
| Risk Type | `data_loss` |
| Business Impact | Deleted customers, orders, materials → permanent data loss |
| Architecture Impact | Cannot implement audit trail for deletions |
| Scaling Risk | MEDIUM – increases as data volume grows |
| Migration Complexity | HIGH – requires schema change + code change + frontend change for all models |
| Models to Fix | Order, Customer, Material, Driver, ProductRoll, PurchaseOrder |
| Migration Path | Add `deletedAt DateTime?` → update all `findMany` to `{ where: { deletedAt: null } }` → update DELETE handlers to `update({ data: { deletedAt: new Date() } })` |
| Estimated Effort | 3-5 days |

---

## DEBT-003: Write-Inside-Read APIs (Hidden Mutations)

| Field | Value |
|-------|-------|
| Severity | 🟠 HIGH |
| Priority | P1 |
| Location | `drivers.controller.ts` (GET /drivers), vehicles controller (GET /vehicles) |
| Risk Type | `hidden_mutation` |
| Business Impact | Race conditions on concurrent GET requests; cache invalidation bypassed |
| Architecture Impact | GET is not idempotent; violates HTTP semantics; breaks caching strategy |
| Scaling Risk | HIGH – concurrent API calls cause conflicting writes |
| Migration Complexity | LOW – extract to background job |
| Migration Path | Create `server/src/jobs/status-sync.job.ts` → run every 15 min via `setInterval` or cron |
| Estimated Effort | 1 day |

---

## DEBT-004: base64 Images in MySQL LongText

| Field | Value |
|-------|-------|
| Severity | 🟠 HIGH |
| Priority | P1 |
| Location | Driver, FuelLog, VehicleMaintenance, DailyVehicleLog, DailyFuelEntry models |
| Risk Type | Performance, scalability |
| Business Impact | Slow queries; large row sizes; memory pressure on server |
| Architecture Impact | MySQL not optimized for binary large objects; row size affects index performance |
| Scaling Risk | HIGH – grows linearly with driver count and daily logs |
| Migration Complexity | HIGH – requires data migration + new storage provider + URL update |
| Current State | `@db.LongText` fields, Express body limit 25MB |
| Migration Path | (1) Set up Cloudflare R2 bucket; (2) Write migration script to upload existing base64 to R2; (3) Store URL instead; (4) Update Express to receive file upload (multipart) instead of base64 |
| Estimated Effort | 5-7 days |

---

## DEBT-005: Hardcoded Business Constants

| Field | Value |
|-------|-------|
| Severity | 🟡 MEDIUM |
| Priority | P2 |
| Locations | `const WAREHOUSE_CAPACITY = 500` in reports.controller.ts; OCR tolerance (1000 VND, 5km) in ocr-webhook.controller.ts |
| Risk Type | Wrong business logic on configuration change |
| Business Impact | Wrong capacity alerts if warehouse expands; OCR tolerance cannot be tuned |
| Architecture Impact | Business rules embedded in code, not configurable |
| Migration Path | Store in `SystemConfig` table; load via `GET /admin/system-config`; cache with TTL |
| Estimated Effort | 0.5 days per constant |

---

## DEBT-006: No Pagination on List Endpoints

| Field | Value |
|-------|-------|
| Severity | 🟡 MEDIUM |
| Priority | P3 |
| Location | All `GET /orders`, `GET /drivers`, `GET /rolls`, etc. |
| Risk Type | Performance at scale |
| Business Impact | Pages become unusable as data grows; server memory exhausted on large tables |
| Architecture Impact | Cannot use cursor-based pagination without API change (breaking change) |
| Scaling Risk | HIGH at 10,000+ records |
| Migration Path | Add `?page=1&limit=50` query params; change response to `{ data: [...], total, page, limit }` |
| Frontend Impact | HIGH – all table components need pagination UI |
| Estimated Effort | 5-10 days (all domains) |

---

## DEBT-007: No Input Validation Library

| Field | Value |
|-------|-------|
| Severity | 🟡 MEDIUM |
| Priority | P2 |
| Location | All controllers |
| Current State | Manual `if (!field) return sendError(...)` checks; inconsistent across controllers |
| Risk Type | Security, data integrity |
| Business Impact | Invalid data can enter DB if developer forgets validation |
| Migration Path | Add `zod` or `joi` validation schemas per controller; validate at route layer |
| Estimated Effort | 3-5 days |

---

## DEBT-008: Denormalized Counters Not Auto-Maintained

| Field | Value |
|-------|-------|
| Severity | 🟡 MEDIUM |
| Priority | P2 |
| Location | `Customer.totalOrders`, `Customer.totalRevenue` |
| Current State | Fields exist in schema but are NOT auto-updated by any controller |
| Risk Type | `stock_corruption` (counter drift) |
| Business Impact | Customer list shows wrong order counts; revenue totals are stale |
| Migration Path | Add increment/decrement logic in orders controller on creation/completion; or run nightly reconciliation job |
| Estimated Effort | 1 day |

---

## DEBT-009: Trust Score Computed with N+1 Queries

| Field | Value |
|-------|-------|
| Severity | 🟡 MEDIUM |
| Priority | P2 |
| Location | `drivers.controller.ts` → getDrivers |
| Current State | For each driver, query all OcrAuditLogs → compute trust score |
| Risk Type | Performance at scale |
| Business Impact | GET /drivers becomes O(n) DB queries |
| Migration Path | Persist `trustScore` on Driver model; recalculate via background job after OCR review |
| Estimated Effort | 1 day |

---

## DEBT-010: No Payment Reversal / Write-off

| Field | Value |
|-------|-------|
| Severity | 🟡 MEDIUM |
| Priority | P2 |
| Location | finance.controller.ts |
| Current State | Once recorded, payments cannot be reversed; bad debts cannot be written off |
| Risk Type | `financial_mismatch` |
| Business Impact | Errors require manual DB intervention |
| Migration Path | Add `POST /finance/payments/:id/reverse` endpoint; add write-off mechanism |
| Estimated Effort | 2 days |

---

## Debt Remediation Roadmap

```
Sprint 1 (Critical):
  → DEBT-003: Fix write-inside-read (1 day)
  → DEBT-009: Fix N+1 trust score (1 day)

Sprint 2 (High Priority):
  → DEBT-001: OCR Queue → BullMQ migration plan
  → DEBT-005: Move hardcoded constants to SystemConfig
  → DEBT-008: Auto-maintain customer counters

Sprint 3 (Medium):
  → DEBT-002: Soft delete for Order, Customer, Material (schema migration)
  → DEBT-007: Add Zod validation

Q2 (Major Architecture):
  → DEBT-004: Image storage migration (R2)
  → DEBT-006: Pagination on all list endpoints
  → DEBT-010: Payment reversal
```

---

## Debt Score Summary

| Debt ID | Severity | Effort | Business Impact |
|---------|----------|--------|----------------|
| DEBT-001 | 🔴 CRITICAL | Low | Fraud detection failure |
| DEBT-002 | 🔴 CRITICAL | High | Permanent data loss |
| DEBT-003 | 🟠 HIGH | Low | Race conditions |
| DEBT-004 | 🟠 HIGH | High | DB performance at scale |
| DEBT-005 | 🟡 MEDIUM | Low | Wrong business rules |
| DEBT-006 | 🟡 MEDIUM | High | Performance at scale |
| DEBT-007 | 🟡 MEDIUM | Medium | Security gaps |
| DEBT-008 | 🟡 MEDIUM | Low | Stale UI data |
| DEBT-009 | 🟡 MEDIUM | Low | Performance |
| DEBT-010 | 🟡 MEDIUM | Medium | Financial correction |
