# Inventory Domain – Workflow

## Workflow 1: Production → Warehouse (Standard)

```
Roll created during production (status: dang_san_xuat)
  ↓
Worker scans QR label:
  PUT /rolls/:id/scan-to-stock {
    positionWarehouse, positionArea, positionShelf, positionLayer, positionSlot
  }
  → status: trong_kho
  → RollScanHistory entry created
  → RollMovement entry: from=(none) to=(position)
  → io.emit('inventory_updated', { rollId, status: 'trong_kho' })
```

## Workflow 2: External Purchase → Warehouse (Manual Import)

```
Purchase order received from supplier:

1. Create import batch:
   POST /inventory/import-batch {
     productName, sku, specification, costPrice,
     quantity, supplier, note
   }

2. Scan each physical roll into batch:
   POST /inventory/scan-manual {
     importBatchId, qrCode, productName,
     length, weight, specification
   }
   → ProductRoll created: status=trong_kho, sourceType="manual"
   → io.emit('inventory_updated', ...)

Alternative: Bulk import from Excel:
   POST /inventory/import-excel { file: base64 }
   → Creates rolls from spreadsheet data
```

## Workflow 3: Order Fulfillment (Picking)

```
Order approved (status: da_duyet)
  ↓
Staff picks rolls for the order:
  POST /orders/:id/pick-roll { qrCode }
  → Finds roll by QR code
  → roll.status: trong_kho → da_giu_cho_don
  → roll.orderId = orderId
  → io.emit('inventory_updated', { rollId, status: 'da_giu_cho_don' })

All rolls picked → Order ready for shipping:
  → Order status advances to cho_xuat_kho
```

## Workflow 4: Internal Transfer (Chuyển kho)

```
Rolls need to move between locations:

POST /inventory/transfers {
  fromLocation: "KHO-A / ZONE-1",
  toLocation: "KHO-B / ZONE-2",
  rolls: [{ rollId }],
  notes: "Di chuyển để tối ưu không gian"
}
→ InternalTransfer created
→ TransferItem for each roll
→ Roll.position fields updated
→ RollMovement entry logged
→ io.emit('inventory_updated', ...)
```

## Workflow 5: Stocktake (Kiểm kê)

```
Step 1: Start stocktake session
  POST /inventory/stocktakes {
    code, date, warehouse, notes
  }
  status: "draft"

Step 2: Scan each roll
  POST /inventory/stocktakes/items {
    stocktakeId, qrCode
  }
  → StocktakeItem created: status="matched" | "surplus"
  → System compares against expected inventory

Step 3: Identify discrepancies
  GET /inventory/stocktakes/:id
  → Items with status="missing" (expected but not scanned)
  → Items with status="surplus" (scanned but not expected)

Step 4: Complete stocktake
  PATCH /inventory/stocktakes/:id/complete
  → status: "completed"
  → Missing rolls flagged for investigation
  → Surplus rolls added to inventory
```

## Realtime Events

| Event | Trigger | Cache Impact |
|-------|---------|-------------|
| `inventory_updated` | scan-to-stock, pick-roll, transfer, import | summary, inventory, production, materials |
