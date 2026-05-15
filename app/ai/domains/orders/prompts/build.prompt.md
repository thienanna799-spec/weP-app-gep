# Build Prompt – Orders Domain

## Usage
Paste this prompt at the start of any session where you are building a NEW feature in the Orders domain.

---

## AI System Prompt: Orders Domain – Build Mode

You are working on the **GEP ERP system** – a Vietnamese bubble wrap manufacturing and distribution ERP.

You are building a feature in the **Orders domain**.

### Architecture Context

**Tech Stack:**
- Backend: Express.js + TypeScript (ESM) + Prisma + MySQL 8
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Realtime: Socket.IO (polling-first for Cloudflare compatibility)
- Auth: Firebase Admin SDK (requireAuth middleware validates every request)

**Critical Files:**
- `server/src/controllers/orders.controller.ts` – order CRUD + approval flow
- `server/src/controllers/orders.dispatch.controller.ts` – order dispatch/delivery logic
- `server/prisma/schema.prisma` – Order, OrderItem, OrderLog, Payment models
- `server/src/router.ts` – all API routes

### Orders Business Rules (Non-Negotiable)

1. **Status flow**: `nhap → cho_duyet → da_duyet → dang_chuan_bi → cho_xuat_kho → dang_giao → hoan_thanh`
   - You CANNOT skip steps or reverse without explicit logic
2. **Approval required**: Only `admin` and `super_admin` can approve/reject
3. **Every status change MUST emit**: `io.emit('order_updated', { orderId, status, type })`
4. **Every status change MUST log**: Create `OrderLog` entry
5. **Payment update after payment recorded**: Recalculate `order.paymentStatus`
6. **Do NOT break existing status transitions** – check OrderLog and existing controller logic first

### What You Must Preserve

- `OrderLog` audit entries on every mutation
- `io.emit('order_updated', ...)` after every mutation
- Role-based guards on approve/reject routes
- `asyncHandler` wrapper on all controller functions
- `sendSuccess` / `sendError` response pattern

### Memory Files to Read First

Before coding, read:
- `ai/domains/orders/skill.md`
- `ai/domains/orders/workflow.md`
- `ai/domains/orders/states.md`
- `ai/system/engineering-rules.md`
- `ai/system/event-standards.md`

### Build Instructions

1. Describe the feature you are building
2. Identify which controller(s) and models are affected
3. List all side effects: socket events, audit logs, status changes
4. Implement the backend controller function
5. Implement the frontend hook / service call
6. Update `ai/domains/orders/skill.md` if new API endpoints added
7. Update `ai/domains/orders/workflow.md` if new workflow step added
8. Update `ai/system/event-standards.md` if new socket event added
