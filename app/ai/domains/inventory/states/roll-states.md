# Inventory Domain — States

**Last updated:** 2026-05-12

## ProductRoll Status Machine

```
[Nhập kho]
    ↓
 cho_cat ──────────────────→ loi_hong (TERMINAL ♦)
    ↓
 dang_cat ─────────────────→ loi_hong (TERMINAL ♦)
    ↓
 da_cat
    ↓
 da_giao (via order pick)
    ↓
 [COMPLETED — out of active inventory]
```

### State Descriptions
| State | Vietnamese | Meaning | Terminal? |
|---|---|---|---|
| `cho_cat` | Chờ cắt | Waiting to be cut | No |
| `dang_cat` | Đang cắt | Being cut | No |
| `da_cat` | Đã cắt | Cut, ready for order | No |
| `da_giao` | Đã giao | Delivered to order | No |
| `loi_hong` | Lỗi hỏng | Damaged/defective | **YES** |

## ImportBatch Status
| State | Meaning |
|---|---|
| `pending` | Uploaded, awaiting sync |
| `processing` | Sync in progress |
| `completed` | Fully synced |
| `failed` | Sync failed — check errors |

## Stock Sync States (StockSync entity)
| State | Meaning |
|---|---|
| `pending` | File uploaded |
| `completed` | Stock quantities updated |
| `failed` | Error in processing |
