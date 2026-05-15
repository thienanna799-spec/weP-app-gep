# Drivers Domain – States

## Driver Status Machine

```
available     ← Has checked in today, no active deliveries
  ↓ assigned to shipping order
delivering    ← Has active shipping orders in dang_giao
  ↓ all deliveries completed
available

available/delivering
  ↓ no daily log today
leave         ← Auto-set when no DailyVehicleLog exists for today

any
  ↓ admin blocks
blocked       ← Cannot receive assignments, cannot login effectively
  
any
  ↓ admin deactivates
inactive      ← Profile archived
```

> ⚠️ **Bug**: `leave`, `delivering`, `available` are auto-mutated inside GET /drivers handler.  
> This should be a background job. Do NOT rely on GET to keep statuses accurate.

## Vehicle Status Machine

```
available     ← Not currently checked out
  ↓ driver checks in (DailyVehicleLog created with status='active')
in_use        ← Vehicle is checked out today
  ↓ driver checks out (DailyVehicleLog.status = 'completed')
available

available/in_use
  ↓ admin marks maintenance
maintenance   ← Being serviced
  ↓ maintenance complete
available

any
  ↓ admin marks broken
broken        ← Out of service
  ↓ repaired
available

any
  ↓ admin archives
inactive      ← Retired
```

> ⚠️ **Bug**: `in_use` status auto-reset to `available` during GET /vehicles if no active daily log. Same bug as driver status.

## DailyVehicleLog Status

```
active      ← Driver has checked in (startKm recorded), shift ongoing
completed   ← Driver has checked out (endKm recorded), totalKm calculated
```

Unique constraint: one log per vehicle per day (`@@unique([vehicleId, logDate])`).

## OCR Audit Review Status

```
pending     ← Awaiting human review
approved    ← Reviewed and accepted (no fraud)
rejected    ← Fraud confirmed → trustScore impact
escalated   ← Complex case, needs manager escalation
```

## OCR Pipeline Status

```
queued → processing → parsed → audited
                   ↘ failed
```
