# Event Standards – Socket.IO Architecture

## Event Naming Convention

Format: `{entity}_{past_tense_verb}`

```
order_updated
inventory_updated
shipping_updated
user_updated
driver_vehicle_updated
```

## Full Event Registry

### Active Events (Currently Implemented)

| Event | Payload | Emitted By | Listeners |
|-------|---------|-----------|-----------|
| `order_updated` | `{ orderId, status, type }` | orders.controller, orders.dispatch.controller | dashboard, orders list |
| `inventory_updated` | `{ rollId, status, type }` | rolls.controller, import-batch.controller | inventory, production |
| `shipping_updated` | `{ shippingOrderId, status }` | shipping.controller | shipping list |
| `user_updated` | `{ type, userId?, driver? }` | drivers.controller, auth.controller | App.tsx (permissions reload) |
| `driver_vehicle_updated` | `{ action, driverId?, vehicleId?, plateNumber?, lat?, lng? }` | drivers.controller, daily-logs.controller | drivers list, map |

### Missing Events (Must Add)

| Event | Trigger | Cache Impact |
|-------|---------|-------------|
| `production_order_updated` | ProductionOrder status change | summary, production |
| `material_stock_changed` | Material transaction created | summary, materials |
| `payment_received` | Payment created | finance |
| `return_status_changed` | Return approved/rejected | (none – trigger list refresh) |
| `driver_location` | GPS log created | driver map |
| `purchase_order_updated` | PO status change | procurement |
| `notification_sent` | Telegram alert sent | admin notifications panel |

## Standard Emit Pattern

```typescript
// In controller:
const io = req.app.get('io') as SocketIOServer;
io.emit('order_updated', {
  orderId: order.id,
  status: order.status,
  type: 'status_change',     // optional discriminator
  triggeredBy: req.user?.uid,
});
```

## Standard Listen Pattern (Frontend)

```typescript
useSocket({
  onOrderUpdate: (data) => {
    // data = { orderId, status, type, triggeredBy }
    refetchOrders();
    if (data.type === 'approval') showApprovalToast();
  },
});
```

## Cache Invalidation Map

```typescript
// report-cache.ts → invalidateCacheForEvent()
'order_updated'             → summary, customers, delivery
'inventory_updated'         → summary, inventory, production, materials
'shipping_updated'          → summary, delivery
'production_order_updated'  → summary, production              [MISSING]
'material_stock_changed'    → summary, materials               [MISSING]
'payment_received'          → (finance – no cache yet)         [MISSING]
default (unknown event)     → FLUSH ALL
```

## Event Payload Schema Rules

1. Always include the primary entity ID
2. Always include `status` if it changed
3. Add `type` discriminator for multi-purpose events
4. NEVER include sensitive data (prices, customer PII) in socket payloads
5. Keep payload small – UI re-fetches full data after receiving event

## Transport Config

```typescript
// server.ts
const io = new SocketIOServer(httpServer, {
  cors: { origin: [...], credentials: true },
  transports: ['polling', 'websocket'],  // polling first for Cloudflare
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});
```

Cloudflare Tunnel requires **polling first** then upgrade. Never set `transports: ['websocket']` only.
