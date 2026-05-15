# OpenClaw – Review Checklist

> Mandatory checks OpenClaw runs when reviewing ANY output from Antigravity or code changes.
> Organized by category. All CRITICAL checks must pass for review to APPROVE.

---

## Scoring System

```
Starting score: 100

Per violation:
  CRITICAL violation  → -30 points
  HIGH violation      → -15 points
  MEDIUM violation    → -8 points
  LOW violation       → -3 points
  WARNING             → -2 points

Pass threshold: 80/100
Block threshold: any CRITICAL OR score < 80
```

---

## Category 1: Transaction Integrity 🔴 CRITICAL

| # | Check | Domains | Severity |
|---|-------|---------|---------|
| T1 | `prisma.$transaction()` wrapping for all multi-step P0/P1 mutations | finance, inventory, orders, shipping | CRITICAL |
| T2 | Transaction includes ALL related models (e.g., Order + ShippingOrder + Roll) | orders, shipping, inventory | CRITICAL |
| T3 | No DB mutation outside transaction boundary in atomic operations | all P0 | CRITICAL |
| T4 | Error propagation causes transaction rollback correctly | all P0/P1 | HIGH |
| T5 | Transaction does not include non-DB operations (HTTP calls, events) | all | MEDIUM |

**Detection patterns:**
```typescript
// ❌ BAD: No transaction
await prisma.order.update({ ... });
await prisma.shippingOrder.update({ ... }); // If either fails, inconsistent state

// ✅ GOOD: Transaction
await prisma.$transaction([
  prisma.order.update({ ... }),
  prisma.shippingOrder.update({ ... }),
]);
```

---

## Category 2: Audit Trail Completeness 🔴 CRITICAL

| # | Check | Audit Model | Severity |
|---|-------|------------|---------|
| A1 | OrderLog created on every Order status change | OrderLog | CRITICAL |
| A2 | DeliveryLog created on every ShippingOrder action | DeliveryLog | CRITICAL |
| A3 | OcrAuditLog created for every OCR result processed | OcrAuditLog | CRITICAL |
| A4 | PurchaseOrderLog created on every PO status change | PurchaseOrderLog | HIGH |
| A5 | RollScanHistory created for every QR scan | RollScanHistory | HIGH |
| A6 | UserActivityLog created for admin actions | UserActivityLog | MEDIUM |
| A7 | NotificationLog created for every Telegram send | NotificationLog | LOW |
| A8 | Audit log uses `create()` NOT `upsert()` (append-only) | all log models | CRITICAL |
| A9 | Audit log is never passed to `update()` or `delete()` | all log models | CRITICAL |

**Detection patterns:**
```typescript
// ❌ BAD: Status change without audit log
await prisma.order.update({ where: { id }, data: { status: 'da_duyet' } });

// ✅ GOOD: Status change WITH audit log
await prisma.$transaction([
  prisma.order.update({ where: { id }, data: { status: 'da_duyet' } }),
  prisma.orderLog.create({ data: { orderId: id, action: 'approved', userId, note } }),
]);
```

---

## Category 3: Realtime Event Coverage 🟠 HIGH

| # | Check | Event | Severity |
|---|-------|-------|---------|
| R1 | `order_updated` emitted after every Order mutation | orders | HIGH |
| R2 | `inventory_updated` emitted after every Roll status change | inventory | HIGH |
| R3 | `shipping_updated` emitted after every ShippingOrder mutation | shipping | HIGH |
| R4 | `driver_vehicle_updated` emitted after driver/vehicle changes | drivers | HIGH |
| R5 | `user_updated` emitted after role/permission changes | admin | MEDIUM |
| R6 | Socket transport includes `polling` before `websocket` | global | CRITICAL |
| R7 | Events not emitted inside $transaction (emit after transaction completes) | all | MEDIUM |

**Detection patterns:**
```typescript
// ❌ BAD: Mutation without event
await prisma.order.update({ where: { id }, data: { status } });

// ✅ GOOD: Mutation + event
await prisma.order.update({ where: { id }, data: { status } });
io.emit('order_updated', { orderId: id, status });
```

---

## Category 4: Hidden Mutation Detection 🟠 HIGH

| # | Check | Severity |
|---|-------|---------|
| HM1 | No `prisma.*.update/create/delete` inside GET handler body | CRITICAL |
| HM2 | No status auto-fix logic inside listing endpoints | CRITICAL |
| HM3 | No DB writes triggered by read operations | HIGH |
| HM4 | Background jobs handle all status corrections | HIGH |

