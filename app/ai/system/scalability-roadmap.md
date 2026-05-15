# Scalability Roadmap – GEP ERP

> Defines scaling bottlenecks, their thresholds, and mitigation strategies.

---

## Current Scale (Baseline)

| Metric | Current | Safe Limit |
|--------|---------|-----------|
| Concurrent users | ~5-15 | ~50 |
| Active drivers | ~10 | ~30 |
| ProductRolls in DB | ~5,000 | ~100,000 |
| Orders per month | ~200 | ~2,000 |
| Report cache entries | ~50 | ~500 |
| Image storage | ~500MB in MySQL | ~5GB breaking point |

---

## Bottleneck Map

### BOTTLENECK-001: Report Cache (In-Memory Map)

**Threshold:** ~500 unique filter combinations
**Symptom:** Node.js heap grows; GC pauses; report latency increases
**Impact:** Dashboard slowdowns; report timeouts

**Mitigation:**
```
Current:  In-memory Map per Node process
Phase 3:  Redis (shared across processes, TTL-managed)
```

---

### BOTTLENECK-002: Trust Score N+1 Query

**Threshold:** ~30 drivers
**Symptom:** `GET /drivers` takes >2s; DB connection pool exhausted
**Impact:** Admin driver page hangs; timeout errors

**Mitigation:**
```
Current:  Compute trust score per driver per request (N+1)
Phase 1:  Persist trustScore on Driver model
Phase 2:  Background job recalculates on OCR review, not on GET
```

---

### BOTTLENECK-003: base64 Images in MySQL

**Threshold:** ~50 drivers with full document uploads (~5GB in LongText fields)
**Symptom:** Slow driver list queries; large backup files; DB memory pressure
**Impact:** Admin driver page slow; server OOM possible

**Mitigation:**
```
Current:  @db.LongText base64 in MySQL
Phase 4:  Cloudflare R2 (URL stored, not image data)
```

---

### BOTTLENECK-004: No Pagination

**Threshold:** ~1,000 rolls / ~500 orders / ~200 customers
**Symptom:** List API returns all records; JSON response >1MB; client freezes
**Impact:** Inventory page unusable; orders list unusable

**Mitigation:**
```
Current:  No pagination (returns all records)
Phase 2:  Add ?page&limit query params
         Response shape: { data: [...], total, page, limit, pages }
```

---

### BOTTLENECK-005: Single MySQL Instance

**Threshold:** ~10,000 transactions/day or report queries >500ms
**Symptom:** Report queries block transactional writes
**Impact:** Slow reports during business hours

**Mitigation:**
```
Current:  Single MySQL instance (Docker)
Target:   MySQL primary + read replica
          → Transactional writes → primary
          → Report reads → replica
Effort:   HIGH – requires managed MySQL (e.g., PlanetScale, RDS)
```

---

### BOTTLENECK-006: Single Socket.IO Server

**Threshold:** ~200 concurrent connections
**Symptom:** Events delayed; connection drops; reconnect storms
**Impact:** Real-time sync breaks; dashboard stale

**Mitigation:**
```
Current:  Socket.IO on single Express process
Phase 5:  Socket.IO + Redis adapter (events shared across processes)
          Multiple Express instances behind load balancer
```

---

## Scaling Decision Tree

```
Is concurrent users > 50?
  YES → Phase 5: Horizontal scaling + Redis Socket.IO adapter

Is driver count > 30?
  YES → Phase 1: Fix N+1 trust score + persist on Driver model

Is MySQL image data > 2GB?
  YES → Phase 4: Migrate images to Cloudflare R2

Are report queries > 500ms?
  YES → Phase 3: Redis cache
  YES (still slow) → Add MySQL read replica

Are list pages slow (>2s load)?
  YES → Phase 2: Add pagination

Is OCR queue losing jobs?
  YES → Phase 3: BullMQ + Redis
```

---

## Performance Targets (After Full Migration)

| Endpoint | Current | Target |
|----------|---------|--------|
| GET /reports/summary (cached) | <200ms | <50ms |
| GET /reports/summary (cold) | ~2s | ~500ms |
| GET /drivers | ~500ms (N+1) | <100ms |
| GET /orders (paginated) | N/A | <200ms |
| POST /rolls (scan-to-stock) | <300ms | <200ms |
| Socket event propagation | <500ms | <100ms |

---

## Infrastructure Evolution

```
NOW:
  [Docker MySQL] ← [Express + Socket.IO] ← [Cloudflare Tunnel] ← [Vite]

PHASE 3:
  [Docker MySQL]
  [Docker Redis] ← [Express + BullMQ Worker + Socket.IO] ← [Cloudflare Tunnel] ← [Vite]

PHASE 5:
  [MySQL Primary + Read Replica]
  [Redis Cluster]
  [Nginx Load Balancer]
    → [Express Instance 1 + Socket.IO (Redis adapter)]
    → [Express Instance 2 + Socket.IO (Redis adapter)]
  [Cloudflare → Nginx]
  [Cloudflare R2 (images)]
```
