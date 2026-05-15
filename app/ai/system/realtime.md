# Real-time System – Socket.IO Architecture

## Overview

GEP uses **Socket.IO** for real-time synchronization across browser tabs and users.

- **Server**: `socket.io` on Express HTTP server (port 5000)
- **Client**: `socket.io-client` singleton in `src/hooks/useSocket.ts`
- **Transport**: Polling first, then upgrades to WebSocket
  - Polling-first is **required** for Cloudflare Tunnel compatibility

## Connection Architecture

```
Browser Tab A               Browser Tab B               Mobile Driver App
     │                           │                           │
     └──────────────┬────────────┘                           │
                    │  Socket.IO (shared singleton)          │
                    ▼                                        ▼
            ┌──────────────────────────────────────────────────┐
            │  Express + Socket.IO  (port 5000)                │
            │                                                   │
            │  io.emit(event, data)  ←── Controller emits      │
            │       │                                           │
            │       └── invalidateCacheForEvent(event)          │
            └──────────────────────────────────────────────────┘
```

## Events Registry

| Event | Emitted When | Cache Invalidated |
|-------|-------------|-------------------|
| `order_updated` | Order created, approved, status changed, payment recorded | summary, customers, delivery |
| `inventory_updated` | Roll created, scan-to-stock, roll transferred, stocktake completed | summary, inventory, production, materials |
| `shipping_updated` | Shipping order created, driver assigned, delivery logged | summary, delivery |
| `user_updated` | User role/status changed, permissions updated | (none – triggers permission reload) |
| `driver_vehicle_updated` | Driver check-in/check-out, vehicle assignment | (none – triggers driver list refresh) |

## Cache Invalidation Map

```typescript
// report-cache.ts - invalidateCacheForEvent()
'order_updated'     → clears: summary, customers, delivery
'inventory_updated' → clears: summary, inventory, production, materials
'shipping_updated'  → clears: summary, delivery
'production_updated'→ clears: summary, production, materials
default             → clears ALL caches
```

## Frontend Socket Hook

```typescript
// useSocket.ts
useSocket({
  onOrderUpdate:         (data) => refetchOrders(),
  onInventoryUpdate:     (data) => refetchRolls(),
  onShippingUpdate:      (data) => refetchShipping(),
  onUserUpdate:          (data) => {
    if (data.type === 'permissions_changed') reloadPermissions();
  },
  onDriverVehicleUpdate: (data) => refetchDrivers(),
});
```

## Emitting Events from Controllers

```typescript
// Pattern used in controllers
const io = req.app.get('io') as SocketIOServer;
io.emit('order_updated', { orderId: order.id, status: order.status });
```

## Reconnection Config

```typescript
reconnectionAttempts: Infinity   // Never give up
reconnectionDelay: 2000          // Start at 2s
reconnectionDelayMax: 10000      // Cap at 10s
timeout: 20000                   // Connection timeout
```

## Report Cache TTLs

| Cache Type | TTL | Reports |
|-----------|-----|---------|
| HOT | 5 minutes | summary (dashboard KPIs) |
| COLD | 1 hour | production, materials, inventory, delivery, customers |

Cache is **in-memory only** (Map). Resets on server restart.

## Missing Real-time Events (Gaps)

| Gap | Impact |
|-----|--------|
| No `production_order_updated` event | Production status changes don't trigger cache clear |
| No `material_updated` event | Material stock changes don't notify other tabs |
| No `payment_received` event | Finance page doesn't auto-refresh |
| No `return_updated` event | Return status changes not real-time |
| No room/namespace segmentation | All events broadcast to ALL connected clients |
| No driver location event | GPS tracking not real-time to admin dashboard |

## Recommended Future Events

```typescript
// Add to controller emits:
io.emit('production_order_updated', { productionOrderId, status })
io.emit('material_stock_changed', { materialId, newStock })
io.emit('payment_received', { orderId, amount })
io.emit('driver_location', { driverId, lat, lng })
io.emit('return_status_changed', { returnId, status })
```
