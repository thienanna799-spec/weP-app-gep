# Reports Domain – Skill Map

## What This Domain Does
Aggregates cross-domain data into business intelligence reports with date-range filtering, period comparisons, and Excel exports. Reports are cached in-memory to reduce DB load.

## Report Types

| Report | Endpoint | Cache TTL | Data Source |
|--------|---------|----------|------------|
| Summary (KPIs) | GET /reports/summary | 5 min (HOT) | ProductRoll, Order, ShippingOrder, Material |
| Production | GET /reports/production | 1 hr | ProductRoll, ProductionOrder |
| Materials | GET /reports/materials | 1 hr | MaterialTransaction, MaterialBOM |
| Inventory | GET /reports/inventory | 1 hr | ProductRoll (status=trong_kho) |
| Delivery | GET /reports/delivery | 1 hr | ShippingOrder, DeliveryLog |
| Customers | GET /reports/customers | 1 hr | Order grouped by customer |
| Finance | GET /finance/summary | (no cache) | Order, Payment, FuelLog, MaterialTransaction |

## Common Query Params

```
?from=2026-01-01    Date range start (default: -30 days)
?to=2026-12-31      Date range end (default: today 23:59:59)
?machine=MACHINE-A  Production machine filter
?productType=BWP    Product type filter
?customerId=xxx     Customer-specific filter
?driverId=xxx       Driver-specific filter
```

## Summary Report KPIs

```typescript
{
  production:    { current, previous, change% }  // Rolls produced
  orders:        { current, previous, change% }  // Order count
  inventory:     number                           // Current trong_kho count
  activeDeliveries: number                        // dang_giao + da_ban_giao_tai_xe
  alerts: [
    { type: 'material', message, severity: 'warning' }  // Low stock
    { type: 'deadline', message, severity: 'warning' }  // Orders near deadline (<2 days)
    { type: 'delivery', message, severity: 'danger' }   // High fail rate (>10%)
    { type: 'slowstock', message, severity: 'warning' } // Rolls >30 days in warehouse
    { type: 'capacity', message, severity: 'danger' }   // Warehouse >100% capacity
  ]
}
```

## Alert Generation Logic

```typescript
// Summary report auto-generates operational alerts:
lowStockCount > 0              → 'material' warning
ordersNearDeadline > 0         → 'deadline' warning  
failedDeliveries/total > 0.1   → 'delivery' danger
slowRolls > 10                 → 'slowstock' warning
inventoryCount > WAREHOUSE_CAPACITY → 'capacity' danger

WAREHOUSE_CAPACITY = 500  // ⚠️ hardcoded – should be in SystemConfig
```

## Cache Architecture

```
In-memory Map: report:{type}:{filters_hash} → { data, expiresAt }

HOT (5min):  summary
COLD (1hr):  production, materials, inventory, delivery, customers

Invalidation:
  'order_updated'     → clear: summary, customers, delivery
  'inventory_updated' → clear: summary, inventory, production, materials
  'shipping_updated'  → clear: summary, delivery
  'production_updated'→ clear: summary, production, materials
  unknown event       → clear ALL
```

## Export Endpoints

```
GET /reports/export/production   → JSON (convertible to Excel by frontend)
GET /reports/export/inventory
GET /reports/export/materials
GET /reports/export/delivery
GET /reports/export/customers
```

Response: `{ data: [...], fileName: "bao_cao_san_xuat", total: 123 }`

## Filter Options Endpoint

```
GET /reports/filters
  → { machines[], products[], customers[], drivers[] }
```
Used to populate filter dropdowns in reports UI.

## Permissions

| Action | Roles |
|--------|-------|
| View all reports | super_admin, admin, staff |
| Export reports | super_admin, admin, staff |

## Gaps

| Gap | Impact |
|-----|--------|
| `WAREHOUSE_CAPACITY = 500` hardcoded | Incorrect alerts if warehouse size changes |
| No finance report endpoint | Finance data not in unified reports |
| No driver cost report | Fuel + maintenance not in reports |
| Cache is in-memory | Lost on server restart → cold start performance |
| No report scheduling | Cannot email reports automatically |
