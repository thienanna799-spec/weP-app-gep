# OpenClaw Policy: Realtime Policy

> Rules governing Socket.IO event emission in GEP ERP.
> **Source:** ADR-004, ai/system/event-standards.md, ai/system/realtime.md

---

## Core Rule

```
Every mutation in a P0/P1 domain MUST emit a corresponding Socket.IO event
AFTER the database transaction completes.
Events must NEVER be emitted inside $transaction boundaries.
```

---

## Transport Configuration (IMMUTABLE)

```typescript
// ✅ CORRECT: polling FIRST (Cloudflare Tunnel requirement)
const io = new Server(server, {
  transports: ['polling', 'websocket'],
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ❌ WRONG: websocket first breaks behind Cloudflare
const io = new Server(server, {
  transports: ['websocket', 'polling'], // ← VIOLATION
});
```

**WHY:** Cloudflare Tunnel intercepts WebSocket connections. Polling-first ensures compatibility. This is an ADR-004 decision and is IMMUTABLE.

---

## Event Registry

### Active Events (currently implemented)

| Event | Trigger Domain | Payload | Cache Impact |
|-------|---------------|---------|-------------|
| `order_updated` | orders | `{ orderId, status, updatedAt }` | summary, orders |
| `inventory_updated` | inventory | `{ rollId, status, location }` | inventory, summary |
| `shipping_updated` | shipping | `{ shippingOrderId, status, driverId }` | delivery, summary |
| `driver_vehicle_updated` | drivers | `{ driverId, vehicleId, status }` | drivers |
| `user_updated` | admin | `{ userId, role, action }` | user state |

### Missing Events (GAPs – MUST add)

| Event | Should Trigger | Severity |
|-------|---------------|---------|
| `material_stock_changed` | Material.currentStock update | 🟠 HIGH |
| `production_order_updated` | ProductionOrder status change | 🟠 HIGH |
| `payment_received` | Payment created | 🟡 MEDIUM |

---

## Emission Patterns

### Pattern A: After mutation (simple)
```typescript
// ✅ CORRECT: emit AFTER DB operation
const updated = await prisma.order.update({
  where: { id: orderId },
  data: { status: newStatus },
});
io.emit('order_updated', {        // ← AFTER the DB operation
  orderId: updated.id,
  status: updated.status,
  updatedAt: updated.updatedAt,
});
```

### Pattern B: After transaction
```typescript
// ✅ CORRECT: emit AFTER transaction completes
const [order, log] = await prisma.$transaction([
  prisma.order.update({ ... }),
  prisma.orderLog.create({ ... }),
]);
// Transaction done → now emit
io.emit('order_updated', { orderId: order.id, status: order.status });
```

### Anti-Pattern: Emit inside transaction
```typescript
// ❌ WRONG: emit inside transaction
await prisma.$transaction(async (tx) => {
  await tx.order.update({ ... });
  io.emit('order_updated', { ... }); // ← VIOLATION: inside transaction
});
```

### Anti-Pattern: Emit before transaction
```typescript
// ❌ WRONG: emit before operation (event may be premature)
io.emit('order_updated', { ... }); // ← VIOLATION: before DB write
await prisma.order.update({ ... });
```

---

## Event Payload Standards

### Minimum required fields:
```typescript
interface OrderUpdatedPayload {
  orderId: string;      // Always include entity ID
  status: string;       // Always include new status
  updatedAt: string;    // Always include timestamp (ISO string)
}

interface InventoryUpdatedPayload {
  rollId: string;
  status: string;
  updatedAt: string;
}

interface ShippingUpdatedPayload {
  shippingOrderId: string;
  status: string;
  driverId?: string;
  updatedAt: string;
}
```

### Anti-patterns in payloads:
```typescript
// ❌ BAD: Too much data in socket event (security + performance)
io.emit('order_updated', { order: fullOrderObject }); // ← exposing full object

// ✅ GOOD: Minimal payload, client re-fetches if needed
io.emit('order_updated', { orderId, status, updatedAt });
```

---

## Client-Side Socket Handling

### Event subscription (React hook pattern):
```typescript
// ✅ GEP standard pattern in useSocket.ts
socket.on('order_updated', ({ orderId, status }) => {
  setOrders(prev => prev.map(o =>
    o.id === orderId ? { ...o, status } : o
  ));
});
```

### Reconnection handling:
```typescript
// Client config (IMMUTABLE - Cloudflare compatible):
const socket = io(SERVER_URL, {
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

---

## Cache Invalidation by Event

Events must trigger report cache invalidation:

```typescript
// In report-cache.ts: invalidateCacheForEvent()
function invalidateCacheForEvent(event: string): void {
  const eventCacheMap: Record<string, string[]> = {
    'order_updated':           ['summary', 'orders', 'delivery'],
    'inventory_updated':       ['inventory', 'summary'],
    'shipping_updated':        ['delivery', 'summary'],
    'driver_vehicle_updated':  ['drivers'],
    'user_updated':            ['admin'],
    // MISSING - must add:
    'material_stock_changed':  ['materials', 'summary'],
    'production_order_updated': ['production', 'summary'],
    'payment_received':        ['finance', 'summary'],
  };
  // invalidate matching cache keys
}
```

---

## Realtime Coverage Check

OpenClaw verifies realtime coverage after every P0/P1 build:

```
□ orders mutation → order_updated emitted?
□ inventory mutation → inventory_updated emitted?
□ shipping mutation → shipping_updated emitted?
□ driver mutation → driver_vehicle_updated emitted?
□ admin role change → user_updated emitted?
□ Event emitted AFTER (not inside) transaction?
□ Event payload is minimal (no full objects)?
□ Cache invalidation includes new event?
```
