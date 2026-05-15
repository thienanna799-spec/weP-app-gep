# Approval Rules – Cross-Domain

## 1. Order Approval

| Action | Who Can | Route |
|--------|---------|-------|
| Submit order (draft → pending) | staff, admin, super_admin | PUT /orders/:id (status change) |
| Approve order | admin, super_admin | PUT /orders/:id/approve |
| Reject order | admin, super_admin | PUT /orders/:id/reject |
| Cancel order | staff (own), admin, super_admin | PUT /orders/:id/cancel |

**Business rules**:
- Orders with `priority = khan_cap` should be approved same day
- Rejected orders can be re-edited and resubmitted
- Approved orders generate production orders automatically if no stock

---

## 2. Purchase Order Approval

```
draft
  → pending_approval  (staff submits via PUT /purchase-orders/:id/submit)
  → approved          (admin approves via PUT /purchase-orders/:id/approve)
  → ordered           (admin marks as ordered via PUT /purchase-orders/:id/order)
  → partially_received → received  (admin confirms receipt)
```

| Action | Who Can |
|--------|---------|
| Create | admin, super_admin |
| Submit for approval | admin, super_admin |
| Approve | admin, super_admin |
| Mark as ordered | admin, super_admin |
| Receive | admin, super_admin |
| Cancel | admin, super_admin |
| Delete | super_admin |

---

## 3. Return Request Approval

```
pending → approved → processing → resolved
       → rejected
```

| Action | Who Can |
|--------|---------|
| Create return | admin, super_admin |
| Approve return | admin, super_admin |
| Reject return | admin, super_admin |
| Resolve return | admin, super_admin |

Resolution options: `refund` | `reship` | `exchange` | `cancel`

---

## 4. Vehicle Maintenance Approval

```
pending → approved → (maintenance done)
        → rejected
```

Stored in `VehicleMaintenance.status` as string. No dedicated approval endpoint yet — managed manually via update.

---

## 5. Driver Document OCR Review

```
pending → approved   (OCR matches, no fraud detected)
        → rejected   (OCR detects fraud/mismatch)
        → escalated  (human review needed)
```

| Action | Who Can | Route |
|--------|---------|-------|
| Review OCR audit | admin, super_admin | PATCH /ocr-audit/:id/review |

---

## 6. User Role Assignment

Only super_admin can assign roles. Flow:
```
User registers (pending)
  → Admin sees pending user in admin panel
  → PUT /users/:uid/role { role: "staff" }
  → Socket.IO 'user_updated' fires
  → User's session updates without logout
```

---

## Approval Notification Pattern

When approval is needed, system should send Telegram notification. Currently implemented:
- ✅ Invoice sending via Telegram
- ✅ Debt alerts
- ✅ Low stock alerts
- ❌ Order approval request notification (missing)
- ❌ Purchase order approval notification (missing)
- ❌ Return request notification (missing)
