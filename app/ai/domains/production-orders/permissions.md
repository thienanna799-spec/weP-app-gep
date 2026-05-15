# Production Orders Domain – Permissions

## Route Access Matrix

| Action | super_admin | admin | staff | driver | pending |
|--------|:-----------:|:-----:|:-----:|:------:|:-------:|
| GET /production-orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /production-orders/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /production-orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /production-orders/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /production-orders/:id/status | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /production-orders/:id | ✅ | ✅ | ❌ | ❌ | ❌ |

## Roll Management (Linked)

| Action | super_admin | admin | staff | driver | pending |
|--------|:-----------:|:-----:|:-----:|:------:|:-------:|
| POST /rolls (create roll) | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /rolls/:id/scan-to-stock | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /rolls/:id/status | ✅ | ✅ | ✅ | ❌ | ❌ |

## Business Rules

1. Any staff can create production orders (linked to approved sales orders)
2. Any staff can advance status (`waiting_material` → `ready` → `producing`)
3. Only admin can delete production orders
4. No approval flow – production orders don't require approval
5. `personInChargeId` is informational only – not enforced as access control

## Gap

> No ownership / department-level access control.
> Any staff can create/edit any production order regardless of which team owns it.
