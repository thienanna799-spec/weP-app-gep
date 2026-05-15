# Risk Matrix – GEP ERP System-Wide

> Every risk has been identified from real code analysis of the GEP codebase.
> AI MUST check this matrix before modifying any P0 or P1 domain.

---

## Risk Classification System

| Severity | Code | Meaning |
|----------|------|---------|
| 🔴 CRITICAL | C | Causes irreversible business damage or data loss |
| 🟠 HIGH | H | Causes incorrect system state, hard to detect |
| 🟡 MEDIUM | M | Causes degraded operation, detectable with monitoring |
| 🟢 LOW | L | Minor impact, recoverable |

---

## Risk Registry

---

### RISK-001: `data_loss`
**Severity:** 🔴 CRITICAL

| Field | Detail |
|-------|--------|
| Description | Permanent deletion of business records without soft-delete |
| Affected Domains | All (no soft-delete anywhere in system) |
| Detection | Relies on user report; no tombstone or deletion log |
| Manifestation | DELETE /customers/:id removes customer + loses order history association |
| Current State | Hard delete everywhere via `prisma.model.delete()` |
| Mitigation | Add `deletedAt DateTime?` to Order, Customer, Material, Driver; filter on `deletedAt: null` |
| Migration | Add field → deploy → update all `findMany` to include `where: { deletedAt: null }` |

---

### RISK-002: `audit_break`
**Severity:** 🔴 CRITICAL

| Field | Detail |
|-------|--------|
| Description | Status changes or mutations made without audit log entries |
| Affected Domains | orders, procurement, finance, inventory |
| Detection | Query: count status changes without matching log entries |
| Current Gaps | Payment created → no PaymentLog; Material stock changed → no entry in logs |
| Current State | OrderLog ✅, PurchaseOrderLog ✅, RollScanHistory ✅; PaymentLog ❌, MaterialLog ❌ |
| Mitigation | Add audit log creation alongside every mutation in P0/P1 controllers |
| AI Rule | **If removing any `prisma.*.create` for a log model → escalate to user, do NOT proceed** |

---

### RISK-003: `financial_mismatch`
**Severity:** 🔴 CRITICAL

| Field | Detail |
|-------|--------|
| Description | Revenue/AR/AP calculations diverge from actual payment records |
| Affected Domains | finance, orders |
| Root Causes | (1) Revenue includes `dang_giao` orders that may fail; (2) No write-off mechanism; (3) Float arithmetic risk |
| Detection | Manual reconciliation: compare SUM(payments) vs Order.totalRevenue |
| Manifestation | Finance summary shows revenue for deliveries that later fail |
| Mitigation | (1) Recognize revenue only on `hoan_thanh`; (2) Add write-off; (3) Store all amounts as Integer (cents/VND) |
| AI Rule | **NEVER use JavaScript float for money calculations** – use integer arithmetic |

---

### RISK-004: `stock_corruption`
**Severity:** 🔴 CRITICAL

| Field | Detail |
|-------|--------|
| Description | ProductRoll status diverges from actual physical location |
| Affected Domains | inventory, production, shipping |
| Root Causes | (1) No transaction wrapping pick-roll + status update; (2) Hard delete removes rolls; (3) No concurrent access control |
| Detection | Stocktake → compare system vs physical count |
| Manifestation | Two users pick same roll simultaneously → same roll shipped twice |
| Mitigation | Add optimistic locking or DB-level row lock on roll status update |
| AI Rule | **NEVER update roll status without validating current status first** |

---

### RISK-005: `hidden_mutation`
**Severity:** 🟠 HIGH

| Field | Detail |
|-------|--------|
| Description | GET (read) API endpoints performing database writes |
| Affected Domains | drivers, vehicles |
| Current Instances | `GET /drivers` → auto-updates driver.status; `GET /vehicles` → auto-updates vehicle.status |
| Impact | Concurrent GETs cause race conditions; read ops not idempotent; cache invalidation missed |
| Detection | Search codebase: `prisma.*.update` inside GET handler |
| Mitigation | Move all status sync logic to scheduled background job (every 15 min) |
| AI Rule | **NEVER introduce `prisma.*.update/create/delete` inside a GET handler** |

---

### RISK-006: `queue_loss`
**Severity:** 🟠 HIGH

