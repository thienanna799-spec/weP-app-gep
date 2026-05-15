# Customers Domain – Permissions

## Route-Level Access

| Action | super_admin | admin | staff | driver | pending |
|--------|:-----------:|:-----:|:-----:|:------:|:-------:|
| GET /customers | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /customers/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /customers/search | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /customers | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /customers/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /customers/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /customers/:id/pricing | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /customers/:id/pricing | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /customers/pricing/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| PATCH /customers/pricing/:id/toggle | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /customers/:id/crm | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /customers/:id/notes | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /customers/:id/notes/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /customers/:id/follow-ups | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /customers/import-excel | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /customers/export-pricing | ✅ | ✅ | ✅ | ❌ | ❌ |

## Field-Level Access (Not Enforced in Code – Gap)

| Field | Visible To |
|-------|-----------|
| telegramChatId | admin, super_admin (contains personal contact) |
| creditLimit | admin, super_admin (financial data) |
| totalRevenue | admin, super_admin (financial data) |
| groupChatLink | all staff |
| googleMapsLink | all staff |

> ⚠️ **Gap**: Field-level permissions are NOT enforced in API. All customer fields returned to any authenticated staff user.

## Business Rules

1. Staff can create and edit customers
2. Only admin+ can delete customers (permanent, no soft-delete)
3. Only admin+ can toggle pricing rules active/inactive
4. Only admin+ can bulk import customers from Excel
5. All roles can view CRM data (notes, follow-ups, activities)
6. Staff can add notes and follow-ups but cannot delete notes
