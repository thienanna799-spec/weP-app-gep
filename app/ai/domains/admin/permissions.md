# Admin Domain – Permissions

## Route Access Matrix

| Action | super_admin | admin | staff | driver | pending |
|--------|:-----------:|:-----:|:-----:|:------:|:-------:|
| GET /users | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /users/me | ✅ | ✅ | ✅ | ✅ | ✅ |
| PUT /users/:uid | ✅ | ✅ | ✅* | ❌ | ❌ |
| PUT /users/:uid/role | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUT /users/:uid/status | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE /users/:uid | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /admin/login-logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /admin/activity-logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /admin/activity-logs | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /admin/login-logs | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /admin/permissions | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /admin/permissions | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /admin/system-config | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUT /admin/system-config | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /admin/notification-logs | ✅ | ✅ | ❌ | ❌ | ❌ |

> \* Staff can only update their own profile (enforced by checking `req.user.uid === req.params.uid`)

## Hard Separation: super_admin vs admin

| Capability | super_admin | admin |
|------------|:-----------:|:-----:|
| Change user role | ✅ | ❌ |
| Delete user | ✅ | ❌ |
| Update permission matrix | ✅ | ❌ |
| Update system config | ✅ | ❌ |
| Block/unblock users | ✅ | ✅ |
| View all audit logs | ✅ | ✅ |

## Permission Matrix (Stored in SystemConfig)

The permission matrix defines which roles can access which modules.
Loaded at frontend startup and cached in React state.

```json
{
  "dashboard":         ["super_admin", "admin", "staff"],
  "orders":            ["super_admin", "admin", "staff"],
  "customers":         ["super_admin", "admin", "staff"],
  "inventory":         ["super_admin", "admin", "staff"],
  "materials":         ["super_admin", "admin", "staff"],
  "production_orders": ["super_admin", "admin", "staff"],
  "shipping":          ["super_admin", "admin", "staff"],
  "drivers":           ["super_admin", "admin", "staff"],
  "reports":           ["super_admin", "admin", "staff"],
  "finance":           ["super_admin", "admin"],
  "admin":             ["super_admin", "admin"],
  "ocr_audit":         ["super_admin", "admin"]
}
```

When matrix changes:
`io.emit('user_updated', { type: 'permissions_changed' })`
→ All connected clients reload their permission state

## Known Gaps

| Gap | Risk |
|-----|------|
| No permission change audit log | Changes to matrix are invisible in audit trail |
| Activity logs posted by frontend | Client-side logging can be bypassed/spoofed |
| Login logs posted by frontend | Same trust issue as activity logs |
| `pending` users have no UI block | Must be handled by frontend RoleGuard |
