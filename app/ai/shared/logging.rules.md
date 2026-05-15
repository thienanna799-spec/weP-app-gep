# Logging Rules – GEP ERP

## Log Types

### 1. Application Logs (console)
- `console.log()` for info
- `console.error()` for errors
- `console.warn()` for warnings
- **Not structured** – goes to terminal output only
- **No log aggregation** (no Sentry, no Datadog)

### 2. Database Logs

#### UserActivityLog – Business Actions
```typescript
// Called by frontend after key user actions
POST /admin/activity-logs {
  action: "approve_order",
  module: "orders",
  referenceId: orderId,
  description: "Duyệt đơn hàng DH-20260510-0001"
}
```

Action naming convention:
```
create_{entity}     // create_order
update_{entity}     // update_customer
delete_{entity}     // delete_material
approve_{entity}    // approve_order
reject_{entity}     // reject_order
assign_{entity}     // assign_driver
complete_{entity}   // complete_delivery
scan_{entity}       // scan_roll
export_{entity}     // export_report
```

#### UserLoginLog – Session Tracking
```typescript
POST /admin/login-logs { status: "success" | "failed" }
// Called by frontend after Firebase login
```

#### OrderLog – Order Audit Trail
```typescript
// Created by orders.controller.ts on every status change
OrderLog {
  orderId, action, oldValue, newValue
  note, createdBy, createdAt
}
```

#### NotificationLog – Outbound Alerts
```typescript
// Created when Telegram/email sent
NotificationLog {
  type, channel, recipient, subject, content
  status: "sent" | "failed"
  relatedId, relatedType, error
}
```

## What Must Be Logged

| Action | Log Type | Notes |
|--------|---------|-------|
| User login | UserLoginLog | Always |
| Order status change | OrderLog | Always |
| Order approve/reject | OrderLog | Always |
| Roll QR scan | RollScanHistory | Always |
| Roll movement | RollMovement | Always |
| Driver delivery action | DeliveryLog | Always |
| PO status change | PurchaseOrderLog | Always |
| OCR audit result | OcrAuditLog | Always |
| Telegram sent | NotificationLog | Always |
| Customer note added | CustomerActivity | Always |
| User profile action | UserActivityLog (frontend) | Key actions |

## What Is Missing from Logging

| Action | Gap |
|--------|-----|
| Payment created | No specific log (only Order.paymentStatus updated) |
| Material stock changed | No MaterialLog – only MaterialTransaction |
| Customer pricing changed | No pricing audit trail |
| Permission matrix changed | No admin permission change log |
| Customer deleted | Hard delete, no tombstone |
| User role assigned | Only UserActivityLog via frontend |

## Log Access

| Log | Access Route |
|-----|-------------|
| UserLoginLog | GET /admin/login-logs |
| UserActivityLog | GET /admin/activity-logs |
| OrderLog | GET /orders/:id/logs |
| PurchaseOrderLog | (no route yet) |
| OcrAuditLog | GET /ocr-audit |
| NotificationLog | (no route – admin must query DB directly) |

## Log Retention Policy

**Not defined.** All logs grow indefinitely. No archival or cleanup job exists.

Recommended:
- Activity logs: 90 days hot, then archive
- Login logs: 30 days
- GPS logs: 60 days
- OCR audit logs: 1 year (compliance)
- Order logs: indefinite (business critical)
