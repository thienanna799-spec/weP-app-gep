# Automation Rules – GEP ERP

## Currently Implemented Automations

### 1. Auto-create Driver Profile on First Login
```
User logs in with role=driver → GET/PUT /drivers/me
  → If no Driver record found with userId = firebase UID
  → Auto-creates Driver with status='inactive', code='DRV-XXXXXX'
  → Emits 'user_updated' socket event
```

### 2. Auto-fix Vehicle Status on GET
```
GET /vehicles
  → For each vehicle with status='in_use' AND no active DailyVehicleLog today
  → Auto-updates vehicle.status = 'available', activeLogId = null
```

### 3. Auto-fix Driver Status on GET
```
GET /drivers
  → For each driver:
    → If no active DailyVehicleLog today AND status not in [blocked, inactive, leave]
      → Auto-set status = 'leave'
    → If has active shipping orders AND status != 'delivering'
      → Auto-set status = 'delivering'
    → If no active shipping orders AND status == 'delivering'
      → Auto-set status = 'available'
```

> ⚠️ **Critical Bug**: Rules 2 & 3 write to DB inside GET handlers.
> This violates RULE 2 in engineering-rules.md.
> Should be moved to a background job running every 15 minutes.

### 4. OCR Trigger on Fuel Log
```
POST /fuel-logs { receiptUrl }
  → If receiptUrl exists:
  → OcrQueue.addJob('fuel_receipt_audit', payload)
```

### 5. Payment Status Auto-update
```
POST /finance/payments { amount }
  → Creates Payment
  → newTotalPaid = sum of all payments
  → If newTotalPaid >= order.totalRevenue → paymentStatus = 'da_thanh_toan'
  → Else → paymentStatus = 'thanh_toan_mot_phan'
```

### 6. Report Cache Invalidation
```
Any io.emit(event)
  → invalidateCacheForEvent(event)
  → Clears relevant report caches
```

## Missing Automations (High Value)

| Automation | Business Value | Complexity |
|-----------|---------------|-----------|
| Auto-create ProductionOrder from approved Order | Reduce manual step | Medium |
| Auto-send overdue debt alerts (daily cron) | Reduce manual work | Low |
| Auto-detect low stock and alert (daily cron) | Prevent production stoppage | Low |
| Auto-expire follow-ups to 'overdue' status | CRM accuracy | Low |
| Auto-update Customer.totalOrders on order complete | Keep denormalized counter accurate | Medium |
| Auto-deduct material stock on production start | Inventory accuracy | Medium |
| Auto-suggest PO when material hits minStock | Procurement efficiency | High |
| Auto-calculate roll weight/length from BOM | Production accuracy | Medium |
| GPS log cleanup (old records) | DB performance | Low |

## Automation Design Principles

1. **Automations must be idempotent** – running twice = same result
2. **Automations must have audit trails** – log what was auto-changed
3. **Automations in GET handlers are FORBIDDEN** – use background jobs
4. **Fire-and-forget must handle failures** – don't silently lose jobs
5. **User-triggered automations** – always show feedback (loading state, success toast)
