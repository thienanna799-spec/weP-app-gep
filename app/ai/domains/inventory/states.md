# Inventory Domain – States

> See `ai/shared/status-flows.md` for full roll status machine.

## ProductRoll Status

| Status | Vietnamese | In Warehouse? | Can Be Ordered? |
|--------|-----------|:-------------:|:---------------:|
| `dang_san_xuat` | Đang sản xuất | ❌ | ❌ |
| `trong_kho` | Trong kho | ✅ | ✅ |
| `da_giu_cho_don` | Đã giữ cho đơn | ✅ | ❌ (reserved) |
| `da_xuat_kho` | Đã xuất kho | ❌ | ❌ |
| `loi_hong` | Lỗi / Hỏng | ❌ | ❌ |
| `hoan_tra` | Hoàn trả | ❓ | ❓ (needs processing) |

## Valid Transitions

```
dang_san_xuat
  → trong_kho      [scan-to-stock]
  → loi_hong       [mark defective]

trong_kho
  → da_giu_cho_don [pick for order]
  → loi_hong       [damage found in warehouse]
  → da_xuat_kho    [direct ship without order, rare]

da_giu_cho_don
  → da_xuat_kho    [shipped out]
  → trong_kho      [order cancelled, roll released]

da_xuat_kho
  → hoan_tra       [customer return]
  (terminal otherwise)

loi_hong  → (terminal)
hoan_tra  → (manual processing required)
```

## ImportBatch Status (Manual Stock)

No status field – ImportBatch is a parent grouping record.
Completion implied when all rolls scanned.

## Stocktake Status

```
draft       ← Created, scanning in progress
completed   ← Reconciliation done
cancelled   ← Aborted
```

## StocktakeItem Status

```
matched   ← Roll found, matches expected
missing   ← Expected but not scanned (lost/stolen?)
surplus   ← Scanned but not expected (unregistered?)
```

## InternalTransfer Status

```
pending    ← Initiated but not confirmed
completed  ← Transfer done, positions updated
cancelled  ← Aborted
```

## Storage Capacity Analytics

Computed fields (not stored):
```
currentOccupancy = COUNT(rolls where status='trong_kho')
capacityThreshold = 500 (hardcoded in reports.controller.ts)
utilizationPercent = (currentOccupancy / 500) * 100
```
