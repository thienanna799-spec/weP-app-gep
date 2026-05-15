# Finance Domain — Business Rules (LOCKED 🔴)

**Governance Level:** CRITICAL — All rules are NON-NEGOTIABLE  
**Source:** `app/ai/system/ai-execution-governance.md`  
**Last updated:** 2026-05-12

---

## IMMUTABLE RULES — Never violate

### RULE F-01: Integer-only monetary values
```
❌ FORBIDDEN: amount = 1500000.5  (float)
✅ REQUIRED:  amount = 1500000    (integer VND)
```
Reason: Float rounding causes reconciliation mismatch of 1-2 VND over thousands of transactions.

### RULE F-02: Payment immutability
```
❌ FORBIDDEN: UPDATE payments SET amount = ?
❌ FORBIDDEN: DELETE FROM payments
✅ REQUIRED:  Create correction Payment record instead
```
Reason: Every payment is an accounting fact. Mutation destroys audit trail.

### RULE F-03: Atomic payment creation
```
✅ REQUIRED: prisma.$transaction([
  createPayment(),
  updateInvoicePaymentStatus(),
  createUserActivityLog(),
])
```
All three operations must succeed or all fail. Never partial commit.

### RULE F-04: Amount validation before commit
```
✅ REQUIRED: Validate payment.amount <= invoice.remainingAR + 1
```
Never allow overpayment without explicit approval flag.

### RULE F-05: Audit log on every P0 mutation
Every Payment create/Invoice status change MUST log to `userActivityLog`:
- userId
- action
- entityType + entityId  
- amount (if financial)
- timestamp

---

## Credit & AR Rules

### RULE F-06: Credit limit enforcement
- Customer with `creditStatus = "blocked"` cannot create new orders
- Check BEFORE order creation, not after

### RULE F-07: 90-day overdue → auto-block shipment
- If oldest unpaid invoice > 90 days overdue
- Set `customer.creditStatus = "blocked"`
- Emit `io.emit('credit_status_changed', { customerId, status: 'blocked' })`

---

## Revenue Recognition

- Revenue recognized at `ORDER status = "hoan_thanh"` (completed)
- NOT at payment receipt
- Partial payments create AR entries, not revenue

---

## Related ADRs
- `adr/ADR-016-payment-integer-vnd.md`
- `../../system/decisions/ADR-015-unicode-nfc-normalization.md`
