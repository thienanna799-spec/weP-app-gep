# ADR-004: Event-Driven Architecture via Socket.IO

**Date:** 2026-05-10
**Status:** PARTIALLY IMPLEMENTED
**Deciders:** Engineering team

---

## Context

GEP is a multi-user ERP system. Multiple users (admin, staff) work on the same data simultaneously. Without synchronization, User A's changes are invisible to User B until they manually refresh.

## Problem

How to propagate mutations across clients in real-time without polling?

## Decision

**Implemented:** Socket.IO for real-time event broadcasting.

```typescript
// server.ts
const io = new SocketIOServer(httpServer, {
  cors: { origin: [...allowedOrigins], credentials: true },
  transports: ['polling', 'websocket'],  // polling-first for Cloudflare
});

// In controllers: emit after every mutation
const io = req.app.get('io');
io.emit('order_updated', { orderId, status });
```

**Frontend:** `useSocket` hook subscribes and triggers refetch.

## Why Socket.IO (not alternatives)?

| Option | Chosen? | Why |
|--------|:-------:|-----|
| **Socket.IO (current)** | ✅ | Works behind Cloudflare Tunnel via polling; familiar API |
| **WebSocket (raw)** | ❌ | Cloudflare Tunnel requires polling upgrade path |
| **Server-Sent Events** | ❌ | One-way only; no bi-directional support needed later |
| **Polling** | ❌ | Wasteful; 3-5 second staleness acceptable with events |
| **GraphQL Subscriptions** | ❌ | Too complex for current stack |

## Why `transports: ['polling', 'websocket']`?

Cloudflare Tunnel intercepts WebSocket connections differently. By defaulting to polling first and upgrading to WebSocket when possible, the connection remains stable behind the tunnel.

**Do NOT change to `transports: ['websocket']` only** – it breaks behind Cloudflare.

## Current Event Coverage

| Domain | Events | Coverage |
|--------|--------|---------|
| Orders | `order_updated` | ✅ Full |
| Inventory | `inventory_updated` | ✅ Full |
| Shipping | `shipping_updated` | ✅ Full |
| Users | `user_updated` | ✅ Full |
| Drivers/Vehicles | `driver_vehicle_updated` | ✅ Full |
| Materials | `material_stock_changed` | ❌ Missing |
| Production-Orders | `production_order_updated` | ❌ Missing |
| Finance | `payment_received` | ❌ Missing |

## Future: Event Bus

At scale, Socket.IO becomes a bottleneck (single server, no horizontal scaling).
Future path: **Kafka or Redis Pub/Sub** as the event backbone:

```
Controller → Kafka Producer → Kafka Topic: 'gep.order.updated'
→ Kafka Consumer: report-cache service (invalidate cache)
→ Kafka Consumer: notification service (send Telegram)
→ Kafka Consumer: Socket.IO gateway service (broadcast to clients)
```

This decouples event producers from consumers, enables replay, and allows horizontal scaling.

## Consequences

Current Socket.IO implementation is sufficient for current scale (< 50 concurrent users). The event model is architecturally sound; the gaps (missing events) are implementation debt, not design debt.
