# Production Orders Domain – Workflow

## Primary Workflow: Order-to-Production

```
Step 1: TRIGGER
  Sales Order approved (status: da_duyet)
  → Staff determines no stock in inventory for this SKU
  → Creates ProductionOrder manually

  POST /production-orders {
    orderId: "...",           ← optional link to sales order
    productName: "BWP-4inch-Black",
    specs: "Chiều dài 50m, khổ 4 inch",
    targetRolls: 10,
    rollLength: 50,
    rollWeight: 5,
    machineArea: "MÁY-A",
    consumptionRate: "5kg PE per roll",
    deadline: "2026-05-15",
    materials: [
      { materialId: "mat-001", quantity: 50 }  ← 10 rolls × 5kg
    ]
  }
  status: "waiting_material"

Step 2: MATERIAL CONFIRMATION
  Warehouse checks material stock:
  → GET /materials/:id (check currentStock vs needed)
  → If sufficient:
    PUT /production-orders/:id/status { status: "ready" }
  → If insufficient:
    → Trigger procurement: POST /materials/:id/suggest-po
    → Wait for materials to arrive
    → When PurchaseOrder received → status: "ready"

Step 3: PRODUCTION START
  Supervisor starts machine:
  PUT /production-orders/:id/status { status: "producing" }

Step 4: ROLL CREATION (repeated per roll)
  Worker creates each roll physically, then logs in system:
  POST /rolls {
    productionOrderId: "...",
    productName: "BWP-4inch-Black",
    specification: "50m x 4inch",
    qrCode: "QR-20260510-001",    ← from pre-printed label
    length: 50,
    weight: 5,
    status: "dang_san_xuat"
  }
  → Roll appears in production order's roll list

Step 5: QR SCAN TO STOCK
  Worker scans QR label after physical roll complete:
  PUT /rolls/:id/scan-to-stock {
    positionWarehouse: "KHO-A",
    positionArea: "ZONE-1",
    positionShelf: "KE-3"
  }
  → Roll status: dang_san_xuat → trong_kho
  → io.emit('inventory_updated', { rollId, status: 'trong_kho' })

Step 6: COMPLETION
  When all targetRolls have been created and scanned:
  PUT /production-orders/:id/status { status: "completed" }
  completedAt = now()
```

## Exception: Defective Roll

```
Roll has quality issue during production:
  PUT /rolls/:id/status { status: "loi_hong" }
  → Roll excluded from inventory
  → Counts against defect rate (but defect rate not tracked currently)
  → Worker must create a replacement roll
```

## Cancellation

```
Business decision to cancel production run:
  PUT /production-orders/:id/status { status: "cancelled" }
  → Any rolls already created: remain in dang_san_xuat (orphaned)
  → Must manually set orphaned rolls to loi_hong or hoan_tra
```

## Cross-Domain Side Effects

| Action | Side Effect |
|--------|-----------|
| ProductionOrder created | MaterialTransaction should be created (gap – currently manual) |
| Roll scan-to-stock | inventory_updated event → report cache cleared |
| ProductionOrder completed | No automatic Order status update (gap) |
| Roll marked loi_hong | No defect counter updated (gap) |
