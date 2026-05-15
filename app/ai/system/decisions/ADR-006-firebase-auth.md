# ADR-006: Authentication – Firebase vs Custom JWT

**Date:** 2026-05-10
**Status:** IMPLEMENTED (Firebase – no change planned)
**Deciders:** Engineering team

---

## Context

GEP requires user authentication with role-based access control for a multi-user ERP. The solution must support:
- Web browser (admin/staff)
- Mobile APK (drivers)
- No per-domain session management complexity

## Problem

Build vs buy for authentication:
- Custom JWT: full control, more development effort
- Firebase Auth: managed service, faster time-to-market

## Decision

**Implemented:** Firebase Authentication (Google Sign-In only)

```typescript
// Backend: verify Firebase ID token
const decoded = await adminApp.auth().verifyIdToken(idToken);
const uid = decoded.uid;
const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
```

```typescript
// Frontend: get token each request
const token = await auth.currentUser?.getIdToken();
// Token auto-refreshes every 1 hour by Firebase SDK
```

## Why Firebase

| Factor | Firebase | Custom JWT |
|--------|----------|-----------|
| Google Sign-In | ✅ Built-in | Manual OAuth |
| Token refresh | ✅ Auto (1 hr) | Manual |
| Token revocation | ✅ Admin SDK | Manual blocklist |
| Security hardening | ✅ Google handles | Custom responsibility |
| Multi-device | ✅ Automatic | Session management needed |
| Cost | Free tier | Engineering time |

## Data Flow

```
User → Google Sign-In → Firebase issues ID Token (JWT, 1hr TTL)
User → API request with `Authorization: Bearer {token}`
Backend → admin.auth().verifyIdToken(token) → { uid, email, ... }
Backend → lookup User by firebaseUid → get GEP role
Request → proceeds with req.user = { uid, email, role, ... }
```

## Role Storage

Roles are stored in GEP MySQL database (`User.role`), NOT in Firebase custom claims.

```
Firebase: identity only (who you are)
GEP DB: authorization (what you can do)
```

**Implication:** Role changes are immediate (no token invalidation needed). But this means the backend ALWAYS hits the DB for role check, cannot rely on token claims for role.

## Tradeoffs

**Accepted risks:**
- Firebase is an external dependency (vendor lock-in)
- If Firebase is down, login is unavailable
- Google Account required (no username/password option)

**Mitigations:**
- Firebase has 99.95% SLA
- All staff have Google Workspace accounts anyway

## Future

If moving away from Firebase:
1. Replace `adminApp.auth().verifyIdToken()` with custom JWT verification
2. Replace frontend `auth.currentUser.getIdToken()` with custom login flow
3. Implement token rotation/refresh
4. The DB User model is already decoupled – only `firebaseUid` field needs removal
