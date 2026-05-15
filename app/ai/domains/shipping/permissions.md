# Shipping Domain – Permissions

## Route Access Matrix

| Action | super_admin | admin | staff | driver | pending |
|--------|:-----------:|:-----:|:-----:|:------:|:-------:|
| GET /shipping | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /shipping/:id | ✅ | ✅ | ✅ | ✅* | ❌ |
| POST /shipping | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /shipping/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /shipping/:id/assign-driver | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUT /shipping/:id/return | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /shipping/:id/scan | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /shipping/:id/delivery-log | ✅ | ✅ | ✅ | ✅* | ❌ |
| GET /shipping/:id/picking-slip/pdf | ✅ | ✅ | ✅ | ✅* | ❌ |
| DELETE /shipping/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /returns | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /returns/:id/resolve | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /orders/:id/contact-logs | ✅ | ✅ | ✅ | ✅* | ❌ |
| POST /orders/:id/contact-logs | ✅ | ✅ | ✅ | ✅* | ❌ |

> \* Driver can only access shipments assigned to their driverId

## Business Rules

1. **Assign driver** – admin-only: requires vehicle + driver validation
2. **Delivery log** – driver posts from APK during active delivery
3. **Return resolution** – admin-only: decides refund/reship/exchange/cancel
4. **Scan rolls** – any staff: scan physical QR into shipment
5. **Contact logs** – driver logs call attempts from APK; staff logs from web

## APK Driver Access

From the mobile app, driver can ONLY:
```
GET  /shipping/:id          → View own assigned shipment
POST /shipping/:id/delivery-log  → Log pickup, delivery, failure
GET  /shipping/:id/picking-slip/pdf → Print/view roll manifest
POST /orders/:id/contact-logs → Log customer contact attempts
```

## Known Permission Gaps

| Gap | Risk |
|-----|------|
| Staff can create shipping without assigned order | Orphan shipments possible |
| No validation that driver is `available` before assignment | Can assign blocked driver |
| Driver can post delivery-log for any shippingId (not just assigned) | Cross-driver data manipulation |
| Return resolution available to any admin (no escalation requirement) | High-value returns resolved too quickly |
