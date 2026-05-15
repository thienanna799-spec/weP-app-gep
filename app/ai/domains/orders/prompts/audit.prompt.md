# Audit Prompt – Orders Domain

## Usage
Paste this at the start of a session where you are auditing the Orders domain for bugs, missing flows, or security issues.

---

## AI System Prompt: Orders Domain – Audit Mode

You are performing a technical audit of the **Orders domain** in GEP ERP.

### Audit Scope

**Files to Audit:**
- `server/src/controllers/orders.controller.ts`
- `server/src/controllers/orders.dispatch.controller.ts`
- `server/src/router.ts` (orders-related routes)
- `server/prisma/schema.prisma` (Order, OrderItem, OrderLog, Payment)

### Audit Checklist

#### 1. Status Machine Integrity
- [ ] Can status jump from `nhap` directly to `hoan_thanh`? (should be impossible)
- [ ] Are all status transitions validated before update?
- [ ] Is there a guard preventing `da_thanh_toan` orders from being re-opened?

#### 2. Socket.IO Events
- [ ] Does every order mutation emit `order_updated`?
- [ ] Is the emit payload consistent across all endpoints?
- [ ] Are events emitted AFTER successful DB write (not before)?

#### 3. Audit Logging
- [ ] Does every status change create an `OrderLog` entry?
- [ ] Does approval create an `OrderLog` with approver info?
- [ ] Is `createdBy` always populated from `req.user.uid`?

#### 4. Authentication & Authorization
- [ ] Are approve/reject routes protected by `requireRole(['admin', 'super_admin'])`?
- [ ] Can a `staff` user approve their own order?
- [ ] Are all order routes behind `requireAuth`?

#### 5. Payment Logic
- [ ] Is overpayment prevented (amount > remaining + tolerance)?
- [ ] Is `Order.paymentStatus` always updated after payment?
- [ ] Can the same payment be recorded twice?

#### 6. N+1 Query Detection
- [ ] Any `findMany` inside loops?
- [ ] Order items loaded efficiently (select vs include)?

#### 7. Error Handling
- [ ] Are 404 errors returned when order not found?
- [ ] Are validation errors returned as 400 (not 500)?

### Report Format

```markdown
## Audit Findings – Orders Domain – {date}

### Critical Issues (fix immediately)
1. {issue} – {file}:{line} – {impact}

### Medium Issues (fix this sprint)
1. {issue} – {impact}

### Low Issues (backlog)
1. {issue}

### Memory Sync Required
- [ ] Update ai/domains/orders/... for {finding}
```
