# Procurement Domain – Approval Rules

## Approval Chain

```
Staff creates PO (draft)
  ↓
Staff submits: PUT /purchase-orders/:id/submit
  → status: draft → pending_approval
  → PurchaseOrderLog: { action: 'submitted' }
  ⚠️ Gap: NO notification sent to approvers

Admin reviews PO:
  → GET /purchase-orders?status=pending_approval
  → Reviews items, quantities, supplier, expectedDate

Admin decision:
  ┌─ APPROVE: PUT /purchase-orders/:id/approve
  │   → status → approved
  │   → approvedBy, approvedByName, approvedAt set
  │   → PurchaseOrderLog: { action: 'approved' }
  │   ⚠️ Gap: No notification to requester
  │
  └─ REJECT: PUT /purchase-orders/:id { status: 'draft', notes: 'reason' }
      → Back to draft for revision
      → PurchaseOrderLog: { action: 'rejected', note: reason }
      ⚠️ Gap: No automatic notification to requester
```

## Who Can Approve

| Action | super_admin | admin | staff |
|--------|:-----------:|:-----:|:-----:|
| Create PO | ✅ | ✅ | ✅ |
| Submit PO | ✅ | ✅ | ✅ |
| Approve PO | ✅ | ✅ | ❌ |
| Reject PO | ✅ | ✅ | ❌ |
| Receive goods | ✅ | ✅ | ❌ |

## Approval Thresholds (Not Yet Implemented)

Currently: all POs require same single-level approval regardless of amount.

Recommended tiered approval:

| PO Value | Approver Required |
|---------|-----------------|
| < 5,000,000 VND | admin |
| 5,000,000 – 50,000,000 VND | admin + super_admin confirmation |
| > 50,000,000 VND | super_admin only |

> ⚠️ **Gap**: No amount-based approval routing currently exists.

## Notification Gap

Currently, approval events do NOT trigger:
- Telegram notification to approvers when PO submitted
- Telegram notification to requester when PO approved/rejected
- Email notification (no email system)

**Recommended additions:**
```typescript
// After submit:
await sendTelegramToAdmins(`PO ${po.code} cần duyệt: ${po.totalAmount.toLocaleString()} VND`);

// After approve:
await sendTelegramToUser(po.createdBy, `PO ${po.code} đã được duyệt`);

// After reject:
await sendTelegramToUser(po.createdBy, `PO ${po.code} bị từ chối: ${note}`);
```

## Self-Approval Prevention

```
⚠️ Gap: No code prevents:
  → Admin who creates PO from approving their own PO
  → Should add: if (po.createdBy === req.user.uid) return sendError(res, 'Cannot self-approve', 403)
```

## Emergency PO (Bypass Approval)

Currently: no bypass mechanism exists.
All POs must follow: draft → pending_approval → approved.

Recommended future: `POST /purchase-orders/:id/emergency-approve` for super_admin with reason logging.
