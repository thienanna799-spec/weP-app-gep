# Procurement Domain – Workflow

## Primary Procurement Cycle

```
Step 1: IDENTIFY NEED
  Materials team detects low stock:
  GET /materials/low-stock
  → Materials where currentStock <= minStock

  Option A: Auto-suggest PO
    POST /materials/:id/suggest-po
    → Draft PurchaseOrder created with suggested quantity

  Option B: Manual PO creation
    POST /purchase-orders {
      supplierId,
      expectedDate: "2026-05-20",
      items: [
        { materialId, materialName, quantity: 100, unitPrice: 25000, unit: 'kg' }
      ],
      notes: "Cần gấp cho sản xuất tuần tới"
    }
    status: "draft"

Step 2: SUBMIT FOR APPROVAL
  PUT /purchase-orders/:id/submit
  → status: draft → pending_approval
  → PurchaseOrderLog: { action: 'submitted' }
  ⚠️ Gap: No Telegram notification to approver

Step 3: APPROVE
  PUT /purchase-orders/:id/approve
  → status: pending_approval → approved
  → approvedBy, approvedByName, approvedAt set
  → PurchaseOrderLog: { action: 'approved' }

Step 4: PLACE ORDER WITH SUPPLIER
  Admin contacts supplier (offline process)
  Then records in system:
  PUT /purchase-orders/:id/order
  → status: approved → ordered
  → PurchaseOrderLog: { action: 'ordered' }

Step 5: RECEIVE GOODS
  When supplier delivers materials:
  PUT /purchase-orders/:id/receive {
    items: [{ itemId, receivedQty: 80 }]  ← partial possible
  }
  → If all items fully received:
    status: ordered → received
  → If partial:
    status: ordered → partially_received
  → receivedDate = now()
  → MaterialTransaction { type: 'import' } created
  → Material.currentStock += receivedQty
  → PurchaseOrderLog: { action: 'received' }

Step 6: FINANCE RECORDS PAYMENT
  PO appears in: GET /finance/payables
  Admin marks paid (manual workflow outside system currently)
```

## Cancellation

```
Any state (except received) → cancelled:
  DELETE or PUT /purchase-orders/:id { status: 'cancelled' }
  → PurchaseOrderLog: { action: 'cancelled' }
```

## Supplier Management

```
POST /suppliers { code, name, phone, email, taxCode, bankAccount, rating }
→ Supplier available for future POs

PUT /suppliers/:id { rating: 4 }
→ Update supplier performance rating (1-5)
```

## Missing Features (Gaps)

| Gap | Impact |
|-----|--------|
| No approval notification | Approver must check UI manually |
| No partial item receiving | All-or-nothing receive per PO |
| No AP payment recording | Payables never cleared from finance |
| No supplier performance reports | Cannot rank suppliers by delivery accuracy |
