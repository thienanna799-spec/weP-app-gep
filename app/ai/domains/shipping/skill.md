# Shipping Domain – Skill Map

## What This Domain Does
Manages the physical delivery of goods from GEP warehouse to customers. A ShippingOrder is created from an approved sales Order once rolls are ready.

## Core Model

```prisma
ShippingOrder {
  code              // Auto-generated: "GH-YYYYMMDD-XXXX"
  orderId           // Links to sales Order
  customerName, customerPhone, customerAddress
  
  totalRolls        // Count of rolls in this shipment
  totalQuantity
  
  status            // cho_xuat_kho → ... → giao_thanh_cong | giao_that_bai
  assignedDriverId, assignedDriverName
  assignedVehicle   // Plate number
  deliveryDeadline
  
  shippedAt         // When driver picked up
  deliveredAt       // When delivered successfully
  failedAt          // When delivery failed
  failReason
  
  items: ShippingOrderItem[]  // Rolls in this shipment
  deliveryLogs: DeliveryLog[] // Real-time delivery events
}
```

## ShippingOrderItem (Rolls in shipment)
```prisma
ShippingOrderItem {
  shippingOrderId
  rollId, qrCode
  productName, specification
  status   // "exported" | "returned"
}
```

## DeliveryLog (Real-time delivery tracking)
```prisma
DeliveryLog {
  shippingOrderId, driverId
  action     // "picked_up" | "delivered" | "failed" | "contacted_customer"
  note
  latitude, longitude   // GPS coordinates
  imageUrl              // Photo proof
  signatureUrl          // Customer signature
}
```

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /shipping | List shipping orders |
| GET | /shipping/:id | Detail with items |
| GET | /shipping/:id/tracking | Delivery log / tracking |
| POST | /shipping | Create shipping order from order |
| POST | /shipping/:id/scan | Scan QR roll into shipment |
| PUT | /shipping/:id/assign-driver | Assign driver + vehicle |
| POST | /shipping/:id/delivery-log | Log delivery action |
| PUT | /shipping/:id/return | Mark as returned |
| GET | /shipping/:id/picking-slip/data | Picking slip JSON |
| GET | /shipping/:id/picking-slip/preview | Picking slip HTML |
| GET | /shipping/:id/picking-slip/pdf | Download picking slip PDF |

## Status Machine

```
cho_xuat_kho (warehouse prepares)
  ↓ rolls scanned into shipment
dang_chuan_bi
  ↓ all rolls confirmed
da_xuat_kho (goods ready at dock)
  ↓ driver assigned
da_ban_giao_tai_xe (handed to driver)
  ↓ driver picks up
dang_giao (in transit)
  ↓
giao_thanh_cong ✅  OR  giao_that_bai ❌ → hoan_tra
```

## Driver Handoff Workflow

```
1. Admin creates ShippingOrder: POST /shipping { orderId }
2. Warehouse scans rolls: POST /shipping/:id/scan { qrCode }
   - Each scan: Roll.status → da_xuat_kho, ShippingOrderItem created
3. Generate picking slip: GET /shipping/:id/picking-slip/pdf
4. Admin assigns driver: PUT /shipping/:id/assign-driver { driverId }
   - status → da_ban_giao_tai_xe
5. Driver confirms pickup: POST /shipping/:id/delivery-log { action: "picked_up" }
   - status → dang_giao
6. Driver delivers: POST /shipping/:id/delivery-log { action: "delivered", imageUrl, signatureUrl }
   - status → giao_thanh_cong
   - Order.status → hoan_thanh
```

## Failed Delivery Flow

```
Driver cannot deliver:
  POST /shipping/:id/delivery-log { action: "failed" }
  PUT /shipping/:id/return
  → status: giao_that_bai → hoan_tra
  → ReturnRequest created
  → Resolution: reship | refund | exchange
```

## GPS Tracking

- Driver logs GPS coordinates with each delivery action
- `GET /drivers/locations` – realtime location of all drivers
- `GET /drivers/:id/locations` – GPS history for specific driver
- Socket.IO: `driver_vehicle_updated` for real-time location updates

## Picking Slip

Generated PDF document given to driver:
- Lists all rolls in shipment with QR codes
- Customer info and delivery address
- Driver signature field
- Generated via `server/src/services/picking-slip.service.ts`

## Missing Features (Gaps)

| Gap | Impact |
|-----|--------|
| No route optimization | Driver plans route manually |
| No real-time GPS broadcast | GPS only recorded, not live-streamed to admin |
| No customer delivery notification | Customer not auto-notified of ETA |
| No electronic signature capture via app | Signature URL must be uploaded as image |
