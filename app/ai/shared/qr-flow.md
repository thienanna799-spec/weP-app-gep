# QR Flow – Product Roll Lifecycle

## Overview
Every physical product roll in GEP has a QR code. The QR code is the **single source of truth** for tracking a roll from production → warehouse → delivery.

## QR Code Structure
- Field: `ProductRoll.qrCode` (unique string)
- Format: Typically `ROLL-{timestamp}-{random}` or custom
- Also stored on: `ShippingOrderItem.qrCode` for shipping verification

## Full Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: PRODUCTION                                             │
│                                                                  │
│  ProductionOrder (ready/producing)                               │
│     └─ POST /rolls  →  ProductRoll created                       │
│          status: dang_san_xuat                                   │
│          sourceType: "production"                                │
│          qrCode: generated                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Physical roll is complete, QR label printed
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: WAREHOUSE INTAKE                                       │
│                                                                  │
│  Staff scans QR code with mobile/scanner                        │
│     └─ PUT /rolls/:id/scan-to-stock                             │
│          status: trong_kho                                       │
│          positionWarehouse, positionArea, positionShelf...       │
│          RollScanHistory entry created                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Order is approved, staff picks rolls
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: ORDER ASSIGNMENT                                       │
│                                                                  │
│  Staff scans QR to assign roll to order                         │
│     └─ POST /orders/:id/pick-roll  { qrCode }                   │
│          status: da_giu_cho_don                                  │
│          orderId: linked                                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Shipping order created from order
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: SHIPPING PREPARATION                                   │
│                                                                  │
│  Warehouse scans QR to add roll to shipping order               │
│     └─ POST /shipping/:id/scan  { qrCode }                      │
│          ShippingOrderItem created                               │
│          Picking slip generated for driver handoff              │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Driver receives goods
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: DELIVERY                                               │
│                                                                  │
│  PUT /rolls/:id/ship                                             │
│          status: da_xuat_kho                                     │
│          Shipping status → dang_giao                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Delivery confirmed
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 6: COMPLETION / EXCEPTION                                 │
│                                                                  │
│  ✅ Delivered:  status → da_xuat_kho (final)                     │
│  ❌ Failed:     status → hoan_tra    (returned)                  │
│  ⚠️ Damaged:   status → loi_hong    (defective)                  │
└─────────────────────────────────────────────────────────────────┘
```

## Alternative Flow: Manual Import (External Stock)

```
POST /inventory/import-batch    → ImportBatch created
POST /inventory/scan-manual     → ProductRoll created
                                   sourceType: "manual"
                                   importBatchId: linked
                                   status: trong_kho (direct)
```
Used for rolls purchased externally (not produced internally).

## QR Lookup API
```
GET /rolls/qr/:qrCode    → Full roll details by QR code
```

## Position Tracking

Each roll in warehouse has 5-level position:
```
positionWarehouse  (e.g. "KHO-A")
  └── positionArea  (e.g. "ZONE-1")
       └── positionShelf  (e.g. "KE-3")
            └── positionLayer  (e.g. "TANG-2")
                 └── positionSlot  (e.g. "O-5")
```

Position changes are tracked in `RollMovement` table.

## Transfer (Chuyển kho)
```
POST /inventory/transfers  → InternalTransfer created
                              TransferItem entries for each roll
                              Roll position updated
                              RollMovement logged
```

## Stocktake (Kiểm kê)
```
POST /inventory/stocktakes           → Stocktake session created
POST /inventory/stocktakes/items     → Scan rolls, add to session
PATCH /inventory/stocktakes/:id/complete  → Reconcile: matched/missing/surplus
```
