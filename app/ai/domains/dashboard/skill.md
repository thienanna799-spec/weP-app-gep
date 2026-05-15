# Dashboard Domain – Skill Map

## What This Domain Does
The dashboard is the **entry point** for GEP users. It displays live KPIs, operational alerts, and cross-domain summaries updated via Socket.IO + report cache.

## Data Source
Dashboard consumes `GET /reports/summary` – a single aggregated endpoint with 5-minute HOT cache.

## KPI Cards

| KPI | Data | Update Frequency |
|-----|------|-----------------|
| Rolls Produced (period) | ProductRoll count (non-defective) | Every 5 min |
| Order Count (period) | Order count | Every 5 min |
| Current Inventory | ProductRoll count (trong_kho) | Every 5 min |
| Active Deliveries | ShippingOrder (dang_giao + da_ban_giao) | Every 5 min |
| % Change vs prev period | Computed comparison | Every 5 min |

## Operational Alerts

Auto-generated alerts displayed as cards:

| Alert | Trigger | Severity |
|-------|---------|---------|
| Low stock | Material currentStock ≤ minStock | warning |
| Orders near deadline | Delivery deadline < 2 days | warning |
| High delivery failure | Fail rate > 10% | danger |
| Slow-moving stock | Rolls in warehouse > 30 days | warning |
| Warehouse capacity | Roll count > 500 (hardcoded) | danger |

## Real-time Architecture

```
User opens dashboard
  → GET /reports/summary (check cache)
    → if cache hit → return immediately
    → if cache miss → query DB + set cache
  → Subscribe to Socket.IO events
    → 'order_updated'     → refetch summary (cache invalidated by event)
    → 'inventory_updated' → refetch summary
    → 'shipping_updated'  → refetch summary
```

No WebSocket push for dashboard – UI polls on event trigger.

## Dashboard Permissions

Dashboard visible to: `super_admin`, `admin`, `staff`
Each role sees same data (no role-based KPI filtering).

## Socket.IO Integration

```typescript
// Dashboard listens via useSocket()
useSocket({
  onOrderUpdate:     () => refetchSummary(),
  onInventoryUpdate: () => refetchSummary(),
  onShippingUpdate:  () => refetchSummary(),
});
```

When any event fires → cache was already invalidated server-side → next fetch gets fresh data.

## Missing Dashboard Features (Gaps)

| Gap | Value |
|-----|-------|
| No revenue KPI card | Can't see financial health at a glance |
| No overdue payments alert | Finance blindspot on dashboard |
| No driver availability widget | Logistics blindspot |
| No pending approvals counter | Admin workload not visible |
| No real-time roll from production | Production progress not on dashboard |
| Warehouse capacity hardcoded at 500 | Incorrect capacity alerts |
