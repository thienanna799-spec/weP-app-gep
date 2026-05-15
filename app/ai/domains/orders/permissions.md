# Orders Domain – Permissions

## Route Access Matrix

| Action | super_admin | admin | staff | driver | pending |
|--------|:-----------:|:-----:|:-----:|:------:|:-------:|
| GET /orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /orders/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /orders/:id | ✅ | ✅ | ✅* | ❌ | ❌ |
| PUT /orders/:id/approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUT /orders/:id/reject | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUT /orders/:id/cancel | ✅ | ✅ | ✅* | ❌ | ❌ |
| PUT /orders/:id/status | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /orders/:id/payment-status | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /orders/:id/pick-roll | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /orders/:id/assign-driver | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /orders/:id/complete-delivery | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /orders/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /finance/payments | ✅ | ✅ | ❌ | ❌ | ❌ |

> \* Staff can only edit/cancel orders in `nhap` or `tu_choi` status (not yet enforced in code – gap)

## Known Permission Gaps

| Gap | Risk |
|-----|------|
| Staff can edit approved orders | Should only edit draft orders |
| Staff can cancel any order | Should only cancel own orders in draft |
| No ownership check | Staff A can edit Staff B's order |
| No self-approval prevention | Staff who creates could approve (if given admin role) |
