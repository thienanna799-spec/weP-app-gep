# Drivers Domain – Permissions

## Route Access Matrix

| Action | super_admin | admin | staff | driver | pending |
|--------|:-----------:|:-----:|:-----:|:------:|:-------:|
| GET /drivers | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /drivers/me | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /drivers/locations | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /drivers/leaderboard | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /drivers/:id | ✅ | ✅ | ✅ | ✅* | ❌ |
| POST /drivers | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUT /drivers/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUT /drivers/me | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE /drivers/:id | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUT /drivers/:id/location | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /drivers/me/documents | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /vehicles | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /vehicles | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUT /vehicles/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /fuel-logs | ✅ | ✅ | ✅ | ✅* | ❌ |
| POST /fuel-logs | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /repair-logs | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /daily-logs/* | ✅ | ✅ | ✅ | ✅* | ❌ |
| POST /daily-logs/check-in | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /daily-logs/check-out | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /ocr-audit | ✅ | ✅ | ❌ | ❌ | ❌ |
| PATCH /ocr-audit/:id/review | ✅ | ✅ | ❌ | ❌ | ❌ |

> \* Driver can only view their own records (by `userId`), not all drivers

## APK-Specific Access

The mobile driver APK only uses:
- `/drivers/me` (GET, PUT)
- `/drivers/me/documents`
- `/drivers/:id/location` (GPS ping)
- `/fuel-logs` (POST only)
- `/repair-logs` (POST only)
- `/daily-logs/check-in`, `/check-out`
- `/shipping/:id/delivery-log` (from shipping domain)

## Known Permission Gaps

| Gap | Risk |
|-----|------|
| Fuel logs endpoint not filtered by driver ownership | Staff can view ALL drivers' fuel logs |
| Daily logs endpoint not filtered by driver | Cross-driver data visible |
| GET /drivers/:id – no ownership validation for driver role | Driver can view other drivers' profiles |
| DELETE /drivers/:id only protected by super_admin – but no RoleGuard in code | Needs verification |
