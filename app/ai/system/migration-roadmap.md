# Migration Roadmap – GEP ERP

> Defines the phased migration path from current to target architecture.
> Each phase has backward compatibility requirements, rollback strategy, and data migration risks.

---

## Current Architecture

```
┌─────────────────────────────────────────────────┐
│                CURRENT (2026)                    │
├─────────────────────────────────────────────────┤
│  Frontend:  React 18 + Vite + TailwindCSS       │
│  Backend:   Express.js + TypeScript (monolith)  │
│  Database:  MySQL 8 (single instance, Docker)   │
│  Queue:     In-memory (Node.js process)         │
│  Storage:   MySQL LongText (base64 images)      │
│  Realtime:  Socket.IO (single server)           │
│  Cache:     In-memory Map (Node.js process)     │
│  Auth:      Firebase Admin SDK                   │
│  CDN/Proxy: Cloudflare Tunnel                   │
│  Deploy:    Single server (PM2 or Docker)       │
└─────────────────────────────────────────────────┘
```

## Target Architecture

```
┌─────────────────────────────────────────────────┐
│               TARGET (Phase 3+)                  │
├─────────────────────────────────────────────────┤
│  Frontend:  React 18 + Vite (unchanged)         │
│  Backend:   Express.js (modular services)       │
│  Database:  MySQL 8 (primary) + Redis (cache)  │
│  Queue:     BullMQ + Redis (persistent)         │
│  Storage:   Cloudflare R2 (object storage)      │
│  Realtime:  Socket.IO → Redis Pub/Sub adapter   │
│  Cache:     Redis (TTL-based, shared)           │
│  Auth:      Firebase (unchanged)                 │
│  CDN/Proxy: Cloudflare (unchanged)              │
│  Deploy:    Docker Compose (multi-service)      │
└─────────────────────────────────────────────────┘
```

---

## Phase 1 – Immediate Fixes (1-2 weeks)

**Goal:** Remove critical technical debt without architecture changes.

### 1.1 Remove Writes from GET Handlers
```diff
// drivers.controller.ts
- // Auto-update driver status inside getDrivers()
+ // Remove: move to background job
```
- Create `server/src/jobs/status-sync.job.ts`
- Run `setInterval(syncDriverStatuses, 15 * 60 * 1000)` in `server.ts`
- **Backward Compatible:** Yes – same GET response, behavior unchanged
- **Rollback:** Revert the job, revert the controller
- **Risk:** Low

### 1.2 Add Missing Socket Events
```typescript
// materials.controller.ts
io.emit('material_stock_changed', { materialId, currentStock });

// production-orders.controller.ts
io.emit('production_order_updated', { productionOrderId, status });

// finance.controller.ts
io.emit('payment_received', { orderId, amount });
```
- Update `invalidateCacheForEvent` in `report-cache.ts`
- **Backward Compatible:** Yes – new events, clients ignore unknown events
- **Risk:** Very Low

### 1.3 Populate imageHash on FuelLog
```typescript
// drivers.controller.ts – addFuelLog
import { createHash } from 'crypto';
const imageHash = receiptUrl
  ? createHash('md5').update(receiptUrl).digest('hex')
  : null;
```
- **Backward Compatible:** Yes – new field, no existing logic breaks
- **Risk:** Very Low

---

## Phase 2 – Soft Delete + Audit Gaps (2-4 weeks)

**Goal:** Prevent data loss, close audit gaps.

### 2.1 Add Soft Delete to P0 Models

Schema migration:
```prisma
model Order     { deletedAt DateTime? deletedBy String? }
model Customer  { deletedAt DateTime? deletedBy String? }
model Material  { deletedAt DateTime? deletedBy String? }
```

Code changes:
- All DELETE handlers → soft delete
- All `findMany` → add `where: { deletedAt: null }`

**Data Migration Risk:** No data loss – additive change
**Backward Compatible:** Yes (filtered queries return same results)
**Rollback:** Revert schema + code; existing deletedAt rows stay but are harmless

### 2.2 Add PaymentLog
```prisma
model PaymentLog {
  id, paymentId, orderId, action, amount, createdBy, createdAt
}
```
**Backward Compatible:** Yes
**Rollback:** Drop table

---

## Phase 3 – Redis Integration (1-2 months)

**Goal:** Remove single points of failure from in-memory storage.

### 3.1 OCR Queue → BullMQ + Redis

```bash
# New docker-compose.yml addition:
redis:
  image: redis:alpine
  ports: ["6379:6379"]
  volumes: ["redis_data:/data"]
```

```typescript
// Replace OcrQueueService with BullMQ
const ocrQueue = new Queue('ocr-audit', { connection: redisConnection });
```

**Backward Compatible:** Yes – same `addJob()` interface
**Rollback:** Revert to OcrQueueService; drain BullMQ queue first
**Risk:** LOW if interface preserved

### 3.2 Report Cache → Redis

```typescript
// Replace in-memory Map with Redis
await redis.setex(`report:${type}:${hash}`, ttlSeconds, JSON.stringify(data));
```

**Backward Compatible:** Yes – cache is transparent
**Rollback:** Revert to Map; cache starts cold (no data loss)
**Risk:** Very Low

---

## Phase 4 – Image Storage Migration (2-3 months)

**Goal:** Move base64 images from MySQL to Cloudflare R2.

### Migration Script
```typescript
// Run offline: read base64 from DB → upload to R2 → update URL
const drivers = await prisma.driver.findMany({ where: { idCardPhoto: { not: null } } });
for (const driver of drivers) {
  const url = await uploadToR2(driver.idCardPhoto!);
  await prisma.driver.update({ where: { id: driver.id }, data: { idCardPhoto: url } });
}
```

**Risk:** HIGH – requires data integrity checks after migration
**Rollback:** Keep old base64 column until migration verified
**Backward Compatible:** Requires frontend change (multipart upload vs base64)

---

## Phase 5 – Horizontal Scaling (6+ months)

**Goal:** Support multiple server instances.

Requirements before this phase:
- Redis cache (Phase 3.2 complete)
- BullMQ (Phase 3.1 complete)
- Socket.IO Redis adapter added

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
io.adapter(createAdapter(pubClient, subClient));
```

**Load balancer:** Cloudflare → Nginx → [Express 1, Express 2, ...]
**Session stickiness:** Not required (Socket.IO with Redis adapter is stateless)
