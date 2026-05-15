# Materials Domain – BOM (Bill of Materials)

## Purpose
BOM defines the raw material requirements to produce one unit of each product. Used for production planning and material requirement calculation.

## Models

```prisma
MaterialBOM {
  productId        // Links to Product or ProductSKU
  productName      // "BWP-4inch-Black"
  productType      // "bọc chống sốc"
  notes
  
  components: MaterialBOMComponent[]
}

MaterialBOMComponent {
  bomId
  materialId, materialName
  quantity          // Per unit (per roll)
  unit             // "kg", "cuộn", "tờ"
}
```

## BOM Calculation Example

```
Product: BWP-4inch-Black (1 roll = 50m length)
BOM Components:
  - PE Film (Màng PE): 5 kg per roll
  - Core tube:         1 unit per roll
  - Plastic bag:       1 bag per roll

Production order: targetRolls = 10
Material requirements:
  PE Film:     10 × 5 kg = 50 kg needed
  Core tube:   10 × 1   = 10 units needed
  Plastic bag: 10 × 1   = 10 bags needed
```

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /materials/bom | List all BOMs |
| GET | /materials/bom/:productId | BOM for specific product |
| POST | /materials/bom | Create BOM |
| PUT | /materials/bom/:id | Update BOM |
| DELETE | /materials/bom/:id | Delete BOM |
| POST | /materials/:id/suggest-po | Suggest PO based on low stock |
| POST | /materials/calculate-requirements | Calculate material needs for target production |

## Production Planning with BOM

```
Given: ProductionOrder.targetRolls + ProductionOrder.productName
1. Fetch BOM for productName
2. For each component:
   needed = bom.quantity × targetRolls
   available = material.currentStock
   deficit = Math.max(0, needed - available)
3. If deficit > 0 → suggest PO for that material
```

> ⚠️ **Gap**: This calculation is theoretical. The system does NOT automatically:
> - Block production if materials insufficient
> - Deduct materials when production starts/completes
> - These are manual steps requiring coordinator discipline

## Reports Integration

BOM data used in `getReportMaterials`:
- `plannedConsumption` = BOM quantity per material (all products combined)
- `variance` = (actual exported - planned) / planned × 100%

This shows whether material consumption is as expected per production.
