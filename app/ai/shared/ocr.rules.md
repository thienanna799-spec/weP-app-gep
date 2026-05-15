# OCR Rules – Driver Document Audit Pipeline

## Purpose
Automatically detect fraud and errors in driver-submitted expense documents (fuel receipts, odometer readings, repair receipts).

## Document Types

| Type | Declared Value | Tolerance |
|------|---------------|-----------|
| `fuel_receipt` | Amount in VND | ≤ 1,000 VND difference |
| `repair_receipt` | Amount in VND | ≤ 1,000 VND difference |
| `odometer` | Mileage in km | ≤ 5 km difference |

## Pipeline Architecture

```
TRIGGER: Driver submits expense with photo
   └─ addFuelLog() / addRepairLog()
        └─ OcrQueue.addJob('fuel_receipt_audit', payload)  [fire-and-forget]
             └─ OCR Provider selected (Google Vision / FPT AI / Mock)
                  └─ scanReceiptAmount(imageUrl) or scanOdometer(imageUrl)
                       └─ extractedValue compared to declaredValue
                            ├─ Match (diff ≤ tolerance):
                            │    OcrAuditLog { riskLevel: 'low', reviewStatus: 'approved' }
                            └─ Mismatch (diff > tolerance):
                                 OcrAuditLog { riskLevel: 'high', reviewStatus: 'pending' }
                                 NotificationLog { type: 'ocr_alert' }
                                 (optional) io.emit('ocr_alert', ...)
```

## OcrAuditLog Fields

```prisma
OcrAuditLog {
  driverId, vehicleId, referenceId   // FuelLog.id or Maintenance.id
  documentType                        // fuel_receipt | odometer | repair_receipt
  imageUrl                            // base64 or URL
  
  declaredValue    // What driver said
  extractedValue   // What OCR read (null if failed to parse)
  differenceValue  // extractedValue - declaredValue
  rawOcrText       // Full OCR response text
  imageHash        // MD5/SHA of image (for duplicate detection)
  
  confidenceScore  // 0-100 (from OCR provider)
  riskLevel        // low | medium | high
  fraudReason      // duplicate_receipt | amount_mismatch | impossible_mileage | low_confidence
  
  ocrProvider      // google_vision | fpt_ai | mock
  pipelineStatus   // queued → processing → parsed → audited → failed
  retryCount
  
  reviewStatus     // pending | approved | rejected | escalated
  auditTaskId      // Reference to a task if flagged for human review
}
```

## Fraud Detection Rules

| Rule | Trigger | Action |
|------|---------|--------|
| Amount mismatch | extractedValue vs declaredValue > tolerance | riskLevel: high, reviewStatus: pending |
| OCR failure | extractedValue = null | riskLevel: high, fraudReason: low_confidence |
| Duplicate receipt | imageHash matches existing log | fraudReason: duplicate_receipt, trustScore -20 |
| Impossible mileage | Odometer reading < previous reading | fraudReason: impossible_mileage |

## Trust Score Calculation

Computed on-the-fly per driver (not stored):
```typescript
let trustScore = 100;
audits.forEach(audit => {
  if (audit.reviewStatus === 'rejected')         trustScore -= 10;
  if (audit.fraudReason === 'duplicate_receipt') trustScore -= 20;
  if (audit.riskLevel === 'medium' && audit.reviewStatus !== 'approved') trustScore -= 5;
});
trustScore = Math.max(0, trustScore);
```

> ⚠️ **Gap**: Trust score not persisted – recomputed every GET request (N+1 queries).

## Review Workflow

```
Admin views OCR Audit page: GET /ocr-audit?driverId=&riskLevel=high
  → Shows pending/high-risk audits
  → Admin reviews image vs declared value
  → PATCH /ocr-audit/:id/review { reviewStatus: 'approved' | 'rejected' | 'escalated' }
```

## OCR Providers

| Provider | Accuracy | Cost | Notes |
|---------|---------|------|-------|
| Google Vision API | High | Per-request billing | Primary |
| FPT AI | Medium | Vietnamese-optimized | Fallback |
| Mock | N/A | Free | Development only |

## Known Issues (Gaps)

| Gap | Risk |
|-----|------|
| imageHash not yet populated | Duplicate detection not working |
| Queue is in-memory | Jobs lost on server restart |
| No retry on OCR provider failure | Failed audits stay in 'queued' status |
| No Telegram alert when OCR flags fraud | Admin must poll UI manually |
| Trust score is N+1 per driver per GET | Performance issue at scale |
