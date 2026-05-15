# Queue & Background Processing Standards

## Current Queue: OcrQueue (In-Memory)

Location: `server/src/services/ocr/queue/ocr.queue.ts`

```typescript
// OCR Queue triggered in:
// drivers.controller.ts → addFuelLog()
OcrQueue.addJob('fuel_receipt_audit', {
  driverId, vehicleId, referenceId,
  documentType: 'fuel_receipt',
  imageUrl, declaredValue
}).catch(console.error);
```

## Critical Warning: Queue is NOT Persistent

The current OCR queue lives in memory. If the server restarts:
- **All pending jobs are lost**
- **No retry mechanism survives restart**
- **No job status visibility**

## OCR Job Lifecycle

```
addFuelLog() called
  → FuelLog created in DB
  → if (receiptUrl exists):
    → OcrQueue.addJob('fuel_receipt_audit', payload)  // fire-and-forget
      → Background: scanReceiptAmount(imageUrl)
        → extractedValue compared to declaredValue
        → OcrAuditLog created
        → if mismatch: NotificationLog created + (optional) socket emit
```

## Webhook Alternative

OCR can also be triggered via webhook:
```
POST /api/webhooks/ocr/audit
Body: { driverId, vehicleId, referenceId, documentType, imageUrl, declaredValue }
Response: 202 Accepted (runs in background after response)
```
The webhook responds immediately then processes async via `setImmediate`-like pattern.

## OCR Providers (Priority Order)

```
server/src/services/ocr/providers/
  ├── google-vision.provider.ts  (primary)
  ├── fpt-ai.provider.ts         (fallback)
  └── mock.provider.ts           (development/test)
```

Selection: based on env config or automatic fallback on error.

## Recommended Queue Architecture (Future)

Replace in-memory queue with **BullMQ + Redis**:

```
npm install bullmq ioredis

// Create persistent queues:
const ocrQueue = new Queue('ocr-audit', { connection: redis });
const notificationQueue = new Queue('notifications', { connection: redis });
const reportQueue = new Queue('report-generation', { connection: redis });

// Worker:
const worker = new Worker('ocr-audit', async (job) => {
  await processOcrJob(job.data);
}, { connection: redis });
```

## Background Jobs That Should Exist (Currently Missing)

| Job | Purpose | Frequency |
|-----|---------|-----------|
| `sync-driver-status` | Auto-fix stale driver statuses | Every 15 min |
| `send-overdue-alerts` | Notify customers with overdue payments | Daily 9AM |
| `low-stock-check` | Auto-send low stock alerts | Daily 8AM |
| `cleanup-gps-logs` | Delete GPS logs older than 90 days | Weekly |
| `archive-activity-logs` | Move old logs to archive table | Monthly |
| `report-cache-warmup` | Pre-populate report cache | Daily 7AM |
| `update-customer-totals` | Recalculate totalOrders/totalRevenue | Daily |

## Retry Policy (When BullMQ Added)

| Job Type | Max Retries | Backoff |
|---------|------------|---------|
| OCR audit | 3 | Exponential 5s, 30s, 2m |
| Telegram notification | 2 | Fixed 10s |
| Report generation | 1 | Fixed 30s |
| Stock sync | 0 | No retry (idempotent, just re-run) |
