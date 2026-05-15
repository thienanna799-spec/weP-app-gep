# Procurement Domain – States

## PurchaseOrder Status Machine

```
draft
  │
  ├─ [submit] ──────────→ pending_approval
  │                              │
  │                    ┌─────────┴─────────┐
  │                 [approve]          [reject → back to draft]
  │                    │
  │                  approved
  │                    │
  │                 [order placed with supplier]
  │                    │
  │                  ordered
  │                    │
  │         ┌──────────┴──────────┐
  │   [partial receive]    [full receive]
  │         │                     │
  │  partially_received       received ✅ (terminal)
  │         │
  │   [remaining received]
  │         │
  │      received ✅
  │
  └─ [any state] ──→ cancelled ❌ (terminal)
```

## Status Values (DB Enum)

| Status | Vietnamese Label | Meaning |
|--------|-----------------|---------|
| `draft` | Nháp | Being prepared, not submitted |
| `pending_approval` | Chờ duyệt | Submitted, awaiting admin review |
| `approved` | Đã duyệt | Admin approved, ready to order |
| `ordered` | Đã đặt hàng | Supplier confirmed, goods on the way |
| `partially_received` | Nhận một phần | Some items received, awaiting rest |
| `received` | Đã nhận hàng | All items received ✅ |
| `cancelled` | Đã huỷ | Cancelled from any state ❌ |

## Allowed Transitions

```
draft           → pending_approval  (staff submits)
draft           → cancelled         (staff cancels)
pending_approval → approved         (admin approves)
pending_approval → draft            (admin rejects → back to edit)
pending_approval → cancelled        (admin cancels)
approved        → ordered           (admin marks placed with supplier)
approved        → cancelled         (admin cancels before ordering)
ordered         → partially_received (partial goods arrive)
ordered         → received          (all goods arrive)
ordered         → cancelled         (supplier cancels)
partially_received → received       (remaining goods arrive)
```

## PurchaseOrderItem – No Status

Items do not have a status field.
Tracking is via `receivedQty` vs `quantity`:
```
receivedQty = 0           → Not received yet
0 < receivedQty < quantity → Partially received
receivedQty >= quantity    → Fully received
```

## MaterialTransaction (Created on Receive)

When goods received:
```typescript
// type = 'import', for each received item
MaterialTransaction {
  type: 'import',
  referenceId: purchaseOrderId,
  supplierId,
  date: receivedDate,
  items: [{
    materialId, materialName,
    quantity: receivedQty,
    unitPrice: item.unitPrice
  }]
}
// Material.currentStock += receivedQty (atomic with transaction)
```

## PurchaseOrderLog Actions

```
created          ← PO first saved as draft
submitted        ← Submitted for approval
approved         ← Admin approved
rejected         ← Admin rejected (returns to draft)
ordered          ← Placed with supplier
received         ← All items received
partially_received ← Partial receive
cancelled        ← Cancelled
```

## Supplier Status

```
isActive: true  ← Active supplier (default)
isActive: false ← Deactivated (not shown in PO creation dropdown)
```

No workflow – admin sets manually. No soft-delete on Supplier.