**Detection patterns:**
```typescript
// ❌ BAD: Write inside GET
router.get('/drivers', async (req, res) => {
  await prisma.driver.update({ where: { id }, data: { status: 'available' } }); // ← VIOLATION
});

// ✅ GOOD: Read only
router.get('/drivers', async (req, res) => {
  const drivers = await prisma.driver.findMany({ ... });
  // Status correction runs in background job
});
```

---

## Category 5: Financial Integrity 🔴 CRITICAL

| # | Check | Severity |
|---|-------|---------|
| F1 | No `parseFloat()` or floating-point for VND amounts | CRITICAL |
| F2 | No `.toFixed()` or `/100` operations on monetary values | CRITICAL |
| F3 | Payment amount ≤ (totalRevenue - totalPaid) + 1 VND tolerance | CRITICAL |
| F4 | Payment records never passed to `update()` or `delete()` | CRITICAL |
| F5 | Revenue recognized only on `hoan_thanh` orders | HIGH |
| F6 | `paymentStatus` recalculated after every Payment create | HIGH |

---

## Category 6: Status Machine Validation 🟠 HIGH

| # | Check | Severity |
|---|-------|---------|
| SM1 | Status transitions validated against allowed transitions in states.md | HIGH |
| SM2 | Terminal states (`hoan_thanh`, `loi_hong`, `huy`) not overwritten | CRITICAL |
| SM3 | Status jump prevention (no skipping required intermediate states) | HIGH |
| SM4 | Status validation happens BEFORE DB write | HIGH |

---

## Category 7: Cross-Domain Silent Changes 🟠 HIGH

| # | Check | Severity |
|---|-------|---------|
| CD1 | Finance changes validated for Order impact | HIGH |
| CD2 | Inventory changes validated for Order fulfillment impact | HIGH |
| CD3 | Shipping changes validated for Order completion impact | HIGH |
| CD4 | Admin permission changes validated for all role-gated routes | HIGH |
| CD5 | Driver changes validated for active ShippingOrder impact | MEDIUM |

---

## Category 8: Anti-Pattern Detection 🔴 CRITICAL

| ID | Pattern | Severity |
|----|---------|---------|
| AP-001 | WRITE_IN_GET | CRITICAL |
| AP-002 | N_PLUS_1_QUERY | HIGH |
| AP-003 | FLOAT_MONEY | CRITICAL |
| AP-004 | MISSING_SOCKET_EMIT | HIGH |
| AP-005 | MISSING_TRANSACTION | CRITICAL |
| AP-006 | DELETE_AUDIT_LOG | CRITICAL |
| AP-007 | HARDCODED_CONSTANT | MEDIUM |
| AP-008 | DIRECT_STOCK_UPDATE | HIGH |
| AP-009 | STATUS_JUMP | CRITICAL |
| AP-010 | MISSING_AUDIT_LOG | HIGH |

---

## Category 9: Architecture Compliance 🟠 HIGH

| # | Check | Severity |
|---|-------|---------|
| AC1 | `asyncHandler` wrapping used for all async routes | HIGH |
| AC2 | `sendSuccess`/`sendError` used for all responses | HIGH |
| AC3 | Firebase Admin SDK used for auth verification | CRITICAL |
| AC4 | Prisma is the ONLY ORM (no raw SQL for business logic) | HIGH |
| AC5 | OCR webhook is fire-and-forget (no await for OCR result) | HIGH |
| AC6 | No new models added without corresponding memory update | MEDIUM |

---

## Category 10: Queue & Async Safety 🟡 MEDIUM

| # | Check | Severity |
|---|-------|---------|
| Q1 | OCR jobs survive server restart (Redis-backed queue) | HIGH |
| Q2 | Duplicate OCR processing prevented via referenceId check | MEDIUM |
| Q3 | imageHash populated on FuelLog creation | MEDIUM |
| Q4 | Background jobs don't perform UI mutations | LOW |

---

## Review Decision Matrix

```
Score 90-100 + 0 violations    → ✅ AUTO-APPROVE
Score 80-89 + 0 CRITICAL       → ✅ APPROVE with warnings
Score 60-79 + no CRITICAL      → ⚠️  CONDITIONAL (fix warnings)
Score <60 OR any CRITICAL      → ❌ BLOCK (must fix before proceeding)
Any CRITICAL in finance/inv/orders → ❌ BLOCK (always, regardless of score)
```
