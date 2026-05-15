# API Conventions – GEP ERP

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://gepoder.click/api` (via Cloudflare Tunnel → Vite proxy → Express)

## Authentication Header
```
Authorization: Bearer <firebase-id-token>
```

## Response Format

### Success
```json
// Single resource
{ "id": "...", "code": "...", ... }

// List
[{ ... }, { ... }]

// With meta (some endpoints)
{ "data": [...], "total": 100, "page": 1 }
```

### Error
```json
{ "error": "Human readable message" }
```
HTTP Status codes: 400 (bad request), 401 (unauthenticated), 403 (forbidden), 404, 500

## Pagination
- Not consistently implemented across all endpoints
- Most list endpoints return ALL records (no pagination)
- Filter via query params: `?status=active&search=keyword&dateFrom=2026-01-01&dateTo=2026-12-31`

## Common Query Params

| Param | Type | Used In |
|-------|------|---------|
| `search` | string | customers, orders, materials |
| `status` | string | orders, shipping, production-orders |
| `dateFrom` / `dateTo` | ISO date | reports, orders, production |
| `customerId` | string | orders |
| `driverId` | string | shipping, fuel-logs |

## Naming Conventions

| Convention | Example |
|-----------|---------|
| Resources: plural kebab-case | `/production-orders`, `/purchase-orders` |
| Actions: verb at end | `/orders/:id/approve`, `/rolls/:id/scan-to-stock` |
| Sub-resources | `/customers/:id/pricing`, `/vehicles/:id/maintenances` |
| Special lookups | `/rolls/qr/:qrCode`, `/customers/search` |

## File Upload
- `POST /orders/:id/delivery-proofs` – multipart form (field: `file`)
- Most other "uploads" are base64 strings in JSON body

## Picking Slip / Invoice (PDF)
```
GET /shipping/:id/picking-slip/data    → JSON data
GET /shipping/:id/picking-slip/preview → HTML preview
GET /shipping/:id/picking-slip/pdf     → Download PDF

GET /invoices/:orderId/data            → JSON data
GET /invoices/:orderId/preview         → HTML preview
GET /invoices/:orderId/pdf             → Download PDF
POST /invoices/:orderId/send-telegram  → Send PDF via Telegram
```

## Webhook
```
POST /api/webhooks/ocr/audit  → OCR audit trigger (no auth required)
```

## Frontend API Client
- `src/services/api.ts` – Axios instance with base URL + auth interceptor
- Auto-injects Firebase token from current user session
