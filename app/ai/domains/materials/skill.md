# Materials Domain – Skill Map

## What This Domain Does
Manages raw materials used in bubble wrap production. Materials feed into production orders via BOM (Bill of Materials). The system tracks stock levels, reorder points, and supplier info.

## Core Model

```prisma
Material {
  code              // e.g. "NVL-001"
  name, group, unit
  currentStock      // Current quantity on hand
  minStock          // Reorder point threshold
  purchasePrice     // Unit purchase price
  supplier          // Free text (not linked to Supplier model)
  warehouseLocation // Storage location text
  status            // con_hang | sap_het | het_hang | ngung_dung
  imageUrl
}
```

## Stock Status Logic
```
currentStock > minStock    → con_hang  (healthy)
0 < currentStock ≤ minStock → sap_het  (low, alert)
currentStock = 0           → het_hang  (critical, block production)
manual override            → ngung_dung (discontinued)
```

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /materials | List all materials |
| GET | /materials/:id | Single material |
| POST | /materials | Create material |
| PUT | /materials/:id | Update material |
| DELETE | /materials/:id | Delete (admin+) |
| GET | /materials/transactions | Material in/out history |
| POST | /materials/transactions | Record material movement |
| GET | /materials/bom/:productId | Get BOM for a product |
| POST | /materials/bom | Save/update BOM |
| GET | /materials/low-stock | Get materials below minStock |
| POST | /materials/low-stock/alert | Send Telegram alert (admin+) |
| POST | /materials/:id/suggest-po | Auto-suggest purchase order |

## Bill of Materials (BOM)

```prisma
MaterialBOM {
  productId    // Links to a product type
  productName
  components: MaterialBOMComponent[] {
    materialId, materialName
    quantity    // How much material per 1 unit of product
    unit
  }
}
```

Used to:
1. Calculate material requirements when production order is created
2. Check if sufficient materials are available (`waiting_material` → `ready`)
3. Auto-suggest purchase order quantities

## Material Transactions (In/Out)

```prisma
MaterialTransaction {
  type:    "import" | "export"
  date, supplier, operator, referenceId
  items: MaterialTransactionItem[] {
    materialId, materialName
    quantity, unitPrice
  }
}
```

- `import`: Materials purchased and received
- `export`: Materials consumed in production
- Each transaction updates `Material.currentStock`

## Low Stock Alert Flow

```
GET /materials/low-stock
  → Filter: currentStock ≤ minStock
  → Returns: list of critical materials

POST /materials/low-stock/alert (admin+)
  → Formats Telegram message
  → Sends to ops group
  → Logs in NotificationLog
```

## Procurement Integration

```
POST /materials/:id/suggest-po (admin+)
  → Calculates: minStock - currentStock = suggested qty
  → Creates draft PurchaseOrder with suggested line items
  → Returns PurchaseOrder for admin to review
```

## Known Gaps

| Gap | Impact |
|-----|--------|
| Supplier field is free text | No link to Supplier model for procurement tracking |
| No automatic low-stock alerts | Must be manually triggered by admin |
| No consumption tracking per production order | Can't see which production used what materials |
| No material cost history | Price changes not tracked over time |
