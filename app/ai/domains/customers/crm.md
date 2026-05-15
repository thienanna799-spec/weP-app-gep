# Customers – CRM System

## Overview
Each customer has a full 360° CRM profile with notes, follow-up tasks, and activity timeline.

## CRM Models

### CustomerNote – Internal Notes
```prisma
CustomerNote {
  customerId, content
  createdBy, createdByName, createdAt
}
```
- Free-form internal notes visible to all staff
- Not visible to customers
- Cannot be edited (append-only)

### CustomerFollowUp – Scheduled Tasks
```prisma
CustomerFollowUp {
  customerId
  title, description
  dueDate
  type:   call | email | visit | quote | other
  status: pending | completed | cancelled | overdue
  createdBy, createdByName
  completedAt
}
```
- Scheduled tasks for account managers
- `overdue` status: when `dueDate < now()` and still `pending`
- Completing a follow-up auto-logs to CustomerActivity

### CustomerActivity – Timeline
```prisma
CustomerActivity {
  customerId
  type:  note_added | followup_created | followup_completed | order_created | status_changed
  title, description
  metadata: Json  // flexible extra data
  createdBy, createdByName, createdAt
}
```
- Auto-logged by the system on key events
- Read-only timeline – shows full customer journey

## CRM APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /customers/:id/crm | Full CRM profile (notes + follow-ups + activities) |
| POST | /customers/:id/notes | Add internal note |
| DELETE | /customers/:id/notes/:noteId | Delete note |
| POST | /customers/:id/follow-ups | Create follow-up task |
| PUT | /customers/:id/follow-ups/:id | Update follow-up (complete/cancel) |
| DELETE | /customers/:id/follow-ups/:id | Delete follow-up |
| GET | /customers/:id/activities | Get activity timeline |

## Workflow

```
Sales creates follow-up task (dueDate: tomorrow, type: call)
  → CustomerActivity logged: "followup_created"

Day of follow-up: staff calls customer
  → Staff completes follow-up via PUT /follow-ups/:id {status: completed}
  → CustomerActivity logged: "followup_completed"
  → Staff adds note about call outcome

Customer places order
  → CustomerActivity auto-logged: "order_created"
```

## Missing CRM Features (Gaps)

| Feature | Gap |
|---------|-----|
| Overdue follow-up alerts | No automatic Telegram alert for overdue tasks |
| Follow-up assignment | All staff see all follow-ups, no owner assignment |
| Customer health score | No scoring/ranking of customer relationships |
| Bulk follow-up | No way to create follow-ups for multiple customers |
