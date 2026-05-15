# Engineering Rules – GEP ERP

> These rules govern how code is written, structured, and maintained in GEP. AI assistants MUST follow all rules when building features.

---

## RULE 1: Always Emit Socket.IO After Mutations

Every create/update/delete operation MUST emit a socket event.

```typescript
// ✅ CORRECT
const order = await prisma.order.update({ ... });
const io = req.app.get('io');
io.emit('order_updated', { orderId: order.id, status: order.status });

// ❌ WRONG – mutation without event
const order = await prisma.order.update({ ... });
// missing socket emit
```

Failure to emit breaks: realtime sync, report cache invalidation, live dashboard.

---

## RULE 2: NEVER Write to DB Inside a GET Handler

GET handlers are reads. No side-effects allowed.

```typescript
// ❌ WRONG – detected in drivers.controller.ts
export const getDrivers = asyncHandler(async (req, res) => {
  const drivers = await prisma.driver.findMany({ ... });
  // Auto-fixing stale status inside GET
  await prisma.driver.update({ data: { status: 'leave' } }); // ← BANNED
});

// ✅ CORRECT – use a background job or dedicated status-sync endpoint
```

**Exception**: `lastLoginAt` updates in auth flow only.

---

## RULE 3: No N+1 Queries

Never query inside a loop.

```typescript
// ❌ WRONG
const drivers = await prisma.driver.findMany();
for (const driver of drivers) {
  const count = await prisma.shippingOrder.count({ where: { assignedDriverId: driver.id } });
}

// ✅ CORRECT
const [drivers, counts] = await Promise.all([
  prisma.driver.findMany(),
  prisma.shippingOrder.groupBy({ by: ['assignedDriverId'], _count: true }),
]);
```

---

## RULE 4: Use asyncHandler for ALL Controllers

```typescript
// ✅ CORRECT
export const createOrder = asyncHandler(async (req, res) => { ... });

// ❌ WRONG
export const createOrder = async (req, res) => {
  try { ... } catch (e) { res.status(500).json({ error: e.message }); }
};
```

---

## RULE 5: Always Log to Audit Trail

Business mutations need audit logs:

| Action | Audit Method |
|--------|-------------|
| Order status change | OrderLog entry |
| Payment recorded | (no current log – gap) |
| Production status | UserActivityLog |
| User role change | (no current log – gap) |
| Permission change | (no current log – gap) |

---

## RULE 6: Validate Before Persist

```typescript
// ✅ Pattern
if (!orderId || !amount || amount <= 0) {
  return sendError(res, 'orderId và amount > 0 là bắt buộc', 400);
}
```

Never persist invalid data and fix it in a patch later.

---

## RULE 7: No Hardcoded Business Constants

```typescript
// ❌ WRONG
const WAREHOUSE_CAPACITY = 500; // hardcoded in reports.controller.ts

// ✅ CORRECT
const config = await prisma.systemConfig.findUnique({ where: { key: 'warehouse_capacity' } });
const WAREHOUSE_CAPACITY = parseInt(config?.value || '500');
```

---

## RULE 8: Fire-and-Forget Must Have Error Handling

```typescript
// ❌ WRONG
OcrQueue.addJob('fuel_receipt_audit', data).catch(console.error);

// ✅ CORRECT
try {
  await OcrQueue.addJob('fuel_receipt_audit', data);
} catch (err) {
  logger.error('Failed to queue OCR job', { err, data });
  // Do NOT fail the main request, but DO log
}
```

---

## RULE 9: Prisma Relations Must Use `select` Not `include` When Performance Matters

```typescript
// ❌ WRONG for large tables
include: { rolls: true }  // returns ALL roll fields

// ✅ CORRECT
include: { rolls: { select: { id: true, status: true } } }
```

---

## RULE 10: sendSuccess / sendError Pattern

```typescript
import { sendSuccess, sendError } from '../utils/apiResponse.js';

sendSuccess(res, data);           // 200
sendSuccess(res, data, 201, 'Created');
sendError(res, 'Not found', 404);
```

Never use `res.json()` or `res.status().json()` directly.

---

## RULE 11: OCR Pipeline Must Be Idempotent

Every OCR job must check for existing `OcrAuditLog` by `referenceId` to prevent duplicate audits on retry.

---

## RULE 12: Images Are base64 in MySQL (Do Not Change Without Migration)

Current storage: `@db.LongText` fields store base64 data URLs.
Do NOT switch to file paths without a data migration plan.
