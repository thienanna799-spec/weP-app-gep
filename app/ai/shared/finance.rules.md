# Finance Rules – Cross-Domain

## Revenue Recognition

GEP recognizes revenue on orders with status `hoan_thanh` OR `dang_giao`:
```typescript
// finance.controller.ts - getFinanceSummary
where: { status: { in: ['hoan_thanh', 'dang_giao'] } }
```

> ⚠️ **Risk**: Revenue includes in-transit orders (`dang_giao`). This is aggressive – delivery may fail.

## Receivables Calculation

```
AR per order = order.totalRevenue - SUM(payments.amount)
AR only shown for orders where AR > 0
```

**Overdue check**:
```typescript
const isOverdue = customer.creditDays
  ? daysSinceCreated > customer.creditDays
  : daysSinceCreated > 30;  // default 30 days
```

## Credit Check Flow

```
GET /finance/credit-check/:customerId
  → totalDebt = SUM(AR for all open orders)
  → availableCredit = creditLimit - totalDebt  (null if creditLimit = 0 = unlimited)
  → isOverLimit = creditLimit > 0 && totalDebt > creditLimit
```

No automatic blocking when over credit limit – it's informational only.

## Payment Recording

```
POST /finance/payments { orderId, amount, method, reference, note }
  → Validation: amount <= remaining AR (+ 1 rounding buffer)
  → Creates Payment record
  → Updates Order.paymentStatus:
      newTotalPaid >= totalRevenue → 'da_thanh_toan'
      else                        → 'thanh_toan_mot_phan'
```

## Payment Methods

```
cash | bank_transfer | credit
```
Stored on `Payment.method`. No validation – any string accepted.

## Payables (Accounts Payable)

Sources of payables:
1. `PurchaseOrder` with status `ordered` or `partially_received`
   - `totalPayable = SUM(po.totalAmount)` for these statuses
2. `FuelLog.amount` – fuel costs (treated as expenses, not payables)
3. `VehicleMaintenance.cost` – repair costs (expenses)

## Finance Summary Calculation

```typescript
totalRevenue   = SUM(order.totalRevenue) for hoan_thanh + dang_giao
paidRevenue    = SUM(payment.amount) ALL payments
unpaidRevenue  = totalRevenue - paidRevenue
materialExpense= SUM(txnItem.quantity * unitPrice) for 'import' txns
fuelExpense    = SUM(fuelLog.amount)
totalExpense   = materialExpense + fuelExpense
profit         = paidRevenue - totalExpense
balance        = totalRevenue - totalExpense  (accrual basis)
poPayable      = SUM(po.totalAmount) for ordered/partially_received
```

## Debt Alert Rules

Debt alerts sent via Telegram when:
1. Order status is `hoan_thanh` or `dang_giao`
2. `paymentStatus != 'da_thanh_toan'`
3. `daysSinceCreated > customer.creditDays` (default 30)
4. Customer has `telegramChatId` set

Grouped by customer before sending (one message per customer).

## Missing Finance Features (Gaps)

| Gap | Risk |
|-----|------|
| No invoice model (only picking slip) | Invoices are separate PDF, not tracked in DB |
| No write-off functionality | Bad debt stays in AR forever |
| No payment reversal | Mistakes require manual DB fix |
| No bank reconciliation | Cannot match bank statements to payments |
| No multi-currency | All amounts in VND only |
| No expense categories | Fuel + materials are the only tracked expenses |
| No P&L by period | Finance summary covers all time (no date filter on revenue) |
| Payment method not validated | Accepts any string |
