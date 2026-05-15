# ADR-005: Audit Log Immutability

**Date:** 2026-05-10
**Status:** PARTIALLY IMPLEMENTED
**Deciders:** Engineering team

---

## Context

GEP requires audit trails for business-critical operations: order approvals, payment recordings, driver fraud detection, stock movements, and user actions.

## Problem

How to ensure audit records cannot be tampered with, deleted, or retroactively modified?

## Decision

**Implemented:** Append-only audit log pattern for all critical logs.

**Audit log models are:**
- Never exposed to DELETE endpoints
- Never updated (except `reviewStatus` on OcrAuditLog – deliberate exception)
- Always created alongside the business event

```typescript
// Pattern: create log atomically with the business event
await prisma.orderLog.create({
  data: {
    orderId,
    action: 'approved',
    oldValue: 'cho_duyet',
    newValue: 'da_duyet',
    createdBy: req.user!.uid,
    createdAt: new Date(),
  }
});
```

## Immutable Log Models

| Model | Mutable Fields | Immutable? |
|-------|---------------|-----------|
| `OrderLog` | None | ✅ Fully immutable |
| `PurchaseOrderLog` | None | ✅ Fully immutable |
| `RollScanHistory` | None | ✅ Fully immutable |
| `RollMovement` | None | ✅ Fully immutable |
| `DeliveryLog` | None | ✅ Fully immutable |
| `ContactLog` | None | ✅ Fully immutable |
| `OcrAuditLog` | `reviewStatus`, `auditTaskId` | ⚠️ Partially mutable (by design) |
| `NotificationLog` | None | ✅ Fully immutable |
| `UserLoginLog` | None | ✅ Fully immutable |
| `UserActivityLog` | None | ✅ Fully immutable |
| `CustomerActivity` | None | ✅ Fully immutable |

## Why OcrAuditLog is Partially Mutable

The fraud review process requires admins to record their review decision:
```typescript
// Admin updates review status – acceptable mutability
PATCH /ocr-audit/:id/review { reviewStatus: 'approved' | 'rejected' }
```

The **core audit data** (extractedValue, declaredValue, fraudReason, rawOcrText) remains immutable. Only the human review decision is mutable.

## Current Gaps (Missing Audit Logs)

| Action | Missing Log | Risk |
|--------|------------|------|
| Payment created | No `PaymentLog` | Financial audit gap |
| Material stock changed | No `MaterialLog` | Inventory audit gap |
| Permission matrix changed | No log | Security audit gap |
| Customer deleted | No tombstone | Data loss invisible |

## Rules for AI

1. **NEVER add a DELETE endpoint for any audit log model**
2. **NEVER remove the log creation** from a P0/P1 controller
3. **OcrAuditLog reviewStatus** is the ONLY allowed update on an audit log
4. **If a correction is needed** in an audit log: add a correction entry, do NOT modify the original

## Future Enhancement

For regulated environments, consider:
- Database-level row protection (MySQL row-level security)
- Immutable log streaming to external SIEM
- Cryptographic hash chaining (each log entry hashes previous entry)
