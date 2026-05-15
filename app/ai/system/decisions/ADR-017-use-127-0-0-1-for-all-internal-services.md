# ADR-017: Use 127.0.0.1 Instead of localhost for ALL Internal Service URLs

**Date:** 2026-05-13
**Status:** ACCEPTED
**Domain:** Infrastructure / Dev Environment / SSD Portability

---

## Context

ADR-014 documented the fix for Vite proxy using `127.0.0.1` instead of `localhost` due to Node.js ≥17 DNS resolution changes on Windows. However, the fix was only applied to `vite.config.ts` and not to `DATABASE_URL` in `app/.env`.

On 2026-05-13, after moving the SSD to a new PC, `localhost` in `DATABASE_URL` again resolved to IPv6 `::1` first — causing total login failure (CRITICAL severity, 100% downtime on gepoder.click).

## Problem

Node.js ≥17 changed DNS resolution behavior on Windows:
- `localhost` → resolves `::1` (IPv6) **FIRST**, then `127.0.0.1` (IPv4)
- MySQL Docker container binds to IPv4 only (`0.0.0.0` = `127.0.0.1`)
- Prisma/mysql2 driver attempted `::1:3306` → **ECONNREFUSED**
- ALL database queries failed → auth controller crashed with 500
- System completely inaccessible

**Diagnostic fingerprint:**
```
Error: connect ECONNREFUSED ::1:3306
```
or silent 500 on `/api/auth/google` with no response body.

## Decision

**SYSTEM-WIDE RULE:** All internal service connection strings MUST use `127.0.0.1` instead of `localhost`.

This applies to:
- `DATABASE_URL` in `.env` → `mysql://root:matkhau@127.0.0.1:3306/...`
- Redis connection strings (if added in future) → `redis://127.0.0.1:6379`
- Any other localhost-bound service

```env
# CORRECT (explicit IPv4 — works on all Windows + Node.js >=17)
DATABASE_URL="mysql://root:matkhau@127.0.0.1:3306/bocchongsoc"

# WRONG (breaks on Node.js >=17 + Windows DNS resolution)
DATABASE_URL="mysql://root:matkhau@localhost:3306/bocchongsoc"
```

## Consequences

✅ Database connection stable across all machines (SSD portability)
✅ No ECONNREFUSED on Node.js ≥17 + Windows
✅ Consistent with ADR-014 Vite proxy fix
⚠️ If any service explicitly requires IPv6, must override individually

## What Would Break If Reverted

Reverting to `localhost` = guaranteed DB connection failure on:
- Any Windows machine with Node.js ≥17
- Any machine where IPv6 is enabled in /etc/hosts or Windows hosts file

## SSD Portability Checklist

When moving SSD to a new PC, verify these files use `127.0.0.1`:
- [ ] `app/.env` → `DATABASE_URL`
- [ ] `app/.env` → any Redis/service URL
- [ ] `app/vite.config.ts` → already fixed (ADR-014)
- [ ] `startup.bat` → docker rm -f cleanup before docker-compose up (ADR-017 / EVT-2026-05-13-010)

## Files Changed

- `app/.env` — DATABASE_URL: `localhost` → `127.0.0.1`
- `startup.bat` — Added orphan container cleanup before `docker-compose up -d`
- `app/.env.example` — Added documentation comment for 127.0.0.1 requirement

## Related

- ADR-014: Vite proxy 127.0.0.1 fix (same root cause, different layer)
- EVT-2026-05-13-010: Docker orphan container SSD portability fix
- EVT-2026-05-13-011: DATABASE_URL localhost IPv6 resolution fix
