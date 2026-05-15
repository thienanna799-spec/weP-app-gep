# Notification Rules – GEP ERP

## Channel: Telegram Bot

All notifications go through `server/src/services/telegram.service.ts`.
Bot token: stored in env `TELEGRAM_BOT_TOKEN`.

## Notification Triggers

| Event | Trigger | Recipient | Route |
|-------|---------|-----------|-------|
| Invoice | Manual by admin | Customer's Telegram chat ID | POST /invoices/:id/send-telegram |
| Debt alert | Manual by admin | Customer's Telegram chat ID | POST /finance/debt-alerts |
| Low stock | Manual by admin | Internal ops group | POST /materials/low-stock/alert |
| OCR fraud detected | Auto on OCR audit | Admin group | (via OCR webhook) |

## Invoice via Telegram

```typescript
// POST /invoices/:orderId/send-telegram
1. Generate invoice HTML → PDF
2. Send PDF as document to customer.telegramChatId
3. Log in NotificationLog
```

**Prerequisite**: Customer must have `telegramChatId` set.

## Debt Alert via Telegram

```typescript
// POST /finance/debt-alerts
1. Find customers with overdue receivables
2. Calculate days overdue, amount owed
3. Send formatted message to each customer.telegramChatId
4. Log in NotificationLog
```

## Low Stock Alert

```typescript
// POST /materials/low-stock/alert
1. Find materials where currentStock ≤ minStock
2. Format alert message with material names and quantities
3. Send to configured ops Telegram group
```

## NotificationLog Model

```prisma
NotificationLog {
  type:      "debt_alert" | "order_status" | "low_stock" | "delivery_proof" | "return_update"
  channel:   "telegram" | "email"
  recipient: chatId or email
  subject, content
  status:    "sent" | "failed"
  relatedId, relatedType   // orderId/customerId etc.
  sentAt
}
```

## Missing Notification Triggers (Gaps)

| Event | Gap |
|-------|-----|
| Order approved/rejected | No automatic notification to staff who created it |
| Order status changes | No notification to customer |
| Delivery completed | No automatic proof-of-delivery notification |
| Return approved/rejected | No notification |
| New user pending | No notification to admin |
| Purchase order approved | No notification to requester |

## Email
Not implemented. NotificationLog has `channel: "email"` field but no email service exists.