| Field | Detail |
|-------|--------|
| Description | Background jobs lost on server restart (in-memory queue) |
| Affected Domains | drivers/OCR |
| Current State | OcrQueue stored in Node.js memory; no persistence |
| Impact | Server restart = all pending OCR audits silently lost |
| Detection | Server restart during high OCR load → OcrAuditLog count drops |
| Mitigation | Migrate to BullMQ + Redis; persist job IDs in DB before queueing |
| Migration Path | `npm install bullmq ioredis` → wrap existing OcrQueue interface → swap implementation |
| AI Rule | **DO NOT add new background jobs to the in-memory queue** without noting the persistence risk |

---

### RISK-007: `realtime_desync`
**Severity:** 🟡 MEDIUM

| Field | Detail |
|-------|--------|
| Description | Socket.IO events not emitted for all mutations → stale UI state |
| Affected Domains | materials, production-orders, finance |
| Missing Events | `material_stock_changed`, `production_order_updated`, `payment_received` |
| Impact | Users see outdated data across browser tabs; reports show stale cache |
| Detection | Add event logging middleware on socket layer |
| Mitigation | Add missing emit calls per `ai/system/event-standards.md` |
| AI Rule | **When adding a new mutation → always check if socket event is missing** |

---

### RISK-008: `duplicate_processing`
**Severity:** 🟡 MEDIUM

| Field | Detail |
|-------|--------|
| Description | Same operation processed multiple times due to retry/network issues |
| Affected Domains | inventory (scan-to-stock), payments, OCR |
| Root Causes | No idempotency keys on POST endpoints |
| Manifestation | Double-tap on mobile → two payment records created |
| Detection | Check for duplicate payments: same orderId + amount + method within 30 seconds |
| Mitigation | Add idempotency key header support; check referenceId before creating OCR audit |
| AI Rule | **Critical endpoints (payment, scan-to-stock) must check for recent duplicates** |

---

### RISK-009: `fraud_bypass`
**Severity:** 🟡 MEDIUM

| Field | Detail |
|-------|--------|
| Description | Fraudulent driver expense submissions not detected by OCR |
| Affected Domains | drivers/OCR |
| Root Causes | (1) imageHash never populated → duplicate receipt detection broken; (2) OCR queue can lose jobs |
| Current State | Fraud detection partially functional; duplicate detection completely broken |
| Detection | Admin review via `/ocr-audit?riskLevel=high` |
| Mitigation | (1) Compute imageHash before FuelLog insert; (2) Persist OCR queue |
| AI Rule | **When modifying FuelLog creation, MUST populate imageHash** |

---

### RISK-010: `stale_cache`
**Severity:** 🟡 MEDIUM

| Field | Detail |
|-------|--------|
| Description | Report cache serves outdated data after mutations |
| Affected Domains | reports, dashboard |
| Root Causes | Missing socket events (`material_stock_changed`, `production_order_updated`) → cache not invalidated |
| Current State | Partial – only order, inventory, shipping events trigger invalidation |
| Detection | Compare cached report with fresh DB query |
| Mitigation | Add missing socket events; consider max-age header even without event |
| AI Rule | **When adding new socket events, update `invalidateCacheForEvent` map in report-cache.ts** |

---

## Risk Heat Map

```
                     SEVERITY
                  LOW    MED    HIGH   CRITICAL
             ┌──────┬──────┬──────┬──────┐
PROBABILITY  │      │ R010 │ R005 │ R001 │ HIGH
HIGH         │      │ R007 │ R006 │ R003 │
             ├──────┼──────┼──────┼──────┤
PROBABILITY  │      │ R008 │ R009 │ R002 │
MEDIUM       │      │      │      │ R004 │
             ├──────┼──────┼──────┼──────┤
PROBABILITY  │      │      │      │      │
LOW          │      │      │      │      │
             └──────┴──────┴──────┴──────┘
```

## Remediation Priority

| Priority | Risk ID | Action |
|----------|---------|--------|
| 🔴 Immediate | RISK-005 | Remove writes from GET handlers |
| 🔴 Immediate | RISK-009 | Populate imageHash in FuelLog |
| 🟠 This sprint | RISK-006 | Document OCR queue loss risk; plan BullMQ migration |
| 🟠 This sprint | RISK-007 | Add 3 missing socket events |
| 🟡 Next sprint | RISK-001 | Add soft-delete to Order, Customer, Material |
| 🟡 Next sprint | RISK-003 | Fix revenue recognition to hoan_thanh only |
| 🟡 Backlog | RISK-002 | Add PaymentLog, MaterialLog |
| 🟡 Backlog | RISK-004 | Add optimistic locking on roll status |
| 🟡 Backlog | RISK-008 | Add idempotency keys |
| 🟢 Backlog | RISK-010 | Add missing cache invalidation events |
