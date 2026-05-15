# Shipping Domain – States

> See full diagram in `ai/shared/status-flows.md`

## ShippingOrder Status

| Status | Vietnamese | Meaning |
|--------|-----------|---------|
| `cho_xuat_kho` | Chờ xuất kho | Created, waiting for warehouse to prep rolls |
| `dang_chuan_bi` | Đang chuẩn bị | Warehouse scanning rolls into shipment |
| `da_xuat_kho` | Đã xuất kho | All rolls scanned, ready at dock |
| `da_ban_giao_tai_xe` | Đã bàn giao tài xế | Driver assigned and confirmed |
| `dang_giao` | Đang giao | Driver in transit |
| `giao_thanh_cong` | Giao thành công | Delivered ✅ (terminal) |
| `giao_that_bai` | Giao thất bại | Delivery failed ❌ |
| `hoan_tra` | Hoàn trả | Goods returned after failed delivery (terminal) |

## ShippingOrderItem Status

```
(on scan)  → "exported"   ← Roll scanned into shipment
(on return)→ "returned"   ← Roll returned from failed delivery
```

## DeliveryLog Actions (Append-Only Timeline)

```
picked_up          ← Driver confirms pickup from warehouse
delivered          ← Successful delivery (requires photo + signature)
failed             ← Delivery attempt failed (requires reason + note)
contacted_customer ← Driver logged call/contact attempt
rescheduled        ← Delivery rescheduled (if supported)
```

## Return States

After `giao_that_bai`:
```
ReturnRequest.status:
  pending   ← Created, awaiting admin review
  approved  ← Admin approved return
  processing← Return being processed
  resolved  ← Resolution applied (refund/reship/exchange)
  rejected  ← Return request rejected
```

Resolution types: `refund | reship | exchange | cancel`
