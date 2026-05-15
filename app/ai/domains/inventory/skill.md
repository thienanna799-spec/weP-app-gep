# Inventory Domain – Skill Map

## What This Domain Does
Manages the physical product rolls in GEP's warehouse. Inventory is the bridge between production (rolls created) and shipping (rolls dispatched).

## Core Model: ProductRoll

```prisma
ProductRoll {
  id, code, qrCode    // QR code is THE identifier for physical tracking
  productId, productName
  sku                 // Customer-facing SKU (e.g. BWP-TH-BLACK-4inch)
  subSku              // Internal warehouse sub-SKU (e.g. TT-BWP-BLACK-Half)
  specification
  stockQuantity       // How many items this "roll" represents
  length, weight, height, diameter
  
  productionDate
  productionOrderId   // Linked production order (if produced internally)
  importBatchId       // Linked import batch (if bought externally)
  sourceType          // "production" | "manual"
  
  // Position in warehouse (5-level hierarchy)
  positionWarehouse, positionArea, positionShelf, positionLayer, positionSlot
  
  status              // dang_san_xuat → trong_kho → da_giu_cho_don → da_xuat_kho | loi_hong | hoan_tra
  
  orderId             // If assigned to an order
  materialId          // Source material used
  creator             // User uid who created this roll
}
```

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /rolls | List all rolls with filters |
| GET | /rolls/:id | Single roll detail |
| GET | /rolls/qr/:qrCode | Look up roll by QR code |
| POST | /rolls | Create new roll |
| PUT | /rolls/:id/status | Update roll status |
| PUT | /rolls/:id/scan-to-stock | QR scan: production → warehouse |
| PUT | /rolls/:id/ship | Mark as shipped |
| PUT | /rolls/:id/transfer | Move to different warehouse position |
| POST | /rolls/inventory-check | Save inventory check results |
| GET | /inventory/storage-capacity | Storage capacity analytics |

## Stock Summary APIs

| Endpoint | Purpose |
|---------|---------|
| GET /inventory/stock-summary | Aggregate stock by SKU/subSKU |
| POST /inventory/sync-stock | Recalculate stock counts |
| GET /inventory/lookup-subsku | Find rolls by sub-SKU |
| GET /inventory/by-sku | Find rolls by customer SKU |

## Manual Import (External Stock)

| Endpoint | Purpose |
|---------|---------|
| POST /inventory/import-batch | Create import batch |
| GET /inventory/import-batch | List import batches |
| POST /inventory/scan-manual | Scan roll into manual import batch |
| GET /inventory/import-template | Download Excel template |
| POST /inventory/import-excel | Bulk import rolls from Excel |

## Advanced Operations

| Endpoint | Purpose |
|---------|---------|
| GET /inventory/transfers | List internal transfers |
| POST /inventory/transfers | Transfer rolls between locations |
| GET /inventory/stocktakes | List stocktake sessions |
| POST /inventory/stocktakes | Start new stocktake |
| POST /inventory/stocktakes/items | Scan roll into stocktake |
| PATCH /inventory/stocktakes/:id/complete | Complete stocktake |

## Product Catalog (Read-only)

| Endpoint | Purpose |
|---------|---------|
| GET /inventory/products | Browse product catalog |
| GET /inventory/products/:id | Product detail |

## Key Business Rules

1. **QR is immutable**: Once a roll has a QR code, it never changes
2. **Status is unidirectional**: Rolls generally move forward in status, not backward (except hoan_tra)
3. **Position tracking**: Every movement logged in `RollMovement`
4. **Scan history**: Every QR scan logged in `RollScanHistory`
5. **Stock sync**: `POST /inventory/sync-stock` recalculates denormalized stock counts

## Realtime Events

On roll status change:
```typescript
io.emit('inventory_updated', { rollId, status, type: 'status_change' })
```
Clears: summary, inventory, production, materials caches
