# ADR-014: Use 127.0.0.1 Instead of localhost for Vite Dev Proxy

**Date:** 2026-05-12  
**Status:** ACCEPTED  
**Domain:** Infrastructure / Dev Environment

---

## Context

The GEP ERP development environment runs two concurrent processes:
- `Vite` (Frontend, port 3000) — starts in ~370ms
- `Express Backend` (port 5000) — starts in ~3-5s (Firebase Admin init + DB connection)

When both are launched together via `concurrently`, Vite boots first and immediately fires a Socket.IO polling request. At this point, port 5000 is not yet open.

Additionally, the system runs on Windows with Node.js ≥17.

## Problem

Node.js ≥17 changed DNS resolution behavior:
- `localhost` now resolves to IPv6 (`::1`) **before** IPv4 (`127.0.0.1`)  
- The Express backend binds to IPv4 `0.0.0.0` (includes `127.0.0.1`)  
- It does NOT bind to `::1` (IPv6)

This mismatch caused `AggregateError [ECONNREFUSED]` on every startup because:
1. Vite proxy resolves `localhost` → `::1`
2. Backend is not listening on `::1`
3. Connection refused → red error in terminal every startup

**Even after backend started**, the error appeared at startup causing confusion.

## Decision

Replace all `http://localhost:5000` proxy targets with `http://127.0.0.1:5000` in `vite.config.ts`.

Additionally, add `proxy.on('error')` handlers to silently suppress `ECONNREFUSED` errors during the startup race window (Vite up before backend), since these are expected and transient.

```typescript
// BEFORE (broken on Node.js ≥17 + Windows)
target: 'http://localhost:5000'

// AFTER (explicit IPv4, stable across all environments)
target: 'http://127.0.0.1:5000',
configure: (proxy) => {
  proxy.on('error', (err) => {
    if (err.code !== 'ECONNREFUSED') console.log('proxy error', err);
  });
}
```

## Consequences

✅ No `AggregateError` on startup  
✅ Socket.IO WebSocket reconnect stable  
✅ Works across Windows (Node ≥17), WSL, and Docker  
⚠️ If backend ever binds to a different interface, this needs updating  

## What Would Break If Reverted

Reverting to `localhost` on Node.js ≥17 + Windows = guaranteed `ECONNREFUSED` on every startup. The Socket.IO client would retry and eventually connect, but the terminal noise causes false alarms during monitoring.

## Files Changed

- `app/vite.config.ts` (E:\ MASTER workspace)
- `C:\Users\bachs\Downloads\weP-APP-main\vite.config.ts` (secondary, synced same session)
