# Build Prompt – Drivers Domain

> Load this file as AI context before building any Drivers or OCR feature.

## 1. Domain Memory (Read First)

```
ai/domains/drivers/skill.md         ← Models, APIs (Driver, Vehicle, FuelLog, GpsLog, OCR)
ai/domains/drivers/workflow.md      ← 6 workflows (shift, fuel, repair, GPS, OCR review, profile)
ai/domains/drivers/states.md        ← Driver/Vehicle/DailyLog/OCR states
ai/domains/drivers/permissions.md   ← Role matrix, APK access
ai/domains/drivers/fraud.rules.md   ← Fraud signals, trust score algorithm
ai/domains/drivers/ocr-audit.md     ← Admin OCR review workflow
ai/shared/ocr.rules.md             ← OCR pipeline technical rules
```

## 2. Governance

```
Domain criticality: P1 – Operational Critical (OCR = P1)
Governance level:   🟠 GUARDED
Reference:          ai/system/ai-execution-governance.md
```

## 3. Mandatory Rules When Building

```
✅ ALWAYS compute imageHash before creating FuelLog (MD5 of receiptUrl)
✅ ALWAYS check referenceId before creating OcrAuditLog (idempotency)
✅ ALWAYS emit io.emit('driver_vehicle_updated', ...) after driver/vehicle mutations
✅ ALWAYS handle OcrQueue.addJob() failure gracefully (try/catch, log, continue)
✅ ALWAYS create DailyVehicleLog as sole source of truth for daily shift

❌ NEVER write driver.status or vehicle.status inside GET handlers
❌ NEVER block main API request waiting for OCR response (always fire-and-forget)
❌ NEVER delete OcrAuditLog records
❌ NEVER modify extractedValue, declaredValue, rawOcrText after OcrAuditLog creation
❌ NEVER compute trust score with N+1 queries (aggregate in one query)
```

## 4. OCR Integration Pattern

```typescript
// Correct: Fire-and-forget OCR after fuel log creation
const fuelLog = await prisma.fuelLog.create({ data: { ... } });

// Compute hash BEFORE queuing
const imageHash = receiptUrl
  ? createHash('md5').update(receiptUrl).digest('hex')
  : null;

// Fire OCR without awaiting
try {
  await OcrQueue.addJob('fuel_receipt_audit', {
    driverId, referenceId: fuelLog.id,
    imageUrl: receiptUrl, declaredValue: amount,
    imageHash
  });
} catch (err) {
  console.error('[OCR Queue] Failed to queue job:', err.message);
  // Do NOT throw – OCR failure should not fail the main request
}

sendSuccess(res, fuelLog);  // Return immediately without waiting for OCR
```

## 5. Trust Score Pattern (Batch Calculation)

```typescript
// Correct: single aggregation query
const auditStats = await prisma.ocrAuditLog.groupBy({
  by: ['driverId'],
  where: { driverId },
  _count: { reviewStatus: true },
  _sum: { /* grouped counts */ }
});
// Calculate from aggregated result, not per-record

// WRONG: N+1
const logs = await prisma.ocrAuditLog.findMany({ where: { driverId } });
let score = 100;
logs.forEach(log => { /* compute */ }); // ← N+1 pattern if called per driver
```

## 6. Cross-Domain Impacts to Check

| Change | Domains Affected |
|--------|----------------|
| Driver assigned to shipping | shipping (status update), orders |
| DailyVehicleLog created | vehicles (status → in_use) |
| OCR fraud confirmed | finance (fuel expense integrity), reports |
| GPS update | dashboard (map), shipping (live tracking) |

## 7. Post-Build Checklist

```markdown
- [ ] imageHash computed and stored in FuelLog?
- [ ] OCR queued as fire-and-forget (not awaited)?
- [ ] OcrAuditLog referenceId checked before creating?
- [ ] No DB writes inside GET /drivers or GET /vehicles?
- [ ] driver_vehicle_updated event emitted?
- [ ] Trust score computed with aggregation (not N+1)?
- [ ] DailyVehicleLog unique per (vehicleId, logDate) enforced?
```
