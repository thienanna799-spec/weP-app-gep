# ADR-001: OCR Queue – In-Memory vs Persistent Queue

**Date:** 2026-05-10
**Status:** OPEN (decision pending migration)
**Deciders:** Engineering team

---

## Context

GEP needs to process OCR audit jobs for driver expense documents (fuel receipts, odometer readings, repair receipts). These jobs are triggered asynchronously after a driver submits an expense with a photo, and must run without blocking the main API response.

## Problem

The current implementation uses an **in-memory queue** stored in a Node.js module:

```typescript
// server/src/services/ocr/queue/ocr.queue.ts
class OcrQueueService {
  private queue: OcrJob[] = [];  // lives in Node.js process memory
  async addJob(type: string, data: any): Promise<void> { ... }
  async process(): Promise<void> { ... }
}
```

**Critical failure:** If the Node.js server restarts (deployment, crash, OS reboot), all pending OCR jobs are silently lost. No retry, no recovery, no alerting.

## Decision

**Current:** Keep in-memory queue (temporary – no change yet)

**Planned:** Migrate to **BullMQ + Redis** when:
1. Driver fleet grows beyond 20 active drivers
2. OCR fraud detection becomes business-critical for financial audits
3. Redis infrastructure is available

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **In-memory queue (current)** | Zero infra cost, simple | Job loss on restart, no persistence |
| **BullMQ + Redis** | Persistent, retries, visibility, scalable | Requires Redis infrastructure |
| **DB-backed queue** (MySQL) | No new infra | Polling-based, DB load |
| **Cloud queue** (SQS/GCP PubSub) | Fully managed, scalable | Cost, external dependency |

## Tradeoffs

**Keeping in-memory:**
- ✅ No Redis setup cost
- ✅ Works for small fleet (≤10 drivers)
- ❌ Silent job loss on restart
- ❌ Cannot scale horizontally

**Migrating to BullMQ:**
- ✅ Persistent, retry-safe
- ✅ Job status visible via Bull Dashboard
- ✅ Horizontal scaling
- ❌ Requires Redis server
- ❌ 2-3 days migration effort

## Consequences

The current in-memory queue creates **DEBT-001** and **RISK-006** in the system.

## Future Migration Path

```bash
npm install bullmq ioredis

# Redis setup:
docker run -d -p 6379:6379 redis:alpine

# Environment:
REDIS_URL=redis://localhost:6379
```

```typescript
// New implementation
import { Queue, Worker } from 'bullmq';
const ocrQueue = new Queue('ocr-audit', { connection: redis });
const ocrWorker = new Worker('ocr-audit', processOcrJob, { connection: redis });

// Same interface preserved
async function addJob(type: string, data: any) {
  await ocrQueue.add(type, data, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
}
```

**Backward compatibility:** The `OcrQueue.addJob()` interface can remain unchanged; only the implementation swaps.
