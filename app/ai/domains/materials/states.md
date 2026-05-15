# Materials Domain – States

## Material Stock Status

Auto-calculated based on quantity thresholds:

```
currentStock > minStock      → con_hang   (In stock ✅)
0 < currentStock ≤ minStock  → sap_het    (Low stock ⚠️)
currentStock = 0             → het_hang   (Out of stock 🔴)
manual override              → ngung_dung (Discontinued ⛔)
```

State is stored on `Material.status` and updated on every transaction.

## Material Transaction Types

```
import   ← Stock in (purchase from supplier, return from production)
export   ← Stock out (consumption in production, write-off)
```

No status on transactions – they are immutable records.

## BOM Component Status

No status field. BOM components can be:
- Present → used in production planning
- Absent → material not required for this product

Delete and recreate to change BOM structure.

## Material Groups (Classification, No State)

Free-text `group` field on Material.
Common values: "Nguyên liệu chính", "Vật tư phụ", "Bao bì"
No workflow – purely organizational.

## Low Stock Alert States

```
Normal:  currentStock > minStock → no alert needed
Warning: currentStock <= minStock → appears in GET /materials/low-stock
Critical: currentStock = 0 → het_hang, blocks production
```

Alert is informational. No automatic block on production order creation when material is het_hang (gap – production orders can be created even with no stock).
