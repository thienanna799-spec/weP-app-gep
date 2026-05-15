# ADR-003: Soft Delete vs Hard Delete

**Date:** 2026-05-10
**Status:** OPEN (soft delete not yet implemented)
**Deciders:** Engineering team

---

## Context

GEP currently uses hard delete for all entities (customers, orders, materials, drivers, rolls). This means deleted records are permanently removed from the database, with no recovery mechanism.

## Problem

```typescript
// Current: hard delete everywhere
await prisma.customer.delete({ where: { id } });
// → Customer gone permanently
// → OrderLog still references customerId: null
// → Historical orders lose customer association
// → No audit of who deleted, when, or why
```

**Real business risk:** Admin accidentally deletes a customer with 50 active orders → all order history loses customer context.

## Decision

**Planned:** Implement soft delete for P0/P1 models.

Priority order:
1. `Customer` (affects all orders, revenue history)
2. `Material` (affects BOM, production history)
3. `Order` (most critical – should rarely be deleted)
4. `Driver` (affects shipping history)
5. `ProductRoll` (affects inventory audit)

## Implementation Pattern

```prisma
// Schema change
model Customer {
  // ... existing fields
  deletedAt DateTime?
  deletedBy String?
}
```

```typescript
// DELETE handler becomes soft-delete
await prisma.customer.update({
  where: { id },
  data: {
    deletedAt: new Date(),
    deletedBy: req.user!.uid,
  }
});

// All findMany must filter
await prisma.customer.findMany({
  where: {
    deletedAt: null,  // REQUIRED on all queries
    ...otherFilters
  }
});
```

## Alternatives Considered

| Option | Recovery? | Audit? | Complexity |
|--------|:---------:|:------:|-----------|
| **Hard delete (current)** | ❌ | ❌ | Zero |
| **Soft delete (deletedAt)** | ✅ (restore) | ✅ | Low |
| **Archive table** | ✅ | ✅ | High |
| **Event sourcing** | ✅ | ✅ | Very High |

## Migration Risks

1. Every `findMany` must add `deletedAt: null` – easy to forget
2. Cascading deletes (`onDelete: Cascade`) become soft cascades – need explicit handling
3. Unique constraints may conflict with soft-deleted records (e.g., deleted customer.phone reused)

**Unique constraint fix:**
```prisma
// Old: @unique
phone String @unique

// New: uniqueness enforced only for active records (application-level check)
phone String
// + unique index only on (phone, deletedAt IS NULL) – not directly Prisma-expressible
```

## Consequences

Currently **DEBT-002** and **RISK-001** in the system. High priority for P0 domain entities.
