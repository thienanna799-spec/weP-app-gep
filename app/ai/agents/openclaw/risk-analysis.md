# OpenClaw – Risk Analysis Framework

> OpenClaw's risk classification system for GEP ERP requests.
> Every request is scored BEFORE execution. Score determines execution path.

---

## Risk Scoring Formula

```
Base Score = Σ (risk_severity_points × domain_weight)

Severity Points:
  CRITICAL = 40
  HIGH     = 20
  MEDIUM   = 10
  LOW      = 3

Domain Governance Multiplier:
  LOCKED   = × 1.5
  GUARDED  = × 1.2
  CAREFUL  = × 1.0
  FREE     = × 0.7

Final Score = min(100, BaseScore × GovernanceMultiplier)
```

---

## Risk Score Thresholds

| Score | Level | Action |
|-------|-------|--------|
| 0–20 | 🟢 LOW | Execute normally |
| 21–40 | 🟡 MODERATE | Advise + proceed |
| 41–60 | 🟠 HIGH | Review required before execution |
| 61–79 | 🔴 CRITICAL | Escalation required; human review recommended |
| 80–100 | 🚨 EXTREME | Block until constraints explicitly met |

---

## The 10 System Risks

### RISK-001: Data Loss (data_loss)
```
Severity: 🔴 CRITICAL
Domains:  finance, inventory, orders, customers, materials, drivers

Trigger signals:
  - Request mentions "delete", "remove", "drop", "xóa"
  - Code contains prisma.*.delete() without soft-delete pattern
  - Model has no deletedAt field but delete operation proposed

Current exposure:
  - Customer, Order, Material have NO soft delete (DEBT-002)
  - ProductRoll deletion would break order history

Mitigation:
  - Add deletedAt DateTime? to P0/P1 models
  - Convert hard deletes to soft deletes
  - Block any request to add prisma.*.delete() to P0/P1 models
```

### RISK-002: Audit Break (audit_break)
```
Severity: 🔴 CRITICAL
Domains:  orders, procurement, finance, inventory

Trigger signals:
  - Status change in P0/P1 domain without audit log
  - Request to update/delete existing log records
  - Missing log creation after mutation

Current exposure:
  - Admin actions not always logged
  - Some PO status changes missing PurchaseOrderLog

Mitigation:
  - Mandatory audit log alongside every P0/P1 status change
  - Review checklist item A1-A9 enforced
```

### RISK-003: Financial Mismatch (financial_mismatch)
```
Severity: 🔴 CRITICAL
Domains:  finance, orders

Trigger signals:
  - Float arithmetic for monetary values
  - Revenue recognition outside hoan_thanh status
  - Payment amount without validation
  - AR/AP calculation formula change

Current exposure:
  - Revenue includes dang_giao orders (aggressive recognition)
  - No payment reversal mechanism

Mitigation:
  - Integer arithmetic only
  - Validate: amount ≤ (totalRevenue - totalPaid) + 1
  - Revenue: count only hoan_thanh orders
```

### RISK-004: Stock Corruption (stock_corruption)
```
Severity: 🔴 CRITICAL
Domains:  inventory, production, shipping, orders

Trigger signals:
  - Pick-roll operation without $transaction
  - Status jump (dang_san_xuat → da_xuat_kho)
  - Multiple concurrent pick-roll for same order

Current exposure:
  - No optimistic locking on ProductRoll
  - WAREHOUSE_CAPACITY hardcoded at 500

Mitigation:
  - $transaction for ALL pick-roll + status update
  - Validate status transition before DB write
  - Check roll.status === expected before updating
```

### RISK-005: Hidden Mutation (hidden_mutation)
```
Severity: 🟠 HIGH
Domains:  drivers (confirmed bug)

Trigger signals:
  - prisma.*.update inside GET handler body
  - Status auto-fix logic in list endpoints

Current exposure:
  - GET /drivers → updates driver.status (confirmed bug)
  - GET /vehicles → updates vehicle.status (confirmed bug)

Mitigation:
  - Move status corrections to background job (every 15 min)
  - Strict review: no DB writes in GET handlers
```

