# Inventory Domain – Stocktake Guide

## Purpose
Stocktake (kiểm kê) reconciles the physical warehouse against the system database to identify missing, surplus, or mispositioned rolls.

## Models

```prisma
Stocktake {
  code        // SKT-... (auto-generated)
  date        // Date of stocktake
  warehouse   // Which warehouse being checked
  status      // draft | completed | cancelled
  notes
  createdBy, createdByName
  completedAt
  
  items: StocktakeItem[]
}

StocktakeItem {
  stocktakeId
  rollId         // Link to ProductRoll
  qrCode         // Scanned QR code
  status         // matched | missing | surplus
  notes
}
```

## Stocktake Process

### Pre-Stocktake
1. Choose time with minimal activity (end of day or weekend)
2. Freeze outgoing shipments during count (manual coordination)
3. Create stocktake session with target warehouse

### During Stocktake
```
POST /inventory/stocktakes { code, date, warehouse, notes }
  → status: draft

Staff walks warehouse, scans each roll:
POST /inventory/stocktakes/items {
  stocktakeId,
  qrCode
}
→ If QR exists in DB AND status='trong_kho':
    StocktakeItem { status: 'matched' }
→ If QR exists but status != 'trong_kho':
    StocktakeItem { status: 'surplus', notes: 'Roll shows as shipped but physically here' }
→ If QR not in DB at all:
    StocktakeItem { status: 'surplus', notes: 'Unknown roll' }
```

### Post-Stocktake Reconciliation
```
PATCH /inventory/stocktakes/:id/complete

System auto-identifies missing rolls:
  → ProductRolls where status='trong_kho' AND warehouse=target
    but NOT in StocktakeItem.rollIds
  → Creates StocktakeItem { status: 'missing' } for each

GET /inventory/stocktakes/:id
  → Summary: { matched, missing, surplus, discrepancyCount }
  → Item detail: which specific rolls are missing/surplus
```

### Resolution Actions (Manual)

| Issue | Resolution |
|-------|-----------|
| Roll is `missing` | Investigate: lost, stolen, or mis-scanned. Mark as `loi_hong` if confirmed lost |
| Roll is `surplus` | Verify physical roll. If valid, update DB status to `trong_kho` |
| Roll in wrong location | Update `positionWarehouse`, `positionArea` fields |

## Frequency Recommendation

| Type | Frequency |
|------|----------|
| Full stocktake | Quarterly |
| Partial (by zone) | Monthly |
| Spot check (by product type) | Weekly |

## Stocktake vs Real-time Inventory

The system's `inventory_updated` events keep real-time count accurate during normal operations. Stocktake is a reconciliation tool for discrepancies that slip through (e.g., physical damage found without system update, theft, misplaced rolls).
