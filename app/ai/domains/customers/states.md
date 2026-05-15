# Customers Domain – States

## Customer Operational Status

```
active     ← Default, normal operating customer
inactive   ← Temporarily not ordering
stopped    ← Has stopped doing business with GEP (should block new orders)
```

## Customer Type (Static Classification)

```
ca_nhan    ← Individual / End consumer
doanh_nghiep ← Business / Corporate
```

No transitions – set at creation, can be updated manually.

## Follow-Up Status Machine

```
pending
  ↓ staff completes task
completed
  
pending
  ↓ past dueDate and still pending
overdue    ← Auto-calculated (not DB-stored)

pending/overdue
  ↓ cancelled explicitly
cancelled
```

## Pricing Rule Status

```
isActive: true   ← Rule applied to orders
isActive: false  ← Rule exists but not applied (toggled off)
```

No deletion recommended – toggle off to preserve history.

## Customer Activity Types (Immutable Timeline)

```
note_added          ← Staff added internal note
followup_created    ← Follow-up task created
followup_completed  ← Follow-up marked done
order_created       ← New order created for customer
status_changed      ← Customer operational status changed
```
Timeline entries are append-only (no edit, no delete).

## SubSku Status

```
isActive: true   ← Customer can order this sub-SKU
isActive: false  ← Sub-SKU hidden for this customer
```
