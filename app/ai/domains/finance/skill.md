# Finance Domain – Skill Map

## What This Domain Does
Manages accounts receivable (AR), accounts payable (AP), payment tracking, credit checks, and debt notifications. Finance is a **read-heavy** domain that aggregates data from Orders, Payments, PurchaseOrders, and FuelLogs.

## Core Models

### Payment
```prisma
Payment {
  orderId
  amount          // VND
  method          // cash | bank_transfer | credit (free text)
  reference       // Bank reference or receipt number
  note
  paidAt          // Timestamp of payment
  recordedBy, recordedByName
}
```

### BankAccount (GEP's accounts)
```prisma
BankAccount {
  bankName, accountNumber, accountName
  branch, isDefault
  isActive
}
```
Used on orders to specify which GEP account customer should transfer to.

## Finance KPIs

| KPI | Formula | Source |
|-----|---------|--------|
| Total Revenue | SUM(order.totalRevenue) where status in [hoan_thanh, dang_giao] | Orders |
| Paid Revenue | SUM(payment.amount) | Payments |
| Unpaid Revenue | totalRevenue - paidRevenue | Computed |
| Material Expense | SUM(txnItem.qty × unitPrice) for 'import' | MaterialTransaction |
| Fuel Expense | SUM(fuelLog.amount) | FuelLogs |
| Gross Profit | paidRevenue - totalExpense | Computed |
| PO Payable | SUM(po.totalAmount) for ordered + partially_received | PurchaseOrders |

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /finance/summary | Dashboard KPIs |
| GET | /finance/receivables | All open AR |
| GET | /finance/receivables/:customerId | Customer AR detail |
| GET | /finance/payables | AP from purchase orders |
| GET | /finance/credit-check/:customerId | Credit limit vs current debt |
| POST | /finance/payments | Record payment |
| GET | /finance/payments/:orderId | Payments for an order |
| POST | /finance/debt-alerts | Send Telegram overdue reminders |
| GET | /bank-accounts | List GEP bank accounts |
| POST | /bank-accounts | Add bank account |
| PUT | /bank-accounts/:id | Update bank account |
| DELETE | /bank-accounts/:id | Delete bank account |

## Permissions

| Action | Roles |
|--------|-------|
| View finance summary | admin, super_admin |
| View receivables | admin, super_admin |
| Record payment | admin, super_admin |
| Send debt alerts | admin, super_admin |
| Manage bank accounts | admin, super_admin |

## Cross-Domain Connections

```
Finance reads:
  ← Order.totalRevenue + Order.paymentStatus
  ← Payment[] (child of Order)
  ← PurchaseOrder.totalAmount + status
  ← FuelLog.amount (all drivers)
  ← MaterialTransactionItem (import type)

Finance writes:
  → Order.paymentStatus (updated after payment recorded)
  → NotificationLog (debt alerts)
```

## Key Business Rules

See `ai/shared/finance.rules.md` for full rules.

1. Revenue recognized on `hoan_thanh` + `dang_giao` (aggressive)
2. Credit limit = 0 means unlimited credit
3. Overdue = daysSinceOrder > customer.creditDays (default 30)
4. Payment validation: cannot exceed remaining AR + 1 VND tolerance
5. No automatic payment → must be manually recorded

## Known Gaps

| Gap | Impact |
|-----|--------|
| No invoice model | PDF invoices not tracked in DB |
| No payment reversal | Errors require manual DB fix |
| No date filter on revenue | Finance summary = all time, not filterable |
| No expense categories | Can't distinguish overhead from COGS |
| No P&L report | Summary only, no structured P&L |
