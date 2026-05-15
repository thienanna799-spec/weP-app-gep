# Orders – Full Business Workflow

## Happy Path (Standard Flow)

```
Step 1: CREATE
  Staff creates order (status: nhap)
  → Selects customer or enters walk-in info
  → Adds line items (product + quantity + unit price)
  → Sets priority and delivery deadline
  → Saves as draft

Step 2: SUBMIT FOR APPROVAL
  Staff submits: status → cho_duyet
  → OrderLog entry: "submitted"

Step 3: APPROVE
  Admin reviews order
  → Approves: status → da_duyet, approvedBy = admin uid
  → OrderLog entry: "approved"
  → (Trigger) Staff creates production order if no stock

Step 4: PREPARE GOODS (dang_chuan_bi)
  Warehouse staff picks rolls from inventory:
  → POST /orders/:id/pick-roll { qrCode }
  → Roll status: trong_kho → da_giu_cho_don
  → When all rolls picked, status → cho_xuat_kho

Step 5: CREATE SHIPPING ORDER
  Admin/staff creates shipping order:
  → POST /shipping { orderId }
  → ShippingOrder.status: cho_xuat_kho

Step 6: ASSIGN DRIVER
  Admin assigns driver to shipping:
  → PUT /shipping/:id/assign-driver { driverId }
  → ShippingOrder.status → da_ban_giao_tai_xe

Step 7: DELIVERY
  Driver picks up goods:
  → POST /shipping/:id/delivery-log { action: "picked_up" }
  → ShippingOrder.status → dang_giao
  → Order.status → dang_giao

  Driver delivers:
  → POST /shipping/:id/delivery-log { action: "delivered", imageUrl, signatureUrl }
  → POST /orders/:id/complete-delivery
  → ShippingOrder.status → giao_thanh_cong
  → Order.status → hoan_thanh
  → Roll.status → da_xuat_kho

Step 8: PAYMENT
  Finance records payment:
  → POST /finance/payments { orderId, amount, method }
  → Order.paymentStatus updated
```

## Exception Paths

### Rejected Order
```
cho_duyet → tu_choi (admin rejects with reason)
  → OrderLog entry: "rejected", note: reason
  → Staff can edit and resubmit (status back to nhap)
```

### Failed Delivery
```
dang_giao → giao_that_bai
  → POST /orders/:id/fail-delivery { reason }
  → Driver logs contact attempts in ContactLog
  → ReturnRequest created
  → Resolution: reship (new ShippingOrder) | refund | cancel
```

### Cancelled Order
```
Any status → huy
  → PUT /orders/:id/cancel
  → Any reserved rolls: status back to trong_kho
  → Any shipping order: cancelled
```

## Key Socket.IO Events

After every order mutation:
```typescript
io.emit('order_updated', { orderId, status, type: 'status_change' })
```

## Realtime Impact

`order_updated` clears:
- `summary` cache (dashboard KPIs)
- `customers` report cache
- `delivery` report cache
