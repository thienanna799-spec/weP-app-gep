# System Architecture – GEP ERP

## Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT (Browser / Mobile)                                      │
│  React 18 + TypeScript + Vite + TailwindCSS + Socket.IO-client │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS / WSS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cloudflare Tunnel  (gepoder.click → localhost:3000)            │
│  Tunnel ID: f7071c41-9ca4-4bf0-9658-13d94e6b8a46               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
         ┌────────────────┴──────────────────┐
         ▼                                   ▼
┌──────────────────┐              ┌───────────────────────────────┐
│  Vite Dev Server │              │  Express.js Backend           │
│  :3000           │              │  :5000                        │
│  (frontend SPA)  │              │  server.ts                    │
│                  │ /api/*       │  ├── /api → router.ts        │
│  Proxy /api →    ├─────────────►│  ├── Socket.IO               │
│  localhost:5000  │              │  └── /uploads static         │
└──────────────────┘              └──────────────┬────────────────┘
                                                 │ Prisma ORM
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │  MySQL 8 (Docker)            │
                                  │  container: bocchongsoc_db   │
                                  │  port: 3306                  │
                                  └──────────────────────────────┘
```

## Entry Points

| File | Purpose |
|------|---------|
| `server.ts` | Express + Socket.IO server entry point |
| `server/src/router.ts` | All API routes (395 lines, 31 controllers) |
| `src/main.tsx` | React app entry |
| `src/App.tsx` | Routes + Socket.IO connection + permission loading |
| `startup.bat` | Windows startup: Docker → MySQL health → npm run dev → cloudflared |

## Key Infrastructure Decisions

### 1. Monorepo Structure
- Frontend (Vite/React) and Backend (Express) in the **same repository**
- Backend is in `/server/` subfolder
- Shared TypeScript config
- Frontend proxies API through Vite dev server (no CORS issues in dev)

### 2. Authentication
- **Firebase Auth** handles Google OAuth login
- Backend validates Firebase ID token → creates/finds User in MySQL
- Returns a custom session (no JWT stored separately – relies on Firebase token)
- See `server/src/middlewares/auth.middleware.ts`
- See `server/src/lib/firebase-admin.ts`

### 3. Database
- **MySQL 8** in Docker container named `bocchongsoc_db`
- **Prisma ORM** for type-safe queries
- Schema: `server/prisma/schema.prisma` (1285 lines, ~40 models)
- Connection: `DATABASE_URL=mysql://root:matkhau@localhost:3306/bocchongsoc`

### 4. Real-time
- **Socket.IO** on same Express HTTP server (port 5000)
- Transports: polling first, then upgrade to websocket (required for Cloudflare)
- 5 global events: `order_updated`, `inventory_updated`, `shipping_updated`, `user_updated`, `driver_vehicle_updated`
- Events auto-invalidate in-memory report cache

### 5. File Uploads
- Stored as **base64 in MySQL** (`@db.LongText`) for simplicity
- Served via `/uploads` static route for physical files
- No CDN or S3 currently (limitation)

### 6. Report Caching
- In-memory Map cache in `server/src/lib/report-cache.ts`
- HOT TTL: 5 minutes (summary/KPI reports)
- COLD TTL: 1 hour (historical aggregations)
- Auto-invalidated on Socket.IO events

### 7. Notifications
- **Telegram Bot** (`telegram.service.ts`) for operational alerts:
  - Debt alerts, low stock, order status, invoice delivery
- No email notifications currently

### 8. OCR Pipeline
- `server/src/services/ocr/` – Google Vision / FPT AI / mock providers
- Triggered via webhook: `POST /api/webhooks/ocr/audit`
- Audit results stored in `OcrAuditLog` model
- Fraud detection: duplicate receipt, amount mismatch, impossible mileage

## Missing Infrastructure (Gaps)

| Gap | Risk | Suggestion |
|-----|------|-----------|
| No Redis | Cache lost on restart | Add Redis for persistent cache |
| No job queue | OCR / alerts are synchronous | Add Bull/BullMQ for background jobs |
| No S3/CDN | Images in DB (slow/large) | Migrate to Cloudflare R2 or S3 |
| No rate limiting | API abuse possible | Add express-rate-limit |
| No API versioning | Breaking changes risky | Add `/api/v1/` prefix |
| No health dashboard | Silent failures | Add Sentry or similar |
| Single server | No HA | Could fail during delivery ops |
