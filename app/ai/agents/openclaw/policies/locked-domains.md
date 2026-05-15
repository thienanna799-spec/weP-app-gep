# OpenClaw Policy: Locked Domains

> **Classification:** 🔴 LOCKED
> **Domains:** `finance`, `inventory`, `orders`
> **Authority:** OpenClaw has unconditional VETO POWER

---

## What LOCKED Means

A LOCKED domain is one where:
1. **A single mistake can cause irreversible data damage**
2. **Bugs directly impact financial integrity or stock accuracy**
3. **Errors cannot be easily rolled back in production**

LOCKED status means OpenClaw will **BLOCK execution** if ANY constraint is violated.
There is **no override mechanism** for LOCKED domain constraints.

---

## finance – P0 LOCKED

### Business Context
Manages: Revenue recognition, Accounts Receivable, Payment records, Invoice generation, Bank reconciliation

### Absolute Constraints

```
✅ MUST:
  - Use integer arithmetic for ALL VND monetary values
  - Create Payment atomically: amount validation + create + paymentStatus update
  - Validate: newPayment.amount ≤ (totalRevenue - totalPaid) + 1 VND tolerance
  - Recalculate paymentStatus after every payment operation
  - Use prisma.$transaction([...]) for multi-step payment operations
  - Append PaymentLog (or similar) for every payment action

❌ MUST NOT:
  - Delete or modify existing Payment records (IMMUTABLE)
  - Use parseFloat(), .toFixed(), or /100 for money calculations
  - Recognize revenue from orders with status ≠ hoan_thanh (exception: current system includes dang_giao – do not change without explicit approval)
  - Bypass amount validation logic
  - Allow negative payment amounts
  - Process payments without verifying BankAccount balance
```

### Critical Financial Flows (NEVER touch without full plan)
1. `POST /finance/payments` – payment creation with status recalculation
2. `GET /finance/dashboard` – KPI calculation (revenue, AR, AP)
3. `POST /finance/invoices` – PDF generation + Telegram send
4. Debt alert scheduled job – Telegram notification trigger

---

## inventory – P0 LOCKED

### Business Context
Manages: ProductRoll lifecycle (dang_san_xuat → trong_kho → da_giu_cho_don → da_xuat_kho → loi_hong), QR scanning, warehouse capacity

### Absolute Constraints

```
✅ MUST:
  - Validate roll.status against allowed transitions BEFORE update
  - Wrap pick-roll operations in prisma.$transaction([...])
  - Create RollScanHistory entry for EVERY QR scan action
  - Emit io.emit('inventory_updated', {...}) after EVERY roll status change
  - Validate QR code uniqueness before creating new roll

❌ MUST NOT:
  - Delete ProductRoll records (ever)
  - Allow status jumps (e.g., dang_san_xuat → da_xuat_kho)
  - Update ProductRoll.status without corresponding RollScanHistory
  - Suppress inventory_updated events
  - Hardcode warehouse capacity (must use SystemConfig)
  - Allow status transition into loi_hong without explicit defect reason
```

### Critical Inventory Flows (NEVER touch without full plan)
1. `POST /inventory/scan` – QR scan → Roll status change
2. `POST /orders/:id/pick-rolls` – Roll reservation for order
3. `POST /inventory/stocktake/complete` – Stocktake finalization
4. Production roll creation → initial scan → trong_kho flow

---

## orders – P0 LOCKED

### Business Context
Manages: Order lifecycle (cho_duyet → da_duyet → dang_san_xuat → cho_xuat_kho → dang_giao → hoan_thanh | huy), order approval, payment status, priority management

### Absolute Constraints

```
✅ MUST:
  - Create OrderLog for EVERY order status change (actor, timestamp, note)
  - Emit io.emit('order_updated', {...}) after EVERY order mutation
  - Validate status transitions against states.md allowed transitions
  - Use prisma.$transaction for delivery completion (Order + ShippingOrder + Roll)
  - Validate req.user.role before approve/reject operations

❌ MUST NOT:
  - Delete OrderLog records (append-only, immutable)
  - Allow status to jump over required states
  - Approve/reject without role validation (admin+)
  - Suppress order_updated events
  - Mark hoan_thanh without a linked giao_thanh_cong ShippingOrder
  - Allow ho_tro_giao priority without admin approval
```

### Critical Order Flows (NEVER touch without full plan)
1. `PUT /orders/:id/status` – status machine transitions
2. `POST /orders/:id/approve` – approval with OrderLog creation
3. Delivery completion → `hoan_thanh` transition (atomic with shipping)
4. Payment status recalculation on payment creation
5. Order cancellation (huy) – roll release, payment refund consideration

---

## Blocked Operation Registry

Operations that OpenClaw will ALWAYS block in LOCKED domains:

| Operation | Domain | Block Reason |
|-----------|--------|-------------|
| `prisma.payment.delete()` | finance | Payment immutability |
| `prisma.payment.update()` | finance | Payment immutability |
| `prisma.orderLog.delete()` | orders | Audit log immutability |
| `prisma.orderLog.update()` | orders | Audit log immutability |
| `prisma.productRoll.delete()` | inventory | Inventory trail integrity |
| Float arithmetic for amount | finance | Data corruption risk |
| Status jump (skip states) | inventory, orders | State machine integrity |
| Roll status without transaction | inventory | Stock corruption risk |
| Order completion without ShippingOrder | orders | Business rule violation |
