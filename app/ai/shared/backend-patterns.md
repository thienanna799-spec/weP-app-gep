# Backend Patterns — GEP ERP Server
type: skill
scope: antigravity
version: 1.0 (extracted from codebase)

## Stack
- **Runtime:** Node.js + TypeScript (ESM, `"type": "module"`)
- **Framework:** Express.js
- **ORM:** Prisma 5 + MySQL
- **Auth:** Firebase Admin SDK (JWT verify in middleware)
- **Realtime:** Socket.IO 4

---

## Project Layout

```
server/
  src/
    controllers/    ← Route handlers (thin — only HTTP in/out)
    services/       ← Business logic
    middlewares/    ← auth.middleware.ts, etc.
    lib/
      prisma.ts     ← Singleton Prisma client
      firebase-admin.ts
      report-cache.ts
    utils/
      apiResponse.ts  ← sendSuccess / sendError
      asyncHandler.ts ← wrap async route handlers
    router.ts       ← All route registrations (single file)
```

---

## Controller Pattern (EXACT template)

```typescript
import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/** Emit socket event helper — always use this pattern */
function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** GET /api/resource */
export const getResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await prisma.resource.findMany({ orderBy: { createdAt: 'desc' } });
  sendSuccess(res, data);
});

/** POST /api/resource */
export const createResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const record = await prisma.resource.create({ data: req.body });
  emitSync(req, 'resource_updated', { id: record.id, type: 'created' });
  sendSuccess(res, record, 201, 'Resource created');
});
```

**Rules:**
- ALWAYS wrap handlers with `asyncHandler()` — never use `try/catch` in controllers directly
- ALWAYS use `sendSuccess` / `sendError` — never use `res.json()` directly
- ALWAYS get `io` via `req.app.get('io')` — never import io directly
- NEVER put business logic in controllers — delegate to services

---

## API Response Format

**Success:**
```json
{ "success": true, "message": "optional string", "data": <payload> }
```

**Error:**
```json
{ "success": false, "message": "Human readable error" }
```

`sendSuccess(res, data, statusCode = 200, message?)`
`sendError(res, message, statusCode = 400)`

---

## Prisma Patterns

### Singleton Client — always import from lib
```typescript
import { prisma } from '../lib/prisma.js';
```
**Never** `new PrismaClient()` anywhere else.

### Transaction — REQUIRED for P0 domains (Finance, Inventory, Orders)
```typescript
const result = await prisma.$transaction(async (tx) => {
  const a = await tx.order.update({ where: { id }, data: { status: 'da_duyet' } });
  await tx.productRoll.updateMany({ where: { orderId: id }, data: { status: 'da_giu_cho_don' } });
  return a;
});
```
**Rule:** Any mutation that touches >1 model in P0 domains MUST use `$transaction`.

### Activity Log Pattern — required for P0 mutations
```typescript
await prisma.userActivityLog.create({
  data: {
    userId: req.user!.uid,
    email: req.user!.email,
    action: 'Tạo đơn hàng mới',
    module: 'Quản lý đơn hàng',
    referenceId: record.id,
    description: `Đơn hàng #${record.code}`,
  },
});
```

### Pagination — standard pattern
```typescript
const { page = '1', limit = '20' } = req.query as any;
const skip = (parseInt(page) - 1) * parseInt(limit);
const [data, total] = await Promise.all([
  prisma.resource.findMany({ skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
  prisma.resource.count({ where }),
]);
sendSuccess(res, { data, total, page: parseInt(page), limit: parseInt(limit) });
```

---

## Auth Middleware

```typescript
import { AuthRequest } from '../middlewares/auth.middleware.js';
// req.user is always available after auth middleware
// Shape: { uid: string, email: string, name: string, role: UserRole }
```

**Role check pattern:**
```typescript
if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
  sendError(res, 'Không đủ quyền', 403);
  return;
}
```

---

## Error Handling

- Controller errors propagate via `next(err)` automatically (handled by `asyncHandler`)
- Centralized error handler in `server.ts` catches all unhandled errors
- **Never** `throw` in controllers — `sendError` and `return`

```typescript
if (!record) { sendError(res, 'Not found', 404); return; }
```

---

## Router Registration

All routes go in `server/src/router.ts` — single file.
Pattern:
```typescript
router.get('/orders', authenticate, getOrders);
router.post('/orders', authenticate, requireRole(['admin', 'staff']), createOrder);
```
