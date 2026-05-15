# Shared Utils & Services Map — GEP ERP
type: skill
scope: antigravity
version: 1.0 (extracted from codebase)

## Backend Utilities

### `server/src/utils/apiResponse.ts`
```typescript
import { sendSuccess, sendError } from '../utils/apiResponse.js';

sendSuccess(res, data);                          // 200 OK
sendSuccess(res, data, 201, 'Created');          // 201 + message
sendError(res, 'Not found', 404);               // Error response
sendError(res, 'Validation failed');             // 400 (default)
```
**Rule:** Use exclusively. Never `res.json()` or `res.status().json()` directly.

### `server/src/utils/asyncHandler.ts`
```typescript
import { asyncHandler } from '../utils/asyncHandler.js';
export const myHandler = asyncHandler(async (req: AuthRequest, res: Response) => { ... });
```
**Rule:** Every exported controller function MUST be wrapped. No try/catch needed inside.

### `server/src/lib/prisma.ts`
```typescript
import { prisma } from '../lib/prisma.js';
```
Singleton Prisma client. **Never** instantiate `new PrismaClient()`.

---

## Frontend Utilities

### `src/utils/format.ts`
```typescript
import { formatCurrency, formatNumber, formatDate, formatDateTime, getInitials } from '../../utils/format';

formatCurrency(50000)     // → "₱50,000.00" (PHP, en-PH locale)
formatNumber(1234)        // → "1,234"
formatDate('2024-01-15')  // → "15/01/2024" (vi) or "Jan 15, 2024" (en)
formatDateTime(date)      // → "15/01/2024 14:30" (vi)
getInitials('Nguyen Van A') // → "NVA"
```
**⚠️ Note:** Currency is PHP (Philippine Peso), NOT VND — despite UI showing Vietnamese labels.

### `src/utils/constants.ts`
```typescript
import { NAV_ITEMS, ROLE_LABELS, STATUS_DATA, PRODUCTION_ORDER_STATUS_DATA } from '../../utils/constants';
```
- `NAV_ITEMS` — sidebar navigation config
- `ROLE_LABELS` — display names for user roles
- `STATUS_DATA` — order status → labelKey + color
- `PRODUCTION_ORDER_STATUS_DATA` — production order status map

### `src/services/api.ts`
Frontend HTTP client with auth token injection:
```typescript
import api from '../../services/api';

const data = await api.get('/orders');                    // GET /api/orders
const result = await api.post('/orders', payload);        // POST /api/orders
const updated = await api.put('/orders/123', payload);    // PUT /api/orders/123
await api.delete('/orders/123');                          // DELETE /api/orders/123
```
**Rule:** Always use `api` service — never `fetch()` or `axios` directly in components.

### `src/hooks/useSocket.ts`
```typescript
import { useSocket } from '../../hooks/useSocket';

useSocket({
  onOrderUpdate: () => refetch(),
  onInventoryUpdate: () => refetch(),
  onShippingUpdate: () => refetch(),
  onUserUpdate: () => refetch(),
  onDriverVehicleUpdate: () => refetch(),
});
```
Global singleton socket. See `socket-events.md` for full event registry.

---

## Frontend Component Library (UI)

All shared UI components live in `src/components/ui/`:

| Component | Import path | Usage |
| :--- | :--- | :--- |
| `Button` | `../../components/ui/Button` | All clickable actions |
| `LoadingSpinner` | `../../components/ui/LoadingSpinner` | Loading state `if (loading) return <LoadingSpinner />` |
| `Modal` | `../../components/ui/Modal` | Dialogs — takes `isOpen`, `onClose`, `title`, `size` |
| `Input` | `../../components/ui/Input` | Form inputs |
| `ChartZoom` | `../../components/ui/ChartZoom` | Recharts wrapper with zoom capability |

---

## Navigation IDs (for routing)

From `src/utils/constants.ts` NAV_ITEMS:
```
dashboard, materials, production_orders, production,
inventory, shipping, orders, reports, drivers, finance
```

---

## i18n (Translation)

```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();

t('nav.orders')           // → "Chuẩn bị xuất" (Vietnamese)
t('status.da_duyet')      // → "Đã duyệt"
t('admin.user_management') // → "Quản lý người dùng"
```
Primary language: Vietnamese (`vi`). Fallback: English (`en`).

---

## Roles

```typescript
type UserRole = 'super_admin' | 'admin' | 'staff' | 'driver' | 'pending';
```
- `super_admin` — full access including delete
- `admin` — approve/reject, no delete on sensitive items
- `staff` — operational only (no Finance, no Admin module)
- `driver` — only sees own assigned orders (separate driver app)
- `pending` — blocked, sees locked screen
