# Production Domain – QR Flow

> This document details the QR code lifecycle specifically within the Production domain.
> For the full cross-domain QR lifecycle, see `ai/shared/qr-flow.md`.

## QR Code in Production Context

Each ProductRoll has exactly ONE `qrCode` string.
This code is the **single identity token** linking:
- Physical roll (sticker on roll)
- Database record (ProductRoll.qrCode)
- Inventory position (scan-to-stock)
- Order assignment (pick-roll by QR)
- Delivery manifest (picking slip)
- Customer delivery confirmation

---

## QR Generation Strategies

### Strategy 1: Pre-printed Batch Labels (Production Default)

```
Admin prints QR label batch:
  → Generates codes: "BWP-20260510-0001" through "BWP-20260510-0500"
  → Prints 500 stickers
  → Stores in production area

Worker picks label, applies to roll:
  → Manually enters qrCode into POST /rolls body
  → System validates uniqueness: SELECT 1 FROM product_rolls WHERE qr_code = ?
  → If exists → reject (worker must pick unused label)
  → If not exists → roll created
```

### Strategy 2: On-Demand System Generation

```
Worker creates roll, system assigns qrCode:
  POST /rolls { productionOrderId, productName, ... }
    → qrCode = cuid() or timestamp-based code
    → Returns: { id, qrCode, ... }
  → Worker prints label from returned qrCode
  → Applies sticker to physical roll
```

### Strategy 3: Pre-registered QR (Bulk Pre-registration)

```
Admin pre-registers all QR codes for a production run:
  POST /rolls/pre-register { productionOrderId, count: 100 }
  → Creates 100 skeleton rolls: status='dang_san_xuat', no length/weight yet
  → Returns: [{ id, qrCode }, ...]
  
Worker updates each when physical roll complete:
  PUT /rolls/:id { length: 50.2, weight: 5.1 }
```

---

## QR Scan Events in Production

| Scan Point | API | Trigger | Status Change |
|-----------|-----|---------|--------------|
| Roll created (QR assigned) | POST /rolls | Physical roll labeled | (new) dang_san_xuat |
| Roll scan-to-stock | PUT /rolls/:id/scan-to-stock | Roll moved to warehouse | dang_san_xuat → trong_kho |
| Roll QR lookup | GET /rolls/qr/:qrCode | Validation before any operation | (no change) |

---

## QR Collision Prevention

```typescript
// Before creating roll:
const existing = await prisma.productRoll.findUnique({
  where: { qrCode }
});
if (existing) {
  return sendError(res, `QR code ${qrCode} đã được sử dụng`, 409);
}
```

QR codes are GLOBALLY unique across ALL ProductRolls regardless of product type or production batch.

---

## QR Data Encoded

The QR sticker encodes only the `qrCode` string value (plain text, not JSON).
Scanning apps read this string and use it as:
```
GET /rolls/qr/{qrCode}      ← lookup
PUT /rolls/{id}/scan-to-stock ← action
POST /shipping/{id}/scan    ← shipping scan
POST /orders/{id}/pick-roll { qrCode } ← order picking
```

---

## QR Label Format (Recommended)

```
┌─────────────────────────────┐
│  BWP-20260510-0042          │
│  ████████████████           │
│  ████████████████  [QR]     │
│  ████████████████           │
│                             │
│  BWP-4inch-Black            │
│  Dài: 50m  Nặng: 5.2kg     │
└─────────────────────────────┘
```

Fields on label:
- `qrCode` (human-readable + QR barcode)
- `productName` (brief)
- `length`, `weight` (handwritten or printed after measurement)
