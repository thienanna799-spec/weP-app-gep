# Customers Domain – Workflow

## Primary Workflow: Customer Lifecycle

```
Step 1: ACQUISITION
  Staff adds new customer via:
    POST /customers { name, phone, address, customerType, ... }
  ↓
  code auto-generated: "KH-XXXX"
  operationalStatus = "active" (default)

Step 2: ONBOARDING (optional)
  Staff sets up customer-specific config:
  → POST /customers/:id/pricing  { sku, price }    ← per-product prices
  → PATCH /customers/:id/subsku-toggle              ← enable/disable products
  → Link Telegram: PUT /customers/:id { telegramChatId }

Step 3: ACTIVE RELATIONSHIP
  Customer places orders (Order domain)
  Staff tracks interactions via CRM:
  → POST /customers/:id/notes          ← internal notes after calls
  → POST /customers/:id/follow-ups     ← schedule next contact
  → Timeline auto-updates on order creation

Step 4: DEBT MANAGEMENT
  Finance team monitors outstanding AR:
  → GET /finance/receivables/:customerId
  → POST /finance/debt-alerts           ← send Telegram reminder
  → Customer pays → POST /finance/payments

Step 5: RELATIONSHIP MAINTENANCE
  Staff completes follow-up tasks:
  → PUT /customers/:id/follow-ups/:id { status: 'completed' }
  → Add call outcome note
  → Schedule next follow-up

Step 6: STATUS CHANGE (if needed)
  Admin updates status:
  → PUT /customers/:id { operationalStatus: 'inactive' | 'stopped' }
  → CustomerActivity logged: "status_changed"
```

## CRM Follow-Up Workflow

```
Monthly touchpoint routine:

1. Staff views follow-ups due today:
   GET /customers/:id/crm → filter followUps by dueDate

2. Staff calls/visits customer
   → POST /customers/:id/notes { content: "Called, discussed..." }
   → PUT /customers/:id/follow-ups/:id { status: 'completed' }

3. Plan next contact:
   → POST /customers/:id/follow-ups {
       type: 'call',
       dueDate: nextMonth,
       title: 'Monthly check-in'
     }

4. If promising:
   → POST /customers/:id/follow-ups { type: 'quote', dueDate: nextWeek }
```

## Customer Import Workflow

```
Admin needs to bulk import customers from Excel:

1. Download template: GET /customers/import-template
2. Fill template with customer data
3. Upload: POST /customers/import-excel { file: base64 }
   → Validates each row
   → Skips duplicates (by phone)
   → Creates customers for valid rows
   → Returns: { created, skipped, errors }
```

## Realtime Events

Customer mutations do NOT currently emit socket events.
- No `customer_updated` event exists
- Other tabs/users do not see new customers without refresh

> ⚠️ **Gap**: Should add `io.emit('customer_updated', { customerId, action })` after mutations.
