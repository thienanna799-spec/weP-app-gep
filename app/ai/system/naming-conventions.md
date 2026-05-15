# Naming Conventions – GEP ERP

## File Structure

```
server/src/
  controllers/    {entity}.controller.ts
  services/       {entity}.service.ts
  lib/            shared utilities
  middlewares/    {purpose}.middleware.ts
  utils/          helper functions

src/
  modules/{domain}/    {Domain}Page.tsx, components/
  hooks/               use{Entity}.ts
  services/            {entity}Service.ts
  types/               {entity}.types.ts
```

## API Endpoints

| Pattern | Example |
|---------|---------|
| List resource | GET /orders |
| Single resource | GET /orders/:id |
| Create | POST /orders |
| Update | PUT /orders/:id |
| Partial update | PATCH /orders/:id/toggle |
| Delete | DELETE /orders/:id |
| Action on resource | PUT /orders/:id/approve |
| Sub-resource | GET /customers/:id/pricing |
| Action on sub | POST /customers/:id/notes |

## Database (Prisma Schema)

| Item | Convention | Example |
|------|-----------|---------|
| Model | PascalCase | `ProductionOrder` |
| Table (@@map) | plural snake_case | `production_orders` |
| Field | camelCase | `productionDate` |
| FK | `{entity}Id` | `customerId` |
| Enum | PascalCase | `OrderStatus` |
| Enum value | snake_case | `cho_duyet` |
| Enum map | Vietnamese | `@map("chờ duyệt")` |

## TypeScript

| Item | Convention | Example |
|------|-----------|---------|
| Interface | PascalCase | `OrderItem` |
| Type alias | PascalCase | `AuthRequest` |
| Enum | PascalCase | `UserRole` |
| Function | camelCase | `createOrder` |
| Constant | UPPER_SNAKE | `HOT_TTL_MS` |
| React component | PascalCase | `OrdersPage` |
| React hook | camelCase with `use` prefix | `useOrders` |

## Code Entities

| Auto-generated codes | Format | Example |
|---------------------|--------|---------|
| Order | `DH-YYYYMMDD-XXXX` | DH-20260510-0001 |
| ShippingOrder | `GH-YYYYMMDD-XXXX` | GH-20260510-0001 |
| ProductionOrder | `LSX-YYYYMMDD-XXXX` | LSX-20260510-0001 |
| PurchaseOrder | `PO-YYYYMMDD-XXXX` | PO-20260510-0001 |
| Customer | `KH-XXXX` | KH-0001 |
| Driver | `DRV-XXXXXX` | DRV-123456 |
| Supplier | `NCC-XXXX` | NCC-0001 |
| Stocktake | `SKT-...` | SKT-... |
| Return | `RTN-XXX` | RTN-001 |

## Vietnamese vs English

- **DB enum maps**: Vietnamese (required for data consistency)
- **Code logic**: English (TypeScript enum aliases)
- **API responses**: Vietnamese text in user-facing fields
- **Error messages**: Vietnamese (`'Không tìm thấy đơn hàng'`)
- **Code comments**: Mix (Vietnamese for business domain, English for technical)

## Socket.IO Events

Format: `{entity}_{past_verb}`
```
order_updated
inventory_updated  
shipping_updated
user_updated
driver_vehicle_updated
```

## React Hooks

```typescript
// Data hooks return object (NOT array)
const { orders, loading, error, refetch } = useOrders();

// Action hooks return functions
const { approveOrder, rejectOrder } = useOrderActions();
```

## AI Prompt Naming in `prompts/`

```
build.prompt.md      → Build a new feature in this domain
refactor.prompt.md   → Refactor existing code safely
optimize.prompt.md   → Performance / query optimization
audit.prompt.md      → Audit for bugs, gaps, missing flows
```
