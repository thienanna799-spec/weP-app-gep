# OpenClaw Policy: Transaction Policy

> All rules governing database transaction usage in GEP ERP.
> **Source:** ADR-005, ai/system/critical-workflows.md, ai/system/engineering-rules.md

---

## Core Rule

```
Any operation that modifies 2+ database models in a P0/P1 domain
MUST be wrapped in prisma.$transaction([...]).
No exceptions.
```

---

## When $transaction is REQUIRED

| Operation | Models Changed | Domain | Mandatory |
|-----------|---------------|--------|-----------|
| Order approval | Order + OrderLog | orders | 🔴 YES |
| Delivery completion | Order + ShippingOrder + ProductRoll + OrderLog | orders + shipping + inventory | 🔴 YES |
| Payment creation | Payment + Order.paymentStatus | finance | 🔴 YES |
| Roll reservation (pick) | ProductRoll (n rows) + order context | inventory | 🔴 YES |
| QR scan to stock | ProductRoll + RollScanHistory | inventory | 🔴 YES |
| PO goods receive | PurchaseOrder + PurchaseOrderLog + MaterialTransaction | procurement + materials | 🟠 YES |
| Production roll create | ProductionOrder + ProductRoll (n rows) | production-orders + inventory | 🟠 YES |
| Stocktake complete | Stocktake + StocktakeItem + ProductRoll (n rows) | inventory | 🟠 YES |

---

## $transaction Patterns

### Pattern A: Array Transaction (preferred)
```typescript
// ✅ Atomic: both updates succeed or both fail
await prisma.$transaction([
  prisma.order.update({
    where: { id: orderId },
    data: { status: 'hoan_thanh' },
  }),
  prisma.orderLog.create({
    data: { orderId, action: 'completed', userId: req.userId, note: '' },
  }),
]);
```

### Pattern B: Interactive Transaction (for complex logic)
```typescript
// ✅ Interactive: use when logic between DB calls required
await prisma.$transaction(async (tx) => {
  const order = await tx.order.findUnique({ where: { id: orderId } });

  // Validate BEFORE mutating
  if (order.status !== 'dang_giao') {
    throw new Error('Invalid status transition');
  }

  await tx.order.update({ where: { id: orderId }, data: { status: 'hoan_thanh' } });
  await tx.orderLog.create({ data: { orderId, action: 'completed', userId } });
  await tx.shippingOrder.update({ where: { id: shippingId }, data: { status: 'giao_thanh_cong' } });
});
```

### Anti-Pattern: Sequential without transaction
```typescript
// ❌ DANGEROUS: if second update fails, DB is inconsistent
await prisma.order.update({ where: { id }, data: { status: 'hoan_thanh' } });
await prisma.shippingOrder.update({ where: { id: shippingId }, data: { status: 'giao_thanh_cong' } }); // if this fails → inconsistent
await prisma.orderLog.create({ data: { ... } }); // if this fails → no audit trail
```

---

## Transaction Boundaries

### DO include inside $transaction:
- All DB reads needed for validation (using `tx.model.findUnique`)
- All DB writes that must be atomic
- The audit log creation

### DO NOT include inside $transaction:
- HTTP calls (Telegram, external APIs)
- `io.emit()` calls – emit AFTER transaction completes
- File I/O operations
- `console.log` (fine, but unnecessary)
- Long-running operations that could cause timeout

```typescript
// ✅ Correct boundary:
const result = await prisma.$transaction(async (tx) => {
  await tx.order.update({ ... });        // ← INSIDE
  await tx.orderLog.create({ ... });     // ← INSIDE
  return updatedOrder;
});

// These AFTER transaction:
io.emit('order_updated', { orderId });   // ← OUTSIDE
await telegramService.notify({ ... });   // ← OUTSIDE
```

---

## Transaction Timeout Policy

| Operation Type | Timeout |
|---------------|---------|
| Simple 2-3 model update | Default (5000ms) |
| Stocktake with many rolls | 30000ms |
| Bulk roll creation | 30000ms |
| Never use | Infinite |

```typescript
// Set custom timeout for large operations:
await prisma.$transaction([...], { timeout: 30000 });
```

---

## When $transaction is NOT Required

| Operation | Reason |
|-----------|--------|
| Single model read (findMany, findUnique) | No mutation |
| Single model create with no side effects | Atomic by default |
| P3 domain mutations (dashboard, UI) | Low risk |
| Log-only operations (append to log) | Already atomic |

---

## Rollback Behavior

Prisma $transaction automatically rolls back when:
- Any operation inside the transaction throws
- Validation error occurs
- Unique constraint violation
- DB timeout

**What DOES NOT rollback:**
- io.emit() calls made before transaction failure
- Telegram messages sent before transaction failure
- In-memory state changes

This is why: emit and notify must ALWAYS come AFTER transaction completes.

---

## Review Checklist for Transactions

```
□ Is this a P0/P1 domain mutation? → $transaction required
□ Does it touch 2+ models? → $transaction required
□ Does it include audit log creation? → Must be inside transaction
□ Is io.emit() inside transaction? → MOVE it outside
□ Is HTTP call inside transaction? → MOVE it outside
□ Is timeout set for large batch operations? → Add if > 50 records
```
