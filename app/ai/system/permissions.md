# System Permissions – GEP ERP

## Role Hierarchy

```
super_admin  ─── Full access to everything
    │
admin        ─── Most operations except user deletion
    │
staff        ─── Operational tasks (orders, inventory, production)
    │
driver       ─── Delivery-only access (shipping, daily logs, GPS)
    │
pending      ─── No access (awaiting role assignment)
```

## Route Permission Matrix

| Route Group | super_admin | admin | staff | driver | pending |
|-------------|:-----------:|:-----:|:-----:|:------:|:-------:|
| GET /orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /orders/:id/approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE /orders/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /materials | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /materials/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /production-orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /production-orders | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /shipping | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /shipping/:id/delivery-log | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /drivers/me | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /drivers (all) | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /drivers/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /finance/* | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /admin/login-logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUT /admin/permissions | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE /users/:uid | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /reports/* | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /customers | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /customers/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /purchase-orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST/PUT /purchase-orders | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /inventory/transfers | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET/POST /inventory/stocktakes | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /ocr-audit | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /returns | ✅ | ✅ | ❌ | ❌ | ❌ |

## Dynamic Permissions (Runtime)

GEP supports **runtime permission overrides** via `SystemConfig`:
- Key: `permissions` (JSON)
- Structure: `{ "module_id": ["role1", "role2"] }`
- Loaded at app startup via `GET /api/admin/permissions`
- Frontend applies via `RoleGuard` component
- Backend enforces via `requireRole()` middleware

### Permission Override Flow
```
App startup
  → GET /api/admin/permissions
  → setRuntimePermissions(perms)  [in memory, config/sidebar.ts]
  → RoleGuard reads from memory
  → Socket.IO 'user_updated' with type='permissions_changed'
  → frontend reloads permissions automatically
```

## Middleware Stack

Every protected route goes through:
```
requireAuth     → Validates Firebase ID token from Authorization header
  ↓
requireActive   → Checks User.status === 'active' (not blocked/pending)
  ↓
requireRole()   → Checks User.role against allowed roles
  ↓
controller      → Business logic
```

## Frontend Route Guards

```tsx
// RoleGuard component wraps each route
<RoleGuard
  userRole={profile.role}
  allowedRoles={getRolesForModule('finance')}  // reads runtime permissions
>
  <FinancePage />
</RoleGuard>
```

## Known Gaps

| Gap | Issue |
|-----|-------|
| Driver role has no route guards on shipping GET | Drivers can technically read all shipping orders |
| No field-level permissions | Staff can see all customer financial data |
| No permission audit log | Changes to permissions are not logged |
| `pending` role can access `/me` route | Minor – by design for onboarding flow |
