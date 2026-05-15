# Drivers Domain – OCR Audit Guide

> This document describes the OCR audit UI workflow for admin.
> For OCR pipeline technical rules, see `ai/shared/ocr.rules.md`.
> For fraud detection rules, see `ai/domains/drivers/fraud.rules.md`.

---

## What Admin Sees in OCR Audit Panel

```
GET /ocr-audit
  Filter params:
    ?driverId=xxx           → Filter by specific driver
    ?riskLevel=high         → Only high-risk flags
    ?reviewStatus=pending   → Only unreviewed
    ?documentType=fuel_receipt
    ?from=2026-05-01&to=2026-05-31
```

Each record shows:
| Field | Meaning |
|-------|---------|
| Driver name | Who submitted |
| Document type | fuel_receipt / odometer / repair_receipt |
| Declared value | What driver claimed (amount or km) |
| Extracted value | What OCR read from photo |
| Difference | extractedValue - declaredValue |
| Risk level | low / medium / high |
| Fraud reason | Why flagged |
| Confidence score | OCR confidence (0-100) |
| Receipt image | The uploaded photo |
| Review status | pending / approved / rejected / escalated |
| Created at | When submitted |

---

## Review Decision Flow

```
Admin opens OCR Audit panel
  ↓
Filter by: riskLevel=high AND reviewStatus=pending (most urgent)
  ↓
For each case:
  1. View receipt image
  2. Compare declared vs extracted value
  3. Check difference amount
  4. Look at driver's trust score history

Decision:
  ┌─ APPROVE: PATCH /ocr-audit/:id/review { reviewStatus: 'approved' }
  │   → No trust score impact
  │   → Use when: OCR error / image quality issue / rounding difference
  │
  ├─ REJECT: PATCH /ocr-audit/:id/review { reviewStatus: 'rejected' }
  │   → trustScore -= 10 at next calculation
  │   → Use when: confirmed fraud / deliberate mismatch
  │   → Should: notify driver's supervisor
  │
  └─ ESCALATE: PATCH /ocr-audit/:id/review { reviewStatus: 'escalated' }
      → auditTaskId set for manual investigation
      → Use when: complex case / large amount / repeat offender
      → Requires: manager review, possible HR action
```

---

## Driver Leaderboard (Trust-Based)

```
GET /drivers/leaderboard
  → topDrivers: [{name, trustScore: 100, totalAudits: 5, ...}]    ← Top 5
  → warningDrivers: [{name, trustScore: 45, rejectedCount: 3, ...}] ← Bottom 5

Trust score thresholds:
  90-100 → 🟢 Trusted
  70-89  → 🟡 Warning
  50-69  → 🟠 Suspicious
  0-49   → 🔴 High Risk
```

---

## Escalation → Investigation Workflow

```
When OCR case is escalated:

1. Admin sets reviewStatus = 'escalated'
   → auditTaskId generated or linked to investigation ticket

2. Manager or HR reviews:
   → Compares with driver's expense history (multiple fuel logs same day?)
   → Checks vehicle GPS at time of claimed refuel (location match?)
   → Interviews driver if needed

3. Resolution:
   a. Innocent → PATCH review to 'approved'
   b. Confirmed fraud:
      → PATCH review to 'rejected'
      → PUT /users/:uid/status { status: 'blocked' }
      → Report to management
```

---

## Duplicate Receipt Detection (Currently Broken)

```
Designed behavior:
  POST /fuel-logs { receiptUrl: base64 }
  → imageHash = MD5(receiptUrl)
  → Before creating FuelLog: check existing OcrAuditLog with same imageHash
  → If match: fraudReason = 'duplicate_receipt', trustScore -= 20

Current state:
  imageHash field EXISTS in OcrAuditLog schema
  imageHash is NEVER POPULATED in code
  → Duplicate detection completely non-functional
  
Fix:
  In addFuelLog controller:
  const imageHash = createHash('md5').update(receiptUrl).digest('hex');
  // Check for existing before creating
```

---

## OCR Audit Statistics

Admin can calculate:
```
Total audits this month: COUNT(OcrAuditLog WHERE createdAt BETWEEN ...)
High risk rate: COUNT(riskLevel='high') / total × 100
Rejection rate: COUNT(reviewStatus='rejected') / total × 100
Average confidence: AVG(confidenceScore)
Duplicate rate: COUNT(fraudReason='duplicate_receipt') / total × 100
```

> **Gap**: No `/ocr-audit/stats` endpoint. Admin must export and calculate manually.
