# OpenClaw Policy: Audit Policy

> Rules governing audit log creation and immutability in GEP ERP.
> **Source:** ADR-005, ai/system/audit-policy.md, ai/domains/admin/audit-policy.md

---

## Core Rule

```
Every mutation in a P0/P1 domain MUST produce an immutable audit record.
Audit logs are APPEND-ONLY.
No audit record may ever be modified or deleted.
```

---

## Audit Log Registry

| Domain | Log Model | Trigger | Created by |
|--------|-----------|---------|-----------|
| orders | `OrderLog` | Every Order status change, creation, approval | orders controller |
| shipping | `DeliveryLog` | Every ShippingOrder action, GPS log | shipping controller |
| drivers | `OcrAuditLog` | Every OCR result processed | ocr-webhook controller |
| inventory | `RollScanHistory` | Every QR scan (production, stock, pick, ship) | production/inventory controller |
| finance | `NotificationLog` | Every Telegram message sent | telegram service |
| admin | `UserActivityLog` | Admin actions on users | admin controller |
| admin | `UserLoginLog` | Every login event | auth controller |
| procurement | `PurchaseOrderLog` | Every PO status change | procurement controller |
| system | `SystemLog` | System config changes | admin controller |

---

## Immutability Rules

### ✅ CORRECT operations on audit logs:
```typescript
// Only CREATE is allowed
await prisma.orderLog.create({
  data: {
    orderId,
    action: 'approved',
    userId: req.userId,
    note: req.body.note ?? '',
    createdAt: new Date(),
  },
});
```

### ❌ FORBIDDEN operations:
```typescript
// NEVER update
await prisma.orderLog.update({ where: { id }, data: { note: 'changed' } }); // ❌

// NEVER delete
await prisma.orderLog.delete({ where: { id } }); // ❌
await prisma.orderLog.deleteMany({ where: { orderId } }); // ❌

// NEVER upsert (creates fake update path)
await prisma.orderLog.upsert({ ... }); // ❌
```

---

## Audit Log Data Requirements

### OrderLog (mandatory fields):
```typescript
{
  orderId: string;        // Required: which order
  action: string;         // Required: what happened (approved, rejected, completed, ...)
  userId: string;         // Required: who did it (Firebase UID)
  note: string;           // Required: human-readable note (may be empty string)
  previousStatus?: string;// Recommended: status before change
  newStatus?: string;     // Recommended: status after change
  createdAt: DateTime;    // Auto-generated
}
```

### DeliveryLog (mandatory fields):
```typescript
{
  shippingOrderId: string;  // Required
  action: string;           // Required: picked_up, delivered, failed, returned, ...
  driverId?: string;        // When driver involved
  note: string;             // Required
  photoUrl?: string;        // When photo proof provided
  latitude?: float;         // When GPS involved
  longitude?: float;
  createdAt: DateTime;
}
```

### OcrAuditLog (mandatory fields):
```typescript
{
  referenceId: string;    // UNIQUE: prevents duplicate OCR processing
  fuelLogId?: string;     // When fuel log
  repairLogId?: string;   // When repair log
  declaredValue: int;     // What driver declared (VND)
  extractedValue: int;    // What OCR extracted (VND)
  confidence: float;      // OCR confidence score
  status: string;         // matched, suspicious, fraud_detected, pending_review
  reviewedBy?: string;    // Admin UID who reviewed
  rawOcrText: string;     // Original OCR response (immutable)
}
```

---

## When to Create Audit Logs

### Order lifecycle:
```typescript
// EVERY status change → OrderLog
const transitions = {
  'cho_duyet': 'created',
  'da_duyet': 'approved',
  'dang_san_xuat': 'production_started',
  'cho_xuat_kho': 'ready_to_ship',
  'dang_giao': 'delivery_started',
  'hoan_thanh': 'completed',
  'huy': 'cancelled',
};
// Each transition creates ONE OrderLog entry
```

### Rejection / cancellation:
```typescript
// Include reason in note field
await prisma.orderLog.create({
  data: {
    orderId,
    action: 'rejected',
    userId: req.userId,
    note: `Rejected: ${req.body.reason}`,
    previousStatus: currentStatus,
    newStatus: 'cho_duyet',
  },
});
```

---

## Audit Log Query Patterns

### Get order history:
```typescript
const history = await prisma.orderLog.findMany({
  where: { orderId },
  orderBy: { createdAt: 'asc' },
  include: { user: { select: { name: true, role: true } } },
});
```

### Get recent admin actions:
```typescript
const actions = await prisma.userActivityLog.findMany({
  where: { createdAt: { gte: startOfDay } },
  orderBy: { createdAt: 'desc' },
  take: 100,
});
```

---

## Audit Log Retention Policy

| Log Model | Retention | Storage Strategy |
|-----------|-----------|-----------------|
| OrderLog | Permanent | Never delete |
| DeliveryLog | Permanent | Never delete |
| OcrAuditLog | Permanent | Never delete |
| RollScanHistory | Permanent | Never delete |
| UserActivityLog | 1 year | Archive after 1 year |
| UserLoginLog | 90 days | Can purge old entries |
| NotificationLog | 30 days | Can purge old entries |
| PurchaseOrderLog | Permanent | Never delete |

---

## Audit Gaps (Known Issues)

| Gap | Impact | Priority |
|-----|--------|---------|
| Admin permission changes not always logged | Cannot audit who changed what permission | P1 |
| Frontend writes UserActivityLog directly (trust issue) | Data can be fabricated | P1 |
| No audit log for SystemConfig changes | Cannot track config history | P2 |
| PaymentLog model not yet in schema | Payment history only via Payment records | P1 |
