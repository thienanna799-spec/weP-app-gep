# Build Prompt – Shipping Domain

> Load this file as AI context before building any Shipping or Delivery feature.

## 1. Domain Memory (Read First)

```
ai/domains/shipping/skill.md        ← Models, APIs, DeliveryLog, GPS
ai/domains/shipping/workflow.md     ← 6-step delivery workflow
ai/domains/shipping/states.md       ← ShippingOrder status machine
ai/domains/shipping/permissions.md  ← Role matrix, APK access
ai/shared/status-flows.md          ← Full state machine diagrams
ai/shared/qr-flow.md               ← Roll QR from production to delivery
```

## 2. Governance

```
Domain criticality: P1 – Operational Critical
Governance level:   🟠 GUARDED
Reference:          ai/system/ai-execution-governance.md
                    ai/system/critical-workflows.md (WORKFLOW-002)
```

## 3. Mandatory Rules When Building

```
✅ ALWAYS use Prisma $transaction for delivery completion (Order + ShippingOrder atomic)
✅ ALWAYS create DeliveryLog entry (append-only) for every delivery action
✅ ALWAYS emit io.emit('shipping_updated', ...) after every status change
✅ ALWAYS emit io.emit('order_updated', ...) when order completes due to delivery
✅ ALWAYS validate driver is assigned before advancing to dang_giao

❌ NEVER update or delete existing DeliveryLog entries (append-only)
❌ NEVER mark Order as hoan_thanh without linking to giao_thanh_cong ShippingOrder
❌ NEVER suppress shipping_updated events
❌ NEVER allow delivery complete without confirmation photo/signature (business rule)
```

## 4. Delivery Completion Pattern (Atomic)

```typescript
// ✅ CORRECT: Delivery success must atomically update both Order and ShippingOrder
await prisma.$transaction([
  prisma.shippingOrder.update({
    where: { id: shippingOrderId },
    data: { status: 'giao_thanh_cong', deliveredAt: new Date() }
  }),
  prisma.order.update({
    where: { id: shippingOrder.orderId },
    data: { status: 'hoan_thanh' }
  }),
  prisma.orderLog.create({
    data: {
      orderId: shippingOrder.orderId,
      action: 'completed',
      note: 'Giao hàng thành công',
      createdBy: req.user!.uid,
      createdByName: req.user!.name,
    }
  }),
]);

// Then emit (after transaction success):
io.emit('shipping_updated', { shippingOrderId, status: 'giao_thanh_cong' });
io.emit('order_updated', { orderId: shippingOrder.orderId, status: 'hoan_thanh' });
```

## 5. Delivery Log Pattern (Append-Only)

```typescript
// ✅ CORRECT: Always append, never update
await prisma.deliveryLog.create({
  data: {
    shippingOrderId,
    action,          // 'picked_up' | 'delivered' | 'failed' | 'contacted_customer'
    note,
    imageUrl,        // optional proof photo
    latitude, longitude,
    createdBy: req.user!.uid,
    createdAt: new Date()
  }
});
// NEVER: prisma.deliveryLog.update(...)
```

## 6. Cross-Domain Impacts to Check

| Change | Domains Affected |
|--------|----------------|
| Delivery success | orders (hoan_thanh), inventory (da_xuat_kho confirmed), reports |
| Delivery failed + return | orders (status), inventory (hoan_tra), finance (AR still outstanding) |
| Driver assigned | drivers (status → delivering), vehicles |
| Roll scanned into shipment | inventory (da_xuat_kho) |

## 7. Post-Build Checklist

```markdown
- [ ] Delivery completion wrapped in $transaction (ShippingOrder + Order)?
- [ ] DeliveryLog created for every action (append-only)?
- [ ] shipping_updated event emitted after every status change?
- [ ] order_updated event emitted on delivery complete?
- [ ] Driver availability validated before assignment?
- [ ] ReturnRequest auto-created on giao_that_bai?
- [ ] ProductRoll statuses updated to hoan_tra on return?
- [ ] states.md updated if new status added?
```
