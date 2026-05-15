# Audit Policy – GEP ERP

## Overview
GEP implements audit logging at multiple levels to track **who did what and when**.

## Audit Models

### 1. UserLoginLog – System Entry Tracking
```prisma
UserLoginLog {
  userId, email, ipAddress, userAgent
  loginAt, logoutAt
  status: "success" | "failed"
}
```
**Populated by**: `POST /admin/login-logs` (called by frontend after Firebase login)

### 2. UserActivityLog – Business Action Tracking
```prisma
UserActivityLog {
  userId, email
  action      // "create_order", "approve_order", "scan_roll", etc.
  module      // "orders", "inventory", "shipping", etc.
  referenceId // ID of affected entity
  description // Human-readable description
  createdAt
}
```
**Populated by**: `POST /admin/activity-logs` (called by frontend after key actions)

### 3. OrderLog – Order Audit Trail
```prisma
OrderLog {
  orderId, action, oldValue, newValue
  note, createdBy, createdAt
}
```
**Populated by**: `orders.controller.ts` on every status change, approval, rejection

### 4. PurchaseOrderLog – Procurement Audit Trail
```prisma
PurchaseOrderLog {
  purchaseOrderId, action, note
  createdBy, createdAt
}
```

### 5. OcrAuditLog – Driver Document Fraud Detection
```prisma
OcrAuditLog {
  driverId, vehicleId, referenceId
  documentType     // fuel_receipt | odometer | repair_receipt
  declaredValue, extractedValue, differenceValue
  confidenceScore, riskLevel, fraudReason
  reviewStatus     // pending | approved | rejected | escalated
  pipelineStatus   // queued | processing | parsed | audited | failed
}
```

### 6. RollScanHistory – QR Scan Trail
```prisma
RollScanHistory { rollId, timestamp, action, operator }
```

### 7. RollMovement – Inventory Position Trail
```prisma
RollMovement {
  rollId
  from: {warehouse, area, shelf, layer, slot}
  to:   {warehouse, area, shelf, layer, slot}
  operator, reason, timestamp
}
```

### 8. DeliveryLog – Shipping Action Trail
```prisma
DeliveryLog {
  shippingOrderId, driverId
  action, note
  latitude, longitude
  imageUrl, signatureUrl
  createdAt
}
```

## Audit Coverage Matrix

| Domain | Audit Level | Model |
|--------|-------------|-------|
| Login/Auth | Session | UserLoginLog |
| User actions | Business actions | UserActivityLog |
| Orders | Full state history | OrderLog |
| Production orders | Status changes | (via UserActivityLog) |
| Inventory rolls | Scan + movement | RollScanHistory, RollMovement |
| Shipping | Delivery actions | DeliveryLog |
| Procurement | Approval chain | PurchaseOrderLog |
| Driver documents | OCR fraud detection | OcrAuditLog |

## Access Control for Audit Logs

| Route | Access |
|-------|--------|
| GET /admin/login-logs | super_admin, admin |
| GET /admin/activity-logs | super_admin, admin |
| GET /ocr-audit | super_admin, admin |
| PATCH /ocr-audit/:id/review | super_admin, admin |

## Missing Audit Coverage (Gaps)

| Action | Gap |
|--------|-----|
| Material stock changes | No audit trail for manual stock adjustments |
| Customer pricing changes | updatePricingRule has no log |
| Permission changes | No log when admin changes role matrix |
| Finance payments | Payments are recorded but no approval audit |
| Customer delete | No soft-delete, hard-deleted permanently |
