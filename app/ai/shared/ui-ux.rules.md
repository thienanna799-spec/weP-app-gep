# UI/UX Rules – GEP ERP Frontend

## Tech Stack
- React 18 + TypeScript
- Vite (dev server)
- TailwindCSS (utility-first)
- Lucide Icons
- i18next (internationalization – Vietnamese primary)
- react-router-dom v6
- Socket.IO client (global singleton)
- react-hot-toast or similar for notifications

## Application Shell

```
AppLayout
  ├── Sidebar (navigation)
  ├── TopBar (user profile, notifications)
  └── Main Content Area (module pages)
```

## Module Structure

Each domain has a dedicated module folder:
```
src/modules/{domain}/
  {Domain}Page.tsx         ← Main page component
  components/              ← Domain-specific components
    {Entity}Table.tsx
    {Entity}Modal.tsx
    {Entity}Card.tsx
  hooks/                   ← Domain hooks (optional)
```

## Data Loading Pattern

```typescript
// Standard hook pattern (returns object, NOT array)
const { orders, loading, error, refetch } = useOrders();

// Socket integration for realtime
useSocket({
  onOrderUpdate: () => refetch(),
});

// Loading state
if (loading) return <LoadingSpinner />;
if (error)   return <ErrorState message={error} />;
```

## Permission Guard Pattern

```tsx
// Every route in App.tsx
<RoleGuard
  userRole={profile?.role || 'pending'}
  allowedRoles={getRolesForModule('orders')}
>
  <OrdersPage profile={profile!} />
</RoleGuard>

// Inside components (button-level)
{canApprove && <Button onClick={approve}>Duyệt</Button>}
```

## State Management
- **No Redux** – all state local to components or in hooks
- **No Context** (except AuthContext)
- Server state via custom hooks (useOrders, useCustomers, etc.)
- Real-time sync via `useSocket` hook

## Key UI Components (shared)

| Component | Location | Purpose |
|-----------|---------|---------|
| Button | components/ui/Button.tsx | All action buttons |
| Card | components/ui/Card.tsx | Content cards |
| LoadingSpinner | components/ui/LoadingSpinner.tsx | Loading state |
| Modal | (per domain) | Dialogs |
| Table | (per domain) | Data tables |

## Form Validation Rules

1. Required fields: show red border + error message on submit
2. Phone numbers: Vietnamese format (10 digits starting with 0)
3. Amounts: Positive numbers in VND (no decimals in UI)
4. Dates: Use Vietnamese locale display (DD/MM/YYYY)
5. Status displays: Use Vietnamese labels from `status-flows.md`

## Toast Notifications

After every API action:
```typescript
// Success
toast.success('Đơn hàng đã được duyệt thành công');

// Error
toast.error('Không thể duyệt đơn hàng: ' + error.message);
```

## Socket-triggered UI Updates

When socket events arrive:
1. Refetch data (call `refetch()`)
2. Show subtle toast notification
3. Highlight changed rows if possible

## Permission-Based UI Rules

| Role | Visible UI |
|------|-----------|
| super_admin | All modules + Delete buttons |
| admin | All modules + Approve/Reject buttons, no Delete on sensitive items |
| staff | Operational modules, no Finance, no Admin |
| driver | Only driver app (separate domain: driver.gepoder.click) |
| pending | Blocked screen |

## Mobile Driver App (Separate)

Domain: `driver.gepoder.click`
Built with: React (same codebase, different entry/routes?) or Capacitor
Key flows:
- Check-in vehicle, log daily KM
- View assigned shipping orders
- Log delivery (photo + GPS)
- Submit fuel receipt (photo → OCR)
- Submit repair log (photo + details)
- Update GPS location
