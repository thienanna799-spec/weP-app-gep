# Production Domain – Workflow

## Core Loop: One Roll at a Time

Production in GEP is a **discrete, roll-by-roll** process. Each physical roll of bubble wrap is:
1. Manufactured on a machine
2. Measured (length + weight)
3. Labeled with a pre-printed QR sticker
4. Logged in the system
5. Scanned to move into warehouse inventory

---

## Workflow: Creating Rolls During Active Production Order

```
Pre-condition: ProductionOrder.status = 'producing'

REPEAT for each physical roll produced:

  Step 1: Machine produces a roll
    → Worker measures: length (m), weight (kg)
    → Worker takes QR label from pre-printed roll

  Step 2: Log roll in system
    POST /rolls {
      productionOrderId,
      productName,          // from ProductionOrder
      specification,        // e.g. "50m x 4inch"
      sku, subSku,
      qrCode,               // from physical label
      length, weight,
      status: "dang_san_xuat"
    }
    → ProductRoll created in DB
    → Roll NOT yet visible in warehouse inventory

  Step 3: Worker scans QR label (optional immediate scan)
    PUT /rolls/:id/scan-to-stock {
      positionWarehouse: "KHO-A",
      positionArea: "ZONE-1",
      positionShelf: "KE-3"
    }
    → status: dang_san_xuat → trong_kho
    → RollScanHistory entry created
    → RollMovement entry created
    → io.emit('inventory_updated', { rollId, status: 'trong_kho' })

  REPEAT until productionOrder.targetRolls reached
```

## Workflow: QR Code Handling

```
Option A: Pre-printed QR labels (most common)
  → Labels printed in batch (e.g., 1000 labels per session)
  → Worker grabs label, writes qrCode manually into system
  → qrCode = text on physical label (e.g., "BWP-20260510-0001")

Option B: System-generated QR
  → System generates unique code (cuid or timestamp-based)
  → Worker prints label on-demand
  → qrCode = system-generated code

Uniqueness:
  → prisma: qrCode @unique on ProductRoll
  → Validation: GET /rolls/qr/:qrCode before accepting new roll
    → 404 = code available → safe to use
    → 200 = code exists → reject, worker must use different label
```

## Workflow: Batch Scanning (End-of-Shift)

```
Alternative to immediate scan (Step 3):

Worker creates rolls during shift (all status: dang_san_xuat)
End of shift: warehouse team scans all unscanned rolls at once

GET /rolls?productionOrderId=xxx&status=dang_san_xuat
  → List of unscanned rolls for this PO

For each roll:
  PUT /rolls/:id/scan-to-stock { positionWarehouse, positionArea }
  → Moves to trong_kho
```

## Workflow: Defective Roll

```
Worker identifies physical defect during/after production:

PUT /rolls/:id/status { status: "loi_hong" }
  → Roll marked as defective (TERMINAL state)
  → Roll NOT added to inventory
  → Roll stays in DB as historical record

Consequence:
  → ProductionOrder must produce replacement roll
  → Current defect rate: NOT automatically tracked
  → Admin must manually count loi_hong vs total to calculate defect%
```

## Workflow: QR Scan Lookup (Validation)

```
Before accepting a QR code in any workflow (production, receiving, shipping):

GET /rolls/qr/:qrCode
  → 404: QR not in system → safe to register as new roll
  → 200: Returns existing roll
         → Check status: is this roll in the right state?
         → trong_kho: can be picked for order
         → dang_san_xuat: still being produced
         → da_giu_cho_don: already reserved
         → da_xuat_kho: already shipped
```

## Cross-Domain Side Effects

| Action | Side Effect |
|--------|-----------|
| Roll created (dang_san_xuat) | No event emitted (roll not in inventory yet) |
| Roll scan-to-stock (trong_kho) | `inventory_updated` event → report cache cleared |
| Roll marked loi_hong | No defect counter updated (gap) |
| Roll linked to order (da_giu_cho_don) | `inventory_updated` event |
| Roll shipped (da_xuat_kho) | `inventory_updated` event |
