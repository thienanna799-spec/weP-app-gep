# ADR-008: Architecture – Monolith vs Microservices

**Date:** 2026-05-10
**Status:** IMPLEMENTED (Monolith – planned modular evolution)
**Deciders:** Engineering team

---

## Context

GEP is a multi-domain ERP system with 13 business domains. The architecture must be chosen to balance:
- Development speed
- Operational complexity
- Team size (small team)
- Current user scale (~15 concurrent users)

## Decision

**Implemented:** Modular Monolith

All domains reside in a single Express.js server:
```
server/
  src/
    controllers/    ← one file per domain
    services/       ← shared services
    lib/            ← shared utilities
    router.ts       ← single entry point for all routes
```

## Why Monolith (for now)

| Factor | Monolith | Microservices |
|--------|----------|--------------|
| Team size | ✅ 1-3 devs, single codebase | Requires per-service ownership |
| Operational overhead | ✅ One server, one deploy | N servers, N deploys |
| Shared Prisma client | ✅ Direct DB access | Requires API gateway or shared DB (anti-pattern) |
| Cross-domain transactions | ✅ Prisma `$transaction` | Distributed transactions (2PC complexity) |
| Debugging | ✅ Single process, single log | Distributed tracing needed |
| Current load | ✅ Handles easily | Over-engineering for scale |
| Time to build | ✅ Faster | Slower setup |

## Current Modular Structure

Although monolithic, the codebase is modular by domain:
```
controllers/orders.controller.ts      ← Orders domain
controllers/inventory.controller.ts   ← Inventory domain
controllers/finance.controller.ts     ← Finance domain
services/telegram.service.ts          ← Shared notification
services/ocr/                         ← OCR pipeline service
lib/report-cache.ts                   ← Shared cache utility
```

This means extraction to microservices is possible without full rewrite.

## Cross-Domain Coupling (Why Monolith is Safe Here)

GEP has intentional cross-domain coupling that benefits from single-process:
```
Order approved → triggers inventory pick → triggers shipping → triggers finance
```
In microservices, this requires:
- Event choreography (Kafka topics)
- Saga patterns for rollback
- Distributed transaction management

In monolith:
```typescript
await prisma.$transaction([
  prisma.order.update({ ... }),
  prisma.productRoll.update({ ... }),
  prisma.orderLog.create({ ... }),
]);
```

## Future: Modular Monolith → Selected Microservices

**Do NOT extract everything.** Extract only services with clear boundaries and high isolation needs:

| Service | Extract? | Reason |
|---------|:--------:|--------|
| OCR Processing | ✅ Yes | CPU-intensive, can scale independently |
| Notification (Telegram) | ✅ Yes | External API, failure should not affect core |
| Report Generation | ✅ Yes | Read-only, expensive queries |
| Auth Middleware | ❌ No | Tightly coupled to every request |
| Finance/Orders/Inventory | ❌ No | Too much cross-domain coupling |

**Extraction path for OCR:**
```
Monolith OcrQueue (in-memory)
  → BullMQ + Redis Worker (same server but separate process)
  → Dedicated OCR microservice with its own deployment
```

## AI Constraint

**Do NOT propose microservices refactoring for P0/P1 domains** (finance, inventory, orders).
The cross-domain transaction safety in Prisma `$transaction` is a critical risk-reduction mechanism.
Distributing these domains requires distributed transaction patterns that introduce more risk than they solve at current scale.
