# Admin Domain – Skill Map

## What This Domain Does
System administration: user management, role assignment, permission matrix configuration, activity audit logs, login monitoring, and system config.

## Core Models

### User
```prisma
User {
  uid       // Firebase UID (primary key via @unique)
  email     // Google auth email
  name
  role      // super_admin | admin | staff | driver | pending
  status    // active | blocked | pending | inactive
  phone, department, position
  lastLoginAt
  photoURL  // Google avatar
}
```

### SystemConfig (Key-Value Store)
```prisma
SystemConfig {
  key       // 'permissions', 'warehouse_capacity', etc.
  value     // JSON string
  updatedAt, updatedBy
}
```

Used for:
- `permissions` key: runtime role matrix overrides
- `warehouse_capacity`: warehouse alert threshold (currently hardcoded instead)

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /users | List all users |
| GET | /users/me | Current user profile |
| PUT | /users/:uid | Update user profile |
| PUT | /users/:uid/role | Change user role (super_admin only) |
| PUT | /users/:uid/status | Block/unblock user |
| DELETE | /users/:uid | Delete user (super_admin only) |
| GET | /admin/login-logs | Login history (admin+) |
| GET | /admin/activity-logs | Activity audit (admin+) |
| POST | /admin/activity-logs | Log an activity (called by frontend) |
| POST | /admin/login-logs | Log a login event (called by frontend) |
| GET | /admin/permissions | Get permission matrix |
| PUT | /admin/permissions | Update permission matrix (super_admin only) |
| GET | /admin/system-config | Get system configs |
| PUT | /admin/system-config | Update system config (super_admin only) |
| GET | /admin/notification-logs | View notification history |

## Permission Matrix

Runtime overrides stored in `SystemConfig.key = 'permissions'`:
```json
{
  "dashboard":         ["super_admin", "admin", "staff"],
  "orders":            ["super_admin", "admin", "staff"],
  "finance":           ["super_admin", "admin"],
  "admin":             ["super_admin", "admin"],
  "ocr_audit":         ["super_admin", "admin"],
  "production_orders": ["super_admin", "admin", "staff"]
}
```

Frontend loads on startup via `GET /admin/permissions`.
Changes fire `io.emit('user_updated', { type: 'permissions_changed' })`.

## Access Levels

| Action | Role Required |
|--------|--------------|
| View users | admin, super_admin |
| Change role | super_admin only |
| Block user | admin, super_admin |
| Delete user | super_admin only |
| View login logs | admin, super_admin |
| View activity logs | admin, super_admin |
| Change permission matrix | super_admin only |
| Update system config | super_admin only |

## User Lifecycle

```
New Google login
  → User created: role=pending, status=active
  → Admin sees pending user in /users list
  → PUT /users/:uid/role { role: 'staff' }
  → io.emit('user_updated', { type: 'role_changed' })
  → User's session auto-reloads permissions
  → User gains access to modules
```

## Audit Access

| Log | Route |
|-----|-------|
| Login history | GET /admin/login-logs |
| Activity trail | GET /admin/activity-logs |
| OCR fraud | GET /ocr-audit |
| Notifications sent | GET /admin/notification-logs |

## Gaps

| Gap | Impact |
|-----|--------|
| No permission change log | Changes to role matrix not audited |
| No user deletion audit | Deleted users vanish from history |
| SystemConfig rarely used | Warehouse capacity still hardcoded |
| No 2FA | Single Firebase auth layer |
| No IP allowlist | Any IP can access admin endpoints |
