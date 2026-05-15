# Critical Workflows – Protection Map

> These workflows are business-critical. Any code change affecting them MUST preserve all listed invariants.
> AI MUST read this file before modifying any P0/P1 controller.

---

## WORKFLOW-001: Inventory Lifecycle

**Criticality:** P0 – Data Integrity Critical

### Stages
```
[Production] → dang_san_xuat
     ↓ scan-to-stock
[In Stock]   → trong_kho
     ↓ pick-roll (orderId assigned)
[Reserved]   → da_giu_cho_don
     ↓ shipped out
[Shipped]    → da_xuat_kho
     ↓ (if return)
[Returned]   → hoan_tra
```

### Immutable Records
- `RollScanHistory` – every QR scan is append-only
- `RollMovement` – every position change is logged
- `ProductRoll` – records are never deleted (only status changes)

### Transactional Boundaries
```typescript
// pick-roll must be atomic
await prisma.$transaction([
  prisma.productRoll.update({ where: { id }, data: { status: 'da_giu_cho_don', orderId } }),
  // Optional: add RollMovement log
]);
```

### Rollback Behavior
- `da_giu_cho_don` → `trong_kho`: allowed when order cancelled
- `da_xuat_kho` → `hoan_tra`: allowed on return
- `loi_hong` → NO rollback (terminal)

### Audit Preservation
- Never remove `RollScanHistory` creation from scan-to-stock
- Never remove `RollMovement` creation from position changes

### Realtime Sync
- `io.emit('inventory_updated', { rollId, status })` MUST fire after every status change

### Cross-Domain Impact
| This changes → | That must happen |
|---------------|-----------------|
| Roll → trong_kho | Reports cache invalidated |
| Roll → da_giu_cho_don | Order is "ready to ship" |
| Roll → da_xuat_kho | ShippingOrder can complete |

---

## WORKFLOW-002: Shipping / Delivery Lifecycle

**Criticality:** P1 – Operational Critical

### Stages
```
cho_xuat_kho → dang_chuan_bi → da_xuat_kho → da_ban_giao_tai_xe → dang_giao
     ↓
giao_thanh_cong (terminal ✅)     OR     giao_that_bai → hoan_tra (terminal ❌)
```

### Immutable Records
- `DeliveryLog` – every delivery action is append-only
- `ContactLog` – customer contact attempts are append-only

### Transactional Boundaries
```typescript
// Successful delivery must be atomic with Order completion
await prisma.$transaction([
  prisma.shippingOrder.update({ data: { status: 'giao_thanh_cong', deliveredAt: now() } }),
  prisma.order.update({ data: { status: 'hoan_thanh' } }),
  prisma.orderLog.create({ data: { action: 'completed', orderId } }),
]);
```

### Rollback Behavior
- `giao_that_bai` does NOT automatically rollback roll statuses
- Returns are handled via separate `ReturnRequest` workflow
- Re-ship creates a NEW ShippingOrder (old one stays as failed record)

### AI Constraints
1. NEVER mark `hoan_thanh` without verifying linked ShippingOrder is `giao_thanh_cong`
2. NEVER delete DeliveryLog entries
3. ALWAYS emit `shipping_updated` AND `order_updated` on delivery completion

---

## WORKFLOW-003: Payment Lifecycle

**Criticality:** P0 – Financial Critical

### Flow
```
Order created (totalRevenue = X)
  ↓
POST /finance/payments { amount }
  → Validate: amount <= remaining + 1 (rounding buffer)
  → Create Payment (immutable)
  → Recalculate: newTotalPaid = SUM(all payments for orderId)
  → Update Order.paymentStatus:
      newTotalPaid >= totalRevenue → 'da_thanh_toan'
      else                        → 'thanh_toan_mot_phan'
```

### Immutable Records
- `Payment` records are NEVER deleted or modified
- Corrections require a new payment or reversal entry

### Financial Calculation Rules
```typescript
// ✅ CORRECT – integer arithmetic
const remaining = order.totalRevenue - totalPaid;  // Both integers (VND)
if (amount > remaining + 1) return sendError(res, 'Overpayment', 400);

// ❌ WRONG – float risk
const remaining = 1500000.1 - 1000000.0;  // Float imprecision
```

