# ADR-009: Notifications – Telegram Bot vs Email

**Date:** 2026-05-10
**Status:** IMPLEMENTED (Telegram only – no email planned)
**Deciders:** Engineering team

---

## Context

GEP needs to notify:
- Customers: invoice delivery, payment reminders
- Admins: fraud alerts, low stock, approval requests
- Drivers: assignment notifications (future)

## Decision

**Implemented:** Telegram Bot for all notifications

```typescript
// telegram.service.ts
await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
  chat_id: chatId,
  text: message,
  parse_mode: 'HTML',
});
```

## Why Telegram (not Email)

| Factor | Telegram | Email |
|--------|----------|-------|
| User adoption in Vietnam | ✅ Very high (>60% smartphone users) | Medium |
| Delivery speed | ✅ Instant push | 30s-5min delay |
| Read rate | ✅ High (push notification) | Low (email fatigue) |
| Cost | ✅ Free (Telegram Bot API) | SMTP costs or SendGrid |
| Setup complexity | ✅ BOT_TOKEN only needed | SMTP server or API key + DNS (SPF/DKIM) |
| Rich formatting | ✅ HTML formatting, inline buttons | HTML email templates |
| File attachments | ✅ PDF invoices via Bot | ✅ Attachments |
| Customer adoption | ✅ Most customers already on Telegram | Mixed |
| Reliability | ✅ 99%+ | Spam filters, bounces |

## Telegram Bot Architecture

```
GEP Backend → Telegram Bot API → Customer/Admin Telegram App

Bot Token: TELEGRAM_BOT_TOKEN (env variable)
Customer links chatId to their profile:
  PUT /customers/:id { telegramChatId: "123456789" }

Admin notifications use hardcoded group chatId:
  TELEGRAM_ADMIN_GROUP_ID (env variable)
```

## Notification Types Implemented

| Trigger | Recipient | Message |
|---------|----------|---------|
| Monthly debt alert | Customer | Debt reminder with amount |
| Invoice send | Customer | PDF invoice attachment |
| Low stock alert | Admin group | Material name + current stock |
| OCR fraud detected | Admin group | Driver name + amount mismatch |
| (Missing) PO approved | Requester | Notification of approval |
| (Missing) Order status | Customer | Status update |
| (Missing) Driver assigned | Driver | New delivery assignment |

## Failure Handling

```typescript
// Telegram failures do NOT block main operation
try {
  await sendTelegramMessage(chatId, message);
  await prisma.notificationLog.create({ data: { status: 'sent', ... } });
} catch (err) {
  await prisma.notificationLog.create({ data: { status: 'failed', error: err.message, ... } });
  // Swallow error – notification failure is non-critical
}
```

## Tradeoffs

**Accepted:**
- Customers must use Telegram (some may not)
- If Telegram is blocked (rare), notifications fail silently
- No email fallback

**Mitigations:**
- `telegramChatId` is optional – customers without it get phone calls instead
- `NotificationLog` records all successes and failures for admin review
- Phone calls remain the primary communication method; Telegram is supplementary

## Future: Multi-channel

If email is needed:
1. Add `email` field to `Customer` model
2. Integrate `nodemailer` or Resend/SendGrid API
3. Create `NotificationChannel` enum: `telegram | email | sms`
4. Notification router: check customer preferences, send to preferred channel
