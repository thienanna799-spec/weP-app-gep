# Finance Domain – Receivables (Accounts Receivable)

## What Is AR in GEP

Accounts Receivable = money owed by customers for goods delivered but not yet paid for.

```
AR per order = order.totalRevenue - SUM(payments WHERE orderId = order.id)
```

AR is tracked at order level, not customer level (no single AR balance per customer).

## AR Eligibility

An order is included in AR if:
```typescript
status IN ('hoan_thanh', 'dang_giao')
AND paymentStatus != 'da_thanh_toan'
```

> ⚠️ Revenue includes `dang_giao` (in-transit) – aggressive recognition.
> Delivery may fail → revenue would need reversal (no mechanism currently).

## AR Calculation Per Order

```typescript
const totalRevenue  = order.totalRevenue;
const totalPaid     = payments.reduce((sum, p) => sum + p.amount, 0);
const remaining     = Math.max(0, totalRevenue - totalPaid);
const daysSince     = Math.floor((Date.now() - order.createdAt.getTime()) / 86400000);
const creditDays    = customer?.creditDays || 30;
const isOverdue     = daysSince > creditDays;
```

## AR Endpoint

```
GET /finance/receivables
→ Returns all orders with remaining AR > 0
→ Groups by customer
→ Flags isOverdue per order

GET /finance/receivables/:customerId
→ Same but filtered to one customer
→ Includes: creditLimit, totalDebt, availableCredit, isOverLimit
```

## AR Response Shape

```typescript
{
  customerId, customerName, customerPhone,
  orders: [{
    orderId, orderCode,
    totalRevenue,     // Full order value
    totalPaid,        // Sum of payments
    remaining,        // AR balance
    daysSinceCreated, // Age in days
    isOverdue,        // > customer.creditDays
    deliveryDeadline,
  }],
  totalDebt,          // Sum of remaining across all orders
  creditLimit,        // 0 = unlimited
  availableCredit,    // null if unlimited
  isOverLimit,        // true if totalDebt > creditLimit
}
```

## AR Aging Buckets (Not Yet Implemented)

Standard AR aging analysis (recommended future feature):

| Bucket | Days | Status |
|--------|------|--------|
| Current | 0-30 | Normal |
| 31-60 days | 31-60 | Overdue |
| 61-90 days | 61-90 | At Risk |
| 90+ days | 90+ | Bad Debt |

## Payment Recording (Reduces AR)

```
POST /finance/payments { orderId, amount, method, reference, note }
→ Payment created (immutable)
→ Order.paymentStatus recalculated
→ AR for that order decreases by payment amount

Validation:
  amount <= (order.totalRevenue - currentTotalPaid) + 1 VND buffer
```

## Debt Alert → Telegram Flow

```
POST /finance/debt-alerts
  → Scans all overdue AR
  → Groups by customer with telegramChatId
  → Sends one Telegram message per customer:
      "Kính gửi {customer}, đơn hàng {code} đang còn {amount} VND chưa thanh toán..."
  → NotificationLog created per message
```

## Known Gaps

| Gap | Impact |
|-----|--------|
| No invoice model | AR has no linked invoice document |
| AR date based on `createdAt` not delivery date | Overdue calculated from wrong date |
| No write-off mechanism | Bad debt stays in AR forever |
| `dang_giao` in AR | AR inflated by unconfirmed deliveries |
| No AR aging report | Cannot see 30/60/90 day buckets |
| No interest on overdue | Cannot charge late payment fees |
