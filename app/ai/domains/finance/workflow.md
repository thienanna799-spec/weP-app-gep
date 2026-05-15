# Finance Domain – Workflow

## Workflow 1: Revenue Recognition & Payment Tracking

```
Order delivered (status: hoan_thanh or dang_giao)
  ↓
Finance team views outstanding AR:
  GET /finance/receivables
  → List of orders with remaining unpaid balance
  → Sorted by creation date (oldest first)
  → isOverdue flagged if daysSinceOrder > customer.creditDays

Customer makes payment:
  POST /finance/payments {
    orderId: "...",
    amount: 5000000,
    method: "bank_transfer",
    reference: "GCN202605100001",
    note: "Chuyển khoản VCB"
  }
  → Payment record created
  → Order.paymentStatus recalculated:
      newTotalPaid >= order.totalRevenue → 'da_thanh_toan'
      else                              → 'thanh_toan_mot_phan'
  
  → (Missing: io.emit('payment_received', ...) – gap)
```

## Workflow 2: Debt Alert Campaign

```
Finance team runs monthly debt collection:

1. Check who owes:
   GET /finance/receivables
   → Review overdue customers (isOverdue = true)
   → Note: overdue = daysSinceCreated > customer.creditDays

2. Check credit standing:
   GET /finance/credit-check/:customerId
   → totalDebt, availableCredit, isOverLimit

3. Send Telegram reminders:
   POST /finance/debt-alerts
   → Finds ALL overdue customers with telegramChatId
   → Sends formatted message to each customer
   → Logs to NotificationLog
   → Returns: { alertsSent, alertsFailed, overdueCustomers }

4. Follow up manually by phone if Telegram not set
```

## Workflow 3: Accounts Payable Management

```
PurchaseOrder delivered (status: received):
  → Appears in GET /finance/payables
  → totalPayable includes this PO amount
  
Admin records payment to supplier (manual currently):
  → No API for marking PO as paid
  → Must update PO.status via PUT /purchase-orders/:id
  
  ⚠️ Gap: No formal AP payment recording workflow
```

## Workflow 4: Finance Summary (Dashboard)

```
Admin opens Finance page:
  GET /finance/summary
  → Real-time query (no cache)
  → Returns: totalRevenue, paidRevenue, unpaidRevenue,
             materialExpense, fuelExpense, profit, poPayable
  
  ⚠️ Gap: No date range filter – always shows ALL TIME data
```

## Workflow 5: Invoice Generation

```
Admin generates invoice for completed order:
  GET /invoices/:orderId/data     → JSON data
  GET /invoices/:orderId/preview  → HTML preview
  GET /invoices/:orderId/pdf      → Download PDF

Send to customer via Telegram:
  POST /invoices/:orderId/send-telegram
  → Generates PDF
  → Sends to Customer.telegramChatId
  → NotificationLog created
  
  ⚠️ Prerequisite: Customer must have telegramChatId set
```

## Key Business Rules

See `ai/shared/finance.rules.md` for full rules.

1. Revenue includes `dang_giao` + `hoan_thanh` orders
2. Credit check: `creditLimit = 0` means unlimited
3. Overdue: `daysSinceOrder > customer.creditDays` (default 30)
4. Payment validation: `amount <= remaining + 1` (1 VND rounding buffer)
5. Finance is admin-only (staff has no access)
