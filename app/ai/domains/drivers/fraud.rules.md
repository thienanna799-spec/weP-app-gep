# Fraud Detection Rules – Drivers Domain

## Overview
GEP implements AI-assisted fraud detection for driver expense submissions. Every photo uploaded for fuel receipts, repair receipts, or odometer readings is automatically processed through the OCR pipeline.

## Fraud Signals

| Signal | Detection Method | Score Impact |
|--------|-----------------|-------------|
| Amount mismatch | OCR extracted ≠ declared (> 1,000 VND) | riskLevel: high |
| Odometer impossible | OCR km < previous km, or jump > 500km | fraudReason: impossible_mileage |
| Duplicate receipt | imageHash matches existing OcrAuditLog | trustScore -20 |
| Low OCR confidence | confidenceScore < threshold | riskLevel: medium |
| Unreadable image | extractedValue = null | riskLevel: high, needs review |

## Trust Score Algorithm

```typescript
// Calculated on-demand per driver (not stored in DB)
let trustScore = 100;

ocrAuditLogs.forEach(audit => {
  if (audit.reviewStatus === 'rejected')           trustScore -= 10;
  if (audit.fraudReason === 'duplicate_receipt')   trustScore -= 20;
  if (audit.riskLevel === 'medium'
      && audit.reviewStatus !== 'approved')        trustScore -= 5;
});

trustScore = Math.max(0, trustScore);  // floor at 0
```

## Trust Score Thresholds

| Score | Status | Recommended Action |
|-------|--------|-------------------|
| 90-100 | 🟢 Trusted | Auto-approve minor discrepancies |
| 70-89 | 🟡 Warning | Flag for periodic review |
| 50-69 | 🟠 Suspicious | Manual review all submissions |
| 0-49 | 🔴 High Risk | Escalate to manager, consider suspension |

## OCR Pipeline Tolerances

```typescript
// From ocr-webhook.controller.ts
if (documentType === 'odometer') {
  isMatched = Math.abs(extractedValue - declaredValue) <= 5;    // 5km tolerance
} else {
  isMatched = Math.abs(extractedValue - declaredValue) <= 1000; // 1,000 VND tolerance
}
```

## Admin Review Workflow

```
Admin views OCR Audit panel: GET /ocr-audit
  Filter: ?riskLevel=high&reviewStatus=pending

For each flagged record:
  1. Admin sees: driver name, document type, declared vs extracted value
  2. Admin views receipt image
  3. Decision:
     → PATCH /ocr-audit/:id/review { reviewStatus: 'approved' }
     → PATCH /ocr-audit/:id/review { reviewStatus: 'rejected' }
       → trustScore -10 applied at next calculation
     → PATCH /ocr-audit/:id/review { reviewStatus: 'escalated' }
       → auditTaskId set, human investigation required
```

## Leaderboard (Driver Performance)

```
GET /drivers/leaderboard
  → topDrivers: top 5 by trustScore (100 = clean record)
  → warningDrivers: bottom 5 with trustScore < 90
```

## Known Gaps

| Gap | Risk |
|-----|------|
| `imageHash` field exists but never populated | Duplicate receipt detection NOT working |
| Trust score computed per request | N+1 queries on GET /drivers (all drivers) |
| No automatic Telegram alert on fraud detection | Admin must poll UI |
| No escalation notification | Escalated cases not notified to manager |
| No historical trust score tracking | Score can recover if rejected audits are approved |
| Tolerances hardcoded in controller | Cannot be tuned per driver or document type |
| No geolocation fraud | Cannot detect if fuel logged in wrong city |

## Recommended Improvements

```
1. Populate imageHash using MD5(imageUrl) before saving FuelLog
2. Store trustScore in Driver model (recalculate nightly via job)
3. Add Telegram alert: POST to admin group when riskLevel='high'
4. Add duplicate detection: check imageHash before creating OcrAuditLog
5. Move OCR tolerances to SystemConfig table
```
