# Production Orders Domain – Skill Map

## What This Domain Does
Production Orders (Lệnh sản xuất) are instructions to the production floor. They specify **what to make**, **how many rolls**, **with which materials**, and **by when**.

## Core Model

```prisma
ProductionOrder {
  code              // Auto-generated: "LSX-YYYYMMDD-XXXX"
  productionDate    // Scheduled production date
  creatorId         // Who created the order
  personInChargeId  // Assigned production supervisor
  
  requiredQuantity  // Total quantity needed
  specs             // Product specification text
  targetRolls       // Expected number of rolls
  rollLength        // Length per roll (meters)
  rollWeight        // Weight per roll (kg)
  productName
  machineArea       // Which machine/area to use
  consumptionRate   // Material consumption rate string
  
  status            // waiting_material | ready | producing | completed | cancelled
  deadline
  orderId           // Optional link to sales order
  completedAt
  
  materials: ProductionOrderMaterial[]
  rolls:     ProductRoll[]  // Rolls created during production
}
```

## Status Machine

```
waiting_material
  (materials not yet available or confirmed)
  ↓ when materials confirmed available
ready
  (all materials in stock, ready to start)
  ↓ when machine starts
producing
  (active manufacturing, rolls being created)
  ↓ when all target rolls completed
completed
  ↓ (terminal state)

any state → cancelled (if aborted)
```

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /production-orders | List production orders |
| GET | /production-orders/:id | Detail with materials and rolls |
| POST | /production-orders | Create new production order |
| PUT | /production-orders/:id | Update details |
| PUT | /production-orders/:id/status | Advance status |
| DELETE | /production-orders/:id | Delete (admin+) |

## Workflow

```
Step 1: Sales order approved → staff creates ProductionOrder
  POST /production-orders {
    orderId: "...",     // linked to sales order
    specs: "BWP-4inch-Black",
    targetRolls: 10,
    rollLength: 50,
    rollWeight: 5,
    materials: [{ materialId, quantity }]
  }
  status: waiting_material

Step 2: Warehouse confirms materials ready
  PUT /production-orders/:id/status { status: "ready" }

Step 3: Machine starts
  PUT /production-orders/:id/status { status: "producing" }

Step 4: Worker creates rolls (one by one or batch)
  POST /rolls {
    productionOrderId: "...",
    productName: "...",
    qrCode: "...",
    length: 50, weight: 5
    status: "dang_san_xuat"
  }

Step 5: All rolls completed → mark production done
  PUT /production-orders/:id/status { status: "completed" }
  completedAt: now()

Step 6: Rolls are QR-scanned to warehouse
  PUT /rolls/:id/scan-to-stock → roll.status: trong_kho
```

## Connected Domains

```
ProductionOrder ──→ Order (optional link)
ProductionOrder ──→ ProductRoll[] (rolls produced)
ProductionOrder ──→ Material[] (materials consumed)
```

## Missing Features (Gaps)

| Gap | Impact |
|-----|--------|
| No material auto-deduction | Materials not auto-reduced when production starts |
| No yield tracking | Actual vs target roll yield not tracked |
| No machine scheduling | No conflict detection between production orders |
| No production timeline | No Gantt chart or capacity planning |
