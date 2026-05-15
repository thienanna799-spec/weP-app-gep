# Finance Domain – Credit Rules

## Credit Limit System

```prisma
Customer {
  creditLimit   Float   @default(0)  // 0 = unlimited
  creditDays    Int     @default(30) // Default overdue threshold
}
```

## Credit Check Logic

```typescript
// GET /finance/credit-check/:customerId
const totalDebt = openOrders.reduce((sum, o) => sum + o.remainingAR, 0);

const creditInfo = {
  customerId,
  creditLimit,
  totalDebt,
  availableCredit: creditLimit > 0 ? creditLimit - totalDebt : null,  // null = unlimited
  isOverLimit: creditLimit > 0 && totalDebt > creditLimit,
  creditDays: customer.creditDays || 30,
  overdueOrders: openOrders.filter(o => daysSinceCreated(o) > creditDays),
};
```

## Credit Limit Rules

| creditLimit | Behavior |
|-------------|---------|
| 0 | Unlimited credit (can place any order regardless of debt) |
| > 0 | Maximum debt allowed in VND |

**No automatic blocking** – credit limit is informational only.
Admin can still approve orders even if customer is over limit.

## Overdue Detection

```typescript
// Per order
const isOverdue = customer.creditDays
  ? daysSinceCreated(order) > customer.creditDays
  : daysSinceCreated(order) > 30;
```

- `creditDays` is per-customer, defaults to 30
- Calculated against `order.createdAt`, not `deliveryDate` or `dueDate`
- No formal due date field on orders

## Debt Tiers (Recommended Thresholds)

| Debt Level | Vietnamese | Recommended Action |
|-----------|-----------|-------------------|
| 0 | Sạch nợ | Allow orders freely |
| > 0, not overdue | Nợ trong hạn | Allow orders, track |
| > 0, overdue | Nợ quá hạn | Send Telegram alert, flag in UI |
| > creditLimit | Vượt hạn mức | Flag for admin attention |

## Automatic Debt Alerts (Telegram)

```
POST /finance/debt-alerts
  → Finds orders where:
    status IN ['hoan_thanh', 'dang_giao']
    paymentStatus != 'da_thanh_toan'
    createdAt < (now - customer.creditDays days)
  → Groups by customer
  → Sends Telegram message per customer (if telegramChatId set)
  → NotificationLog created for each message
```

## Known Gaps

| Gap | Impact |
|-----|--------|
| No automatic order blocking when over credit limit | Risk exposure not controlled |
| Overdue calculated from createdAt not invoice date | Timing mismatch |
| No credit increase approval workflow | Admin manually edits creditLimit |
| No credit history (who changed it, when) | Audit gap |
| No interest calculation on overdue | Cannot charge late fees |
