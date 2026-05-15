# Dashboard Domain – Realtime Architecture

## How Dashboard Stays Live

```
User opens Dashboard
  ↓
1. Initial load: GET /reports/summary
   → Cache hit (5min TTL): immediate response
   → Cache miss: DB query + set cache

2. Socket.IO connection established (useSocket hook)
   Transport: polling (Cloudflare-compatible)
   Reconnect: automatic (exponential backoff)

3. Server-side event fires (order_updated, inventory_updated, shipping_updated)
   → report-cache.ts: invalidate 'summary' cache
   → Event broadcast to all clients

4. Dashboard client receives event
   → useSocket triggers refetch callback
   → GET /reports/summary (cache miss = fresh query)
   → UI updates with new KPI values
```

## useSocket Integration (Frontend)

```typescript
// src/hooks/useSocket.ts
useSocket({
  onOrderUpdate:      () => refetchSummary(),  // order status change
  onInventoryUpdate:  () => refetchSummary(),  // roll moved to/from stock
  onShippingUpdate:   () => refetchSummary(),  // delivery status change
  // Missing: onProductionOrderUpdate, onMaterialStockChange
});
```

## Alert Polling

Dashboard alerts (low stock, near deadline, etc.) are:
- Recalculated on every `GET /reports/summary` call
- Not pushed proactively by server
- Refreshed when socket events trigger summary refetch

## What Breaks Real-time Accuracy

| Missing Event | Impact on Dashboard |
|--------------|-------------------|
| `production_order_updated` | Production KPIs stale after status change |
| `material_stock_changed` | Low stock alerts delayed until next event |
| `payment_received` | Finance data not reflected |

## Refresh Intervals (No Polling – Event-driven only)

Dashboard does NOT poll on a timer.
Updates only when:
1. User manually refreshes page
2. Socket.IO event received and processed

## Socket Connection Debug

```typescript
// How to check connection in browser:
// Open DevTools → Network → WS or XHR tab
// Look for: /socket.io/?EIO=4&transport=polling

// Client connects successfully:
// socket.connected === true
// socket.id !== null
```

## Future: Push Alerts

Recommended enhancement:
```typescript
// Server: detect conditions and push without client requesting
if (lowStockCount > 0) {
  io.emit('dashboard_alert', {
    type: 'low_stock',
    count: lowStockCount,
    severity: 'warning'
  });
}
```
Currently: alerts are pull-based (computed on GET), not push-based.
