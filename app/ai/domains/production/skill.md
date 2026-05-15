# Production Domain – Skill Map

## What This Domain Does
The production domain manages the actual manufacturing process: creating individual product rolls during production runs. This domain is the bridge between `production-orders` (the plan) and `inventory` (the output).

## Core Model: ProductRoll (during production)

```prisma
ProductRoll {
  code, qrCode          // qrCode = physical label on roll
  productName, specification
  sku, subSku
  stockQuantity         // items this roll represents
  length, weight, height, diameter
  
  status: "dang_san_xuat"  // ← while in production
  sourceType: "production"  // vs "manual" (external stock)
  
  productionOrderId     // Links to parent ProductionOrder
  materialId            // Raw material used
  productionDate
  creator               // User who created/scanned this roll
}
```

## Production Workflow

```
ProductionOrder status = "producing"
  ↓
Worker creates rolls one by one:
  POST /rolls {
    productionOrderId,
    productName, specification,
    qrCode,           // pre-printed or auto-generated
    length, weight,
    status: "dang_san_xuat"
  }
  ↓
Roll exists in DB but NOT yet in warehouse
  ↓
Worker scans QR: PUT /rolls/:id/scan-to-stock
  → status: "trong_kho"
  → position fields populated
  → RollScanHistory entry created
  → io.emit('inventory_updated', { rollId, status: 'trong_kho' })
```

## APIs Used

| Method | Endpoint | Purpose |
|--------|---------|---------|
| POST | /rolls | Create new roll during production |
| GET | /rolls?productionOrderId=xxx | List rolls for a production order |
| GET | /rolls/qr/:qrCode | Look up by QR (validation before scan) |
| PUT | /rolls/:id/scan-to-stock | Move roll to warehouse |
| PUT | /rolls/:id/status | Manual status change |

## QR Code Generation

QR codes may be:
1. **Pre-printed** on physical labels (code entered manually)
2. **Auto-generated** by system (cuid or timestamp-based)
3. **Scanned** from physical label on material roll

Uniqueness constraint: `qrCode` must be unique across all ProductRolls.

## Roll Quality States

During production:
```
dang_san_xuat → (after QR scan) → trong_kho   ✅ Good roll
dang_san_xuat → loi_hong                        ❌ Defective
```

## Connection to Production Orders

```
ProductionOrder.targetRolls = 10
  → Worker creates rolls one by one via POST /rolls
  → ProductionOrder.rolls[] count increases
  → When rolls.length >= targetRolls:
      → Admin marks ProductionOrder.status = 'completed'
      (No auto-detection – manual step currently)
```

## Realtime Events

| Event | When | Cache Impact |
|-------|------|-------------|
| `inventory_updated` | Roll scanned to stock | summary, inventory, production, materials |

## Cross-Domain Connections

```
Production Domain uses:
  ProductionOrder (plan) → rolls it creates
  Material → materialId recorded on roll
  User → creator field
  
Production Domain feeds:
  Inventory → rolls.status = 'trong_kho'
  Reports → production report aggregates roll data
```

## Missing Features (Gaps)

| Gap | Impact |
|-----|--------|
| No auto-completion of ProductionOrder | Admin must manually mark complete |
| No defect rate tracking | loi_hong rolls not reported on dashboard |
| No material auto-deduction | Materials not decremented when roll created |
| No roll batch creation | Must create rolls one by one |
| No production timeline | No shift/time tracking per roll |
