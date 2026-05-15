# Status Flows – All Domain State Machines

## 1. Order Status (`order_status`)

```
                    ┌─────────────────────────┐
                    │         nhap            │  (Draft)
                    │     (initial state)     │
                    └────────────┬────────────┘
                                 │ staff submits
                                 ▼
                    ┌─────────────────────────┐
                    │      cho_duyet          │  (Pending Approval)
                    └────────┬────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │ admin approves              │ admin rejects
              ▼                             ▼
   ┌─────────────────────┐      ┌─────────────────────┐
   │     da_duyet        │      │      tu_choi         │ (end)
   └──────────┬──────────┘      └─────────────────────┘
              │
              ▼
   ┌─────────────────────┐
   │  dang_chuan_bi      │  (Preparing goods)
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │   cho_xuat_kho      │  (Waiting for warehouse)
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │     dang_giao       │  (In delivery)
   └──────────┬──────────┘
              │
   ┌──────────┴──────────┐
   │                     │
   ▼                     ▼
┌──────────┐        ┌─────────┐
│hoan_thanh│        │   huy   │  (Cancelled)
│ (Done)   │        └─────────┘
└──────────┘
```

**Valid Transitions**:
- `nhap` → `cho_duyet` (staff submits)
- `cho_duyet` → `da_duyet` (admin approves)
- `cho_duyet` → `tu_choi` (admin rejects)
- `da_duyet` → `dang_chuan_bi` (auto or manual when production starts)
- `dang_chuan_bi` → `cho_xuat_kho` (rolls picked)
- `cho_xuat_kho` → `dang_giao` (driver picks up)
- `dang_giao` → `hoan_thanh` (delivery confirmed)
- Any → `huy` (cancelled by admin/staff)

---

## 2. Production Order Status (`production_order_status`)

```
waiting_material → ready → producing → completed
                                    ↘
                                     cancelled
```

| Status | Meaning | Next |
|--------|---------|------|
| `waiting_material` | Materials not yet available | → ready |
| `ready` | Materials confirmed ready | → producing |
| `producing` | Active manufacturing | → completed |
| `completed` | All rolls produced | end |
| `cancelled` | Aborted | end |

---

## 3. Roll Status (`roll_status`)

```
dang_san_xuat → trong_kho → da_giu_cho_don → da_xuat_kho
     │                           │
     │                           └→ hoan_tra
     └→ loi_hong
```

| Status | Vietnamese | Trigger |
|--------|-----------|---------|
| `dang_san_xuat` | Đang sản xuất | Roll created during production |
| `trong_kho` | Trong kho | QR scan-to-stock completed |
| `da_giu_cho_don` | Đã giữ cho đơn hàng | Roll assigned to an order |
| `da_xuat_kho` | Đã xuất kho | Shipped out |
| `loi_hong` | Lỗi / Hỏng | Marked defective |
| `hoan_tra` | Hoàn trả | Returned by customer |

---

## 4. Shipping Status (`shipping_status`)

```
cho_xuat_kho
    → dang_chuan_bi
    → da_xuat_kho
    → da_ban_giao_tai_xe
    → dang_giao
    → giao_thanh_cong  (end ✅)
    → giao_that_bai    → hoan_tra (end ❌)
```

---

## 5. Driver Status (`driver_status`)

```
available → delivering → available
    │
    └→ leave
    └→ inactive
    └→ blocked
```

---

## 6. Vehicle Status (`vehicle_status`)

```
available → in_use → available
    │
    └→ maintenance
    └→ broken
    └→ inactive
```

---

## 7. Material Status (`material_status`)

Auto-calculated based on `currentStock` vs `minStock`:
```
currentStock > minStock    → con_hang  (In stock)
currentStock ≤ minStock    → sap_het   (Low stock)
currentStock = 0           → het_hang  (Out of stock)
manually set               → ngung_dung (Discontinued)
```

---

## 8. Purchase Order Status (`purchase_order_status`)

```
draft → pending_approval → approved → ordered → partially_received → received
                        ↘
                         cancelled (from any state)
```

---

## 9. Return Request Status

```
pending → approved → processing → resolved
       ↘
        rejected
```
Resolution types: `refund` | `reship` | `exchange` | `cancel`

---

## 10. Payment Status (Order)

```
chua_thanh_toan → thanh_toan_mot_phan → da_thanh_toan
```
Stored as string field on Order model (not enum). Updated via `PUT /orders/:id/payment-status`.

---

## 11. OCR Audit Pipeline Status

```
queued → processing → parsed → audited → (done)
                  ↘
                   failed
```
Review status: `pending` → `approved` | `rejected` | `escalated`