### RISK-006: Queue Loss (queue_loss)
```
Severity: 🟠 HIGH
Domains:  drivers

Trigger signals:
  - OCR queue modification
  - Server restart with pending OCR jobs
  - New async job without Redis backing

Current exposure:
  - OcrQueue is in-memory array (DEBT-001: P0)
  - Server restart loses all queued OCR jobs

Mitigation:
  - Migrate to BullMQ + Redis (ADR-001)
  - Track: OcrQueue.addJob() failure handling
```

### RISK-007: Realtime Desync (realtime_desync)
```
Severity: 🟡 MEDIUM
Domains:  materials, production-orders, finance

Trigger signals:
  - Mutation without io.emit() in P0/P1 domains
  - New event type not in event-standards.md

Current exposure:
  - material_stock_changed: NOT emitted (gap)
  - production_order_updated: NOT emitted (gap)
  - payment_received: NOT emitted (gap)

Mitigation:
  - Add missing events to controllers
  - Update event-standards.md
  - Review: every mutation has emit()
```

### RISK-008: Duplicate Processing (duplicate_processing)
```
Severity: 🟡 MEDIUM
Domains:  inventory, finance, drivers

Trigger signals:
  - POST endpoint without idempotency key
  - OCR submission without referenceId check
  - Mobile QR scan without debounce

Current exposure:
  - imageHash never populated in FuelLog (RISK-009)
  - No referenceId deduplication in OCR audit

Mitigation:
  - Compute imageHash before FuelLog insert
  - Add referenceId uniqueness check to OcrAuditLog
  - Debounce QR scan submissions from mobile app
```

### RISK-009: Fraud Bypass (fraud_bypass)
```
Severity: 🟡 MEDIUM
Domains:  drivers

Trigger signals:
  - imageHash field missing or null in FuelLog
  - OCR tolerance threshold changes
  - Fraud detection rule modifications

Current exposure:
  - imageHash is never computed (createHash never called)
  - Duplicate receipt detection completely broken

Mitigation:
  - Add: const imageHash = createHash('md5').update(receiptUrl).digest('hex')
  - Before: prisma.fuelLog.create({ data: { ...data, imageHash } })
```

### RISK-010: Stale Cache (stale_cache)
```
Severity: 🟡 MEDIUM
Domains:  reports, dashboard

Trigger signals:
  - New socket event not in invalidateCacheForEvent()
  - Report cache TTL modification
  - New mutation in P0 domain without cache invalidation

Current exposure:
  - 3 missing events not connected to cache invalidation
  - Report cache may serve stale data after mutations

Mitigation:
  - Update invalidateCacheForEvent() with every new event
  - Review cache coverage after every P0/P1 domain change
```

---

## Risk-Domain Impact Matrix

| Risk | finance | inventory | orders | shipping | drivers | materials | others |
|------|:-------:|:---------:|:------:|:--------:|:-------:|:---------:|:------:|
| RISK-001 | ● | ● | ● | - | ● | ● | ● |
| RISK-002 | ● | ● | ● | - | ● | - | - |
| RISK-003 | ● | - | ● | - | - | - | - |
| RISK-004 | - | ● | ● | ● | - | - | - |
| RISK-005 | - | - | - | - | ● | - | - |
| RISK-006 | - | - | - | - | ● | - | - |
| RISK-007 | ● | - | - | - | - | ● | ● |
| RISK-008 | ● | ● | - | - | ● | - | - |
| RISK-009 | - | - | - | - | ● | - | - |
| RISK-010 | - | ● | ● | - | - | - | ● |

● = impacted domain

---

## Risk Classification by Request Type

| Request Pattern | Likely Risks | Default Tier |
|----------------|-------------|-------------|
| "delete [entity]" | RISK-001, RISK-002 | P0 Critical |
| "add payment / finance" | RISK-003, RISK-002 | P0 Critical |
| "change inventory / stock" | RISK-004, RISK-007 | P0 Critical |
| "fix status / auto-update" | RISK-005 | P1 Business |
| "add OCR / fuel / receipt" | RISK-006, RISK-009 | P1 Business |
| "add report / cache" | RISK-010 | P2 Normal |
| "add event / socket" | RISK-007 | P1 Business |
| "add dashboard widget" | RISK-010 (minor) | P3 UI |
| "refactor controller" | RISK-002, RISK-005 | P1 Business |
