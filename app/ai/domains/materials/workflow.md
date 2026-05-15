# Materials Domain – Workflow

## Workflow 1: Material Procurement Cycle

```
Step 1: Low stock detected
  GET /materials/low-stock
  → Materials where currentStock <= minStock returned
  
  Optional: Alert team
  POST /materials/low-stock/alert
  → Telegram message sent to ops group

Step 2: Suggest Purchase Order
  POST /materials/:id/suggest-po
  → Calculates: neededQty = minStock - currentStock
  → Creates draft PurchaseOrder with line items
  → Admin reviews and submits PO to supplier

Step 3: Supplier delivers (in Procurement domain)
  PurchaseOrder.status → received
  → MaterialTransaction { type: 'import' } created
  → Material.currentStock += receivedQty
```

## Workflow 2: Stock Recording (Manual Intake)

```
Materials received outside of PO system:
  POST /materials/transactions {
    type: 'import',
    supplier: "Nhà cung cấp ABC",
    date: "2026-05-10",
    items: [
      { materialId, quantity: 100, unitPrice: 25000 }
    ]
  }
  → MaterialTransaction created
  → Material.currentStock += 100
  → Material.status auto-recalculated (con_hang / sap_het / het_hang)
```

## Workflow 3: Material Consumption (Production)

```
Production starts using materials:
  POST /materials/transactions {
    type: 'export',
    referenceId: productionOrderId,
    items: [
      { materialId, quantity: 50 }  ← consumed in production
    ]
  }
  → MaterialTransaction created
  → Material.currentStock -= 50
  → If currentStock <= minStock → status: 'sap_het'
  → If currentStock = 0 → status: 'het_hang'
```

> ⚠️ **Gap**: Material export transactions are created manually. No automatic deduction when production order starts/completes.

## Workflow 4: BOM (Bill of Materials) Management

```
Define how much material is needed per product unit:
  POST /materials/bom {
    productId: "...",
    productName: "BWP-4inch-Black",
    components: [
      { materialId: "pe-001", quantity: 5, unit: "kg" },
      { materialId: "bag-001", quantity: 1, unit: "cuộn" }
    ]
  }

Use BOM for production planning:
  GET /materials/bom/:productId
  → Returns material requirements per unit
  → AI can calculate: neededMaterial = targetRolls × bom.quantity
```

## Stock Status Auto-Logic

```typescript
// Computed when stock changes (in material transaction controller)
if (currentStock === 0)           status = 'het_hang';
else if (currentStock <= minStock) status = 'sap_het';
else                               status = 'con_hang';
// 'ngung_dung' set manually by admin only
```

## Realtime Events

Material mutations do NOT emit socket events currently.
> ⚠️ **Gap**: Should emit `material_stock_changed` for realtime updates across tabs.
