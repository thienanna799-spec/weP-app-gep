# Authentication & Authorization – GEP ERP

## Auth Flow

```
User → Google OAuth (Firebase)
  → Firebase ID Token (JWT signed by Google)
  → POST /api/auth/google { idToken }
  → Backend verifies with Firebase Admin SDK
  → Find or create User in MySQL
  → Return { user, profile }
  → Frontend stores in AuthContext (memory only)
```

## Token Validation

Every API request:
```
Authorization: Bearer <firebase-id-token>
  ↓
auth.middleware.ts → firebaseAdmin.auth().verifyIdToken(token)
  ↓
Find User by uid in MySQL
  ↓
Attach req.user = { uid, email, role, status }
```

## Session Persistence

- Firebase Auth handles session persistence via localStorage
- `useAuth` hook listens to `onAuthStateChanged`
- No server-side sessions or custom JWTs

## User Model (MySQL)

```prisma
model User {
  uid         String  @unique   // Firebase UID (used as foreign key)
  email       String  @unique
  name        String
  role        UserRole           // super_admin | admin | staff | driver | pending
  status      UserStatus         // active | blocked | pending | inactive
  phone       String?
  department  String?
  position    String?
  lastLoginAt DateTime?
}
```

## New User Onboarding

```
1. User logs in with Google for first time
2. User created in MySQL with role=pending, status=active
3. User sees "Pending" screen
4. Super Admin / Admin promotes user role via PUT /users/:uid/role
5. Socket 'user_updated' event fires → user's session auto-refreshes permissions
```

## Blocked User Flow

```
1. Admin sets status=blocked via PUT /users/:uid/status
2. requireActive middleware rejects all subsequent requests (403)
3. Frontend redirects to /blocked page
```

## Files

| File | Purpose |
|------|---------|
| `server/src/middlewares/auth.middleware.ts` | requireAuth, requireRole, requireActive |
| `server/src/lib/firebase-admin.ts` | Firebase Admin SDK initialization |
| `server/src/controllers/auth.controller.ts` | googleAuth, getMe |
| `src/hooks/useAuth.ts` | Firebase client auth state |
| `src/services/authService.ts` | logout helper |
| `src/config/sidebar.ts` | Runtime permissions, getRolesForModule() |

## Security Notes

- Firebase ID tokens expire after **1 hour** – Firebase auto-refreshes them
- Backend does **not** cache verified tokens – every request is verified
- `requireActive` is separate from `requireAuth` – ensures no blocked user slips through
- `pending` role: can authenticate but no routes are accessible
