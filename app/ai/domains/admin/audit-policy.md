# Admin Domain – Audit Policy

## What Admin Audits

Admin domain is responsible for collecting, storing, and exposing system-wide audit data for compliance, security, and operational review.

---

## Audit Log Sources (Admin Consolidates All)

| Log Model | Written By | Admin Route | Retention |
|-----------|-----------|------------|---------|
| `UserLoginLog` | Frontend (after Firebase login) | GET /admin/login-logs | 30 days recommended |
| `UserActivityLog` | Frontend (after key actions) | GET /admin/activity-logs | 90 days recommended |
| `OrderLog` | orders.controller.ts | GET /orders/:id/logs | Indefinite |
| `PurchaseOrderLog` | procurement controller | (no route yet) | Indefinite |
| `OcrAuditLog` | OCR pipeline (background) | GET /ocr-audit | 1 year recommended |
| `NotificationLog` | telegram.service.ts | GET /admin/notification-logs | 90 days recommended |
| `RollScanHistory` | inventory controller | (no direct route) | Indefinite |
| `DeliveryLog` | shipping controller (driver APK) | (via shipping detail) | Indefinite |
| `CustomerActivity` | customers controller | (via CRM) | Indefinite |

---

## Login Audit

```
POST /admin/login-logs { status: "success" | "failed" }
  → Called by FRONTEND after Firebase auth
  → Records: userId, email, timestamp, status, ipAddress (if available)

GET /admin/login-logs
  → Filter by userId, dateRange, status
  → Admin visibility only
```

> ⚠️ **Trust Issue**: Login logs written by frontend, not backend.
> A compromised client could post fake login-success logs.
> Server-side: Firebase emits auth events that could be captured via Admin SDK.

---

## Activity Audit

```
POST /admin/activity-logs {
  action: "approve_order",
  module: "orders",
  referenceId: orderId,
  description: "Duyệt đơn hàng DH-20260510-0001"
}
  → Called by FRONTEND after successful operations
  → Records: userId, userName, action, module, referenceId, description, timestamp

GET /admin/activity-logs
  → Filter by userId, module, action, dateRange
  → Pagination: ?page&limit (gap – currently no pagination)
```

> ⚠️ **Trust Issue**: Activity logs written by frontend.
> Backend does not cross-validate that the action actually occurred.

---

## Permission Change Audit (Gap)

```
⚠️ MISSING: When admin updates permission matrix:
  PUT /admin/permissions { ... }
  
  Currently: No log created. Changes are invisible in audit trail.

  Should create:
  UserActivityLog {
    action: "update_permissions",
    module: "admin",
    description: "Changed finance access: removed staff",
    createdBy: req.user.uid
  }
```

---

## User Role Change Audit (Gap)

```
⚠️ MISSING: When super_admin changes user role:
  PUT /users/:uid/role { role: "admin" }
  
  Currently: No log entry in UserActivityLog (only Socket.IO event fired).

  Should create:
  UserActivityLog {
    action: "change_role",
    module: "admin",
    referenceId: targetUid,
    description: "Changed ${userName} role from staff to admin"
  }
```

---

## OCR Fraud Audit (Admin View)

```
GET /ocr-audit
  Filter: ?driverId, ?riskLevel=high, ?reviewStatus=pending
  → Admin sees all OCR submissions flagged for review

PATCH /ocr-audit/:id/review { reviewStatus: 'approved' | 'rejected' | 'escalated' }
  → Admin reviews receipt vs OCR extracted value
  → Decision recorded (immutable from this point)
```

---

## Audit Data Retention Policy

| Log Type | Recommended Retention | Current Implementation |
|----------|----------------------|----------------------|
| LoginLog | 30 days | Indefinite (no cleanup) |
| ActivityLog | 90 days | Indefinite (no cleanup) |
| OrderLog | Indefinite | ✅ |
| OcrAuditLog | 1 year (compliance) | Indefinite |
| NotificationLog | 90 days | Indefinite (no cleanup) |
| GPS logs | 60 days | Indefinite (no cleanup) |

> **Gap**: No cleanup jobs exist. All logs grow indefinitely.

---

## Missing Admin Audit Routes

| Route | Purpose |
|-------|---------|
| GET /admin/purchase-order-logs | View procurement audit trail |
| GET /admin/notification-logs | View all Telegram notifications sent |
| GET /admin/permission-change-logs | View who changed permissions and when |
| GET /admin/role-change-logs | View all role assignments |
