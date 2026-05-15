# Socket.IO Event Map — GEP ERP
type: skill
scope: antigravity + openclaw
version: 1.0 (extracted from codebase)

## Architecture

```
Server (Express + Socket.IO)
  → io.emit(event, payload)          ← Broadcast to ALL connected clients
  → req.app.get('io')                ← How controllers access io instance

Client (React + socket.io-client)
  → globalSocket singleton           ← src/hooks/useSocket.ts
  → useSocket({ onOrderUpdate, ... }) ← How components subscribe
```

**Transport config:** Start with `polling`, upgrade to `websocket`. Supports Cloudflare/Nginx.

---

## Complete Event Registry

### `order_updated`
**Emitted by:** `orders.controller.ts`, `orders.dispatch.controller.ts`
**Payload:** `{ orderId: string, type: 'created' | 'updated' | 'approved' | 'cancelled' | 'status_change' | 'payment_update', status?: string, paymentStatus?: string }`
**Frontend listener:** `onOrderUpdate` in `useSocket`
**Triggers refetch in:** OrdersPage, ShippingPage, FinancePage, ReportsPage

### `inventory_updated`
**Emitted by:** `orders.controller.ts` (approve/cancel/ship), `stock-sync.controller.ts`, `inventory.controller.ts`, `import-batch.controller.ts`, `rolls.controller.ts`
**Payload:** `{ type?: 'stock_sync', orderId?: string }`
**Frontend listener:** `onInventoryUpdate` in `useSocket`
**Triggers refetch in:** InventoryPage, MaterialsPage, ProductionPage

### `shipping_updated`
**Emitted by:** `shipping.controller.ts`, `orders.dispatch.controller.ts`, `returns.controller.ts`
**Payload:** `{ shippingId?: string, orderId?: string, type?: string }`
**Frontend listener:** `onShippingUpdate` in `useSocket`
**Triggers refetch in:** ShippingPage, DriversPage

### `user_updated`
**Emitted by:** `users.controller.ts`, `auth.controller.ts`, `permissions.controller.ts`
**Payload:** `{ type: 'role_changed' | 'status_changed' | 'permissions_changed' | 'login', uid?: string, role?: string, status?: string }`
**Frontend listener:** `onUserUpdate` in `useSocket`
**Triggers refetch in:** AdminPage

### `driver_vehicle_updated`
**Emitted by:** `drivers.controller.ts`, `daily-logs.controller.ts`
**Payload:** `{ driverId?: string, vehicleId?: string, type?: string }`
**Frontend listener:** `onDriverVehicleUpdate` in `useSocket`
**Triggers refetch in:** DriversPage

### `customer_updated`
**Emitted by:** `customers-pricing.controller.ts`, `customers-import.controller.ts`
**Payload:** `{ type: 'pricing_import' | 'pricing_update' | 'pricing_toggle' | 'pricing_add' | 'subsku_toggle' | 'excel_import', ... }`
**Frontend listener:** ⚠️ NOT YET in useSocket — no frontend listener registered
**Note:** This event is emitted but `useSocket` does not expose `onCustomerUpdate`. Needs to be added if realtime customer sync is required.

---

## How to Emit (Server Pattern)

```typescript
// Standard pattern in every controller — ALWAYS use this
function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

// Usage
emitSync(req, 'order_updated', { orderId: order.id, type: 'created' });
emitSync(req, 'inventory_updated', { orderId: order.id });
```

**Critical Rule for P0 domains:** Must emit BOTH `order_updated` AND `inventory_updated` when approval/cancellation affects stock.

---

## How to Listen (Frontend Pattern)

```typescript
import { useSocket } from '../../hooks/useSocket';

// In a component or hook:
useSocket({
  onOrderUpdate: () => refetchOrders(),
  onInventoryUpdate: () => refetchInventory(),
  onShippingUpdate: () => refetchShipping(),
  onUserUpdate: () => refetchUsers(),
});
```

**Rule:** Call `refetch()` on event — don't process payload, just refetch.
**Rule:** Only subscribe to events that the current module cares about.

---

## Known Gaps / Missing Events

| Gap | Risk |
| :--- | :--- |
| `customer_updated` not listened on frontend | Customer list doesn't refresh realtime after bulk import |
| `purchase_order_updated` does not exist | Procurement changes not realtime |
| No `production_updated` event | Production progress not realtime |
| `ocr_alert` commented out | OCR scan results not pushed realtime |
