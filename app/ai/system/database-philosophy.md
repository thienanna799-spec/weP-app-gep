# Database Philosophy – GEP ERP

## ORM: Prisma + MySQL 8

- All DB access via `prisma` client from `server/src/lib/prisma.ts`
- Raw SQL: only in edge cases where Prisma can't express the query
- Schema: `server/prisma/schema.prisma` – single source of truth

## Key Design Decisions

### 1. No Soft Delete (Hard Delete Everywhere)
All deletes are permanent (`prisma.model.delete()`).
- **Risk**: Data loss on accidental deletion
- **Mitigation**: `onDelete: Cascade` for child records
- **Recommended**: Add `deletedAt DateTime?` to major models (Order, Customer, Material)

### 2. Vietnamese Enum Values (Mapped via @map)
```prisma
enum OrderStatus {
  nhap          @map("nháp")
  cho_duyet     @map("chờ duyệt")
  // ...
}
```
- DB stores Vietnamese strings: `"nháp"`, `"chờ duyệt"`
- TypeScript uses English aliases: `nhap`, `cho_duyet`
- **Risk**: Raw SQL queries must use Vietnamese strings

### 3. Denormalized Counters
```prisma
Customer {
  totalOrders   Int @default(0)
  totalRevenue  Float @default(0)
}
```
These are NOT auto-updated by Prisma. Must be manually maintained.
**Risk**: Can drift out of sync. Use `POST /inventory/sync-stock` pattern for reconciliation.

### 4. base64 Images in LongText
```prisma
avatar         String? @db.Text
idCardPhoto    String? @db.LongText  // CCCD front
```
Images are stored as base64 data URLs in MySQL.
- **Max size**: MySQL LongText = ~4GB, but Express JSON limit = 25MB
- **Risk**: Slow queries, large row sizes, memory pressure
- **Migration path**: Cloudflare R2 or S3 + store URL only

### 5. CUIDs for Primary Keys
```prisma
id String @id @default(cuid())
```
All IDs are CUIDs (collision-resistant unique IDs).
- URL-safe, sortable, no sequential exposure risk
- Firebase UID (`uid`) is used as foreign key for Users

### 6. Prisma.$transaction for Consistency
Use `prisma.$transaction([...])` for multi-step operations that must be atomic.
```typescript
// Used in reports.controller.ts
const [rolls, orders] = await prisma.$transaction([
  prisma.productRoll.count({ ... }),
  prisma.order.count({ ... }),
]);
```

### 7. No Database-level Triggers
All business logic lives in controllers/services, not DB triggers.
This means: all field updates must be explicitly coded.

## Naming Conventions

| Entity | Table Name | Pattern |
|--------|-----------|---------|
| Model | `users` | plural snake_case via `@@map` |
| Enum | `user_role` | snake_case via `@@map` |
| FK | `userId`, `orderId` | camelCase |
| Index | `@@unique([a, b])` | explicit |

## Critical Relationships

```
Customer → Order (1:N, onDelete: SetNull)
Order → OrderItem (1:N, onDelete: Cascade)
Order → ProductionOrder (1:N, onDelete: SetNull)
Order → ShippingOrder (1:N, onDelete: NoAction)
Order → ProductRoll (1:N, onDelete: SetNull)
Order → Payment (1:N, onDelete: Cascade)
ProductionOrder → ProductRoll (1:N, onDelete: SetNull)
ShippingOrder → ShippingOrderItem → ProductRoll (join)
Driver → GpsLog (1:N, onDelete: Cascade)
Driver → OcrAuditLog (1:N, no FK – string driverId)
```

## Performance Notes

- `productRoll` table grows continuously (never deleted)
- `gpsLog` grows unbounded (consider TTL cleanup job)
- `ocrAuditLog` grows per fuel/repair log
- `user_activity_logs` grows unbounded (consider archival)
- No DB indexes explicitly defined beyond PK/FK (risk: slow on large datasets)

## Missing Abstractions

| Gap | Solution |
|-----|---------|
| No repository pattern | Controllers call prisma directly |
| No query builders | Raw WHERE objects built inline |
| No database-level constraints on status transitions | Status can jump from `nhap` to `hoan_thanh` directly |
| No archival strategy | Old logs stay in main tables forever |