### Transactional Boundaries
```typescript
// Payment + paymentStatus update must be atomic
const payment = await prisma.$transaction(async (tx) => {
  const p = await tx.payment.create({ data: { orderId, amount, method, ... } });
  const payments = await tx.payment.findMany({ where: { orderId } });
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  await tx.order.update({ where: { id: orderId }, data: {
    paymentStatus: totalPaid >= order.totalRevenue ? 'da_thanh_toan' : 'thanh_toan_mot_phan'
  }});
  return p;
});
```

### Rollback Behavior
- Currently: NO payment reversal exists (DEBT-010)
- Planned: `POST /finance/payments/:id/reverse` → create offsetting negative payment

### AI Constraints
1. **NEVER use floating-point** for any payment calculation
2. **NEVER delete Payment records** – create reversal instead
3. **ALWAYS update paymentStatus** atomically with payment creation
4. **NEVER skip validation** (amount > remaining + 1)

---

## WORKFLOW-004: OCR Audit Lifecycle

**Criticality:** P1 – Fraud Detection

### Flow
```
Driver submits expense with photo
  → FuelLog.receiptUrl stored (base64)
  → OcrQueue.addJob('fuel_receipt_audit', { driverId, referenceId, imageUrl, declaredValue })
  → [Background] OCR provider called
  → OcrAuditLog created (IMMUTABLE from this point)
  → If mismatch: NotificationLog created
  → Admin reviews: PATCH /ocr-audit/:id/review { reviewStatus }
```

### Immutable Records
- `OcrAuditLog` – once created, only `reviewStatus` can change
- `NotificationLog` – append-only

### Idempotency Requirement
```typescript
// Before creating OcrAuditLog, check for existing by referenceId
const existing = await prisma.ocrAuditLog.findFirst({
  where: { referenceId: payload.referenceId }
});
if (existing) return;  // Already processed – do not duplicate
```

### Rollback Behavior
- No rollback – OCR audit records are permanent
- Wrong reviews can be corrected by re-reviewing (reviewStatus override)

### Queue Dependencies
- Currently: in-memory queue (DEBT-001) – jobs lost on restart
- Required: BullMQ + Redis for persistence

### AI Constraints
1. **ALWAYS check referenceId** before creating OcrAuditLog
2. **NEVER block** the main request waiting for OCR result
3. **ALWAYS handle** OcrQueue.addJob failure gracefully (fire-and-forget with logging)

---

## WORKFLOW-005: Production Order Lifecycle

**Criticality:** P1 – Manufacturing

### Flow
```
Order approved → Staff creates ProductionOrder (waiting_material)
  → Materials confirmed → status: ready
  → Production starts → status: producing
  → Worker creates rolls one by one (POST /rolls)
  → Worker scans each roll → trong_kho (feeds inventory)
  → All rolls created → status: completed
```

### Transactional Boundaries
- Roll creation: each roll = single atomic insert
- QR scan-to-stock: atomic (roll status + scan history)
- ProductionOrder completion: manual (no server-side validation of targetRolls)

### Rollback Behavior
- `producing` → `cancelled`: orphaned rolls must be manually marked `loi_hong`
- `completed` → no rollback (terminal)

### AI Constraints
1. **NEVER auto-complete** ProductionOrder without validating roll count
2. **ALWAYS emit** `inventory_updated` when roll is scanned to stock
3. **DO NOT delete** ProductionOrders with existing rolls (orphan risk)

---

## WORKFLOW-006: Reconciliation Flows

**Criticality:** P0 – Data Integrity

### Inventory Reconciliation
```
Trigger: Stocktake completed
Process:
  Expected: ProductRolls where status='trong_kho' and warehouse=target
  Actual: StocktakeItems scanned during count
  Gap: Expected - Actual = missing rolls
Action: Investigate each missing roll; update status if confirmed lost
```

### Financial Reconciliation
```
Trigger: Manual / monthly
Process:
  totalRevenue = SUM(Order.totalRevenue) for hoan_thanh + dang_giao
  paidRevenue  = SUM(Payment.amount)
  AR           = totalRevenue - paidRevenue
  Check: AR matches finance.receivables sum
```

### Material Reconciliation
```
Trigger: Manual / monthly
Process:
  Expected = startStock + SUM(import transactions) - SUM(export transactions)
  Actual   = Material.currentStock
  Variance = Expected - Actual
  Source:  MaterialTransactionItem
```

### AI Constraint
**NEVER modify reconciliation source tables** (MaterialTransaction, Payment, RollScanHistory) to "fix" discrepancies. Always create offsetting/correction records.
