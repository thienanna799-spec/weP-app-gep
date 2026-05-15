# Admin Domain – Workflow

## Workflow 1: New User Onboarding

```
New team member joins GEP:

Step 1: User logs in with Google account
  → Firebase creates auth entry
  → Backend: POST /users (or auto-created on first request)
  → User.role = 'pending', User.status = 'active'

Step 2: User sees "Pending" screen in GEP web
  → No access to any module
  → Must wait for admin to assign role

Step 3: Admin assigns role
  → GET /users → filter by role='pending'
  → PUT /users/:uid/role { role: 'staff' | 'admin' | 'driver' }
  → io.emit('user_updated', { type: 'role_changed', userId: uid })
  → User's browser receives event → reloads permission state
  → User gains access to modules

Step 4: Admin configures profile (optional)
  → PUT /users/:uid { department, position, phone }
```

## Workflow 2: Permission Matrix Management

```
Business decides to restrict Finance from Staff:

Step 1: Super admin opens Permissions settings
  GET /admin/permissions
  → Current matrix loaded in UI

Step 2: Super admin modifies
  → Removes 'staff' from 'finance' module
  → Clicks Save

Step 3: Backend updates
  PUT /admin/permissions { finance: ['super_admin', 'admin'] }
  → SystemConfig.key='permissions' updated
  → io.emit('user_updated', { type: 'permissions_changed' })

Step 4: All connected clients reload
  → Every browser tab receives 'user_updated'
  → useSocket hook triggers permission refetch
  → GET /admin/permissions called
  → Staff users' sidebar: Finance tab disappears
```

## Workflow 3: Block / Unblock User

```
Driver suspected of misconduct:

PUT /users/:uid/status { status: 'blocked' }
  → User.status = 'blocked'
  → Firebase: Admin SDK revokes tokens (recommended - not confirmed implemented)
  → Next API request from user returns 401
  → io.emit('user_updated', { type: 'status_changed' })

Unblock:
PUT /users/:uid/status { status: 'active' }
  → User can log in again
```

## Workflow 4: Driver Role Assignment (Linked to Driver Domain)

```
New driver joins fleet:

Step 1: Admin assigns role
  PUT /users/:uid/role { role: 'driver' }

Step 2: Driver logs into APK with Google
  GET /drivers/me
  → No Driver record found → auto-creates:
    Driver { userId, status: 'inactive', code: 'DRV-XXXXXX' }

Step 3: Driver fills profile via APK
  PUT /drivers/me { name, phone, licenseNo, ... }
  POST /drivers/me/documents { idCardPhoto, licensePhoto, ... }

Step 4: Admin verifies documents and activates
  PUT /drivers/:id { status: 'available' }
  → Driver can now receive shipping assignments
```

## Workflow 5: System Configuration

```
Admin updates operational thresholds:

GET /admin/system-config
  → { key: 'warehouse_capacity', value: '500' }
  → { key: 'permissions', value: JSON.stringify(matrix) }

PUT /admin/system-config { key: 'warehouse_capacity', value: '750' }
  → SystemConfig updated
  → Reports: next cache miss will use new value
  
⚠️ Gap: WAREHOUSE_CAPACITY hardcoded in reports.controller.ts,
   NOT reading from SystemConfig. This config update has no effect currently.
```

## Workflow 6: Audit Log Review

```
Monthly compliance review:

GET /admin/login-logs?from=2026-05-01&to=2026-05-31
  → See all logins: who, when, success/fail

GET /admin/activity-logs?module=orders&action=approve_order
  → See all order approvals: who approved, which order, when

GET /ocr-audit?riskLevel=high&reviewStatus=rejected
  → See all confirmed fraud cases for the month

Export if needed: frontend generates Excel from API response
```
