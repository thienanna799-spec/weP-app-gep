# ADR-007: Database – MySQL vs PostgreSQL

**Date:** 2026-05-10
**Status:** IMPLEMENTED (MySQL – no change planned)
**Deciders:** Engineering team

---

## Context

GEP needs a relational database for transactional ERP data: orders, inventory, finance, drivers, procurement.

## Decision

**Implemented:** MySQL 8.0 via Docker + Prisma ORM

## Why MySQL

| Factor | MySQL | PostgreSQL |
|--------|-------|-----------|
| Familiarity | ✅ More common in Vietnam dev ecosystem | Less common |
| Docker simplicity | ✅ `mysql:8` image stable | ✅ Same |
| Prisma support | ✅ First-class | ✅ First-class |
| Vietnamese string handling | ✅ `utf8mb4_unicode_ci` | ✅ `UTF8` |
| JSON columns | ✅ MySQL 8+ | ✅ Better (JSONB) |
| Full-text search | ✅ Basic | ✅ Better |
| Transactional DDL | ❌ No | ✅ Yes |
| Array columns | ❌ No | ✅ Yes |
| Hosting options in VN | ✅ Widely available | ✅ Available |

## Schema Decisions Made for MySQL

### Vietnamese Enum Values via `@map`
```prisma
enum OrderStatus {
  cho_duyet @map("chờ duyệt")
  da_duyet  @map("đã duyệt")
}
```
MySQL stores the English key; Prisma maps to Vietnamese label.
**DO NOT change this pattern** – production data contains Vietnamese strings.

### LongText for Base64 Images
```prisma
avatar String? @db.LongText
```
MySQL requires explicit `@db.LongText` for large strings.
PostgreSQL would use `TEXT` (unlimited by default).

### No Soft Delete Currently
MySQL supports this but Prisma needs explicit `deletedAt` field.
PostgreSQL row-level security would offer more options.

## Connection Configuration

```typescript
// schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// .env
DATABASE_URL="mysql://user:password@localhost:3306/gepdb?charset=utf8mb4"
```

## Tradeoffs

**Accepted:**
- No transactional DDL (migrations can partially fail)
- No native array columns (use JSON or separate tables)
- No JSONB indexing (slow JSON queries)

**Mitigations:**
- Prisma migrate runs in controlled deployment windows
- Arrays implemented as separate related tables (good practice anyway)

## Future

If migrating to PostgreSQL:
1. Export all data
2. Update `schema.prisma` datasource
3. Review `@map` enums (PostgreSQL handles UTF-8 natively without mapping tricks)
4. Remove all `@db.LongText` annotations
5. Consider JSONB for SystemConfig and filter fields
6. Consider PlanetScale (MySQL-compatible) or Supabase (PostgreSQL) for managed hosting
