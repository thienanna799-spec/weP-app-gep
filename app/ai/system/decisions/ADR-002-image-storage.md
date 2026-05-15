# ADR-002: Image Storage – base64 in MySQL vs Object Storage

**Date:** 2026-05-10
**Status:** OPEN (migration planned, not started)
**Deciders:** Engineering team

---

## Context

GEP's mobile driver app uploads photos for fuel receipts, odometer readings, vehicle damage, and ID documents. The current approach stores these as base64-encoded strings in MySQL `LongText` fields.

## Problem

**Current storage:**
```prisma
model Driver {
  avatar        String? @db.Text
  idCardPhoto   String? @db.LongText   // ~1-5 MB each
  licensePhoto  String? @db.LongText
}

model DailyFuelEntry {
  fuelKmPhoto   String? @db.LongText
  fuelCostPhoto String? @db.LongText
}
```

**Issues at scale:**
1. MySQL rows become extremely large → table scans slow
2. Each query fetching driver list pulls megabytes of photo data unnecessarily
3. 25MB Express body limit caps photo quality
4. Backups include all binary data → backup files huge
5. No CDN delivery → images served through API server

## Decision

**Current:** base64 in MySQL (no change)

**Planned:** Migrate to **Cloudflare R2** (object storage):
- Free egress within Cloudflare network
- Compatible with S3 API
- No CDN configuration needed (built-in)

## Alternatives Considered

| Option | Storage Cost | Egress Cost | Complexity |
|--------|-------------|------------|-----------|
| **MySQL base64 (current)** | MySQL row size | Served via Express | Zero |
| **Cloudflare R2** | $0.015/GB-month | Free within CF | Low |
| **AWS S3** | $0.023/GB-month | $0.09/GB | Low |
| **Local filesystem** | Server disk cost | Served via Express | Zero |

## Tradeoffs

**Staying with base64:**
- ✅ Zero external dependencies
- ✅ Already working
- ❌ Performance degrades at scale
- ❌ Difficult to serve via CDN

**Migrating to R2:**
- ✅ Purpose-built for file storage
- ✅ Fast CDN delivery
- ✅ Can enforce file size limits at upload
- ❌ Requires migration script for existing data
- ❌ `~5-7 days` migration effort

## Migration Plan

```
Phase 1: New uploads → R2 (code change, no DB migration)
  → Change frontend to send multipart/form-data instead of base64
  → Change backend to upload to R2, store URL in DB field
  → DB field type: @db.Text (URL, not base64)

Phase 2: Existing data → R2 (data migration)
  → Write migration script: read base64 → decode → upload to R2 → update URL
  → Run in batches of 100 records
  → Verify each batch before proceeding

Phase 3: Clean up LongText fields
  → Change schema from @db.LongText to @db.Text (URL length)
  → Run Prisma migration
```

## Consequences

Currently creates **DEBT-004** in the system. Safe to delay until driver count exceeds 50.
