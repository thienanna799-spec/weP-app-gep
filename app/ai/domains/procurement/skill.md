# Procurement Domain – Skill Map

## What This Domain Does
Manages purchasing raw materials from suppliers. The procurement cycle goes from purchase order creation → approval → ordering → receiving goods, which then feeds into the materials inventory.

## Core Models

### Supplier
```prisma
Supplier {
  code (unique)    // NCC-0001
  name, phone, email, address
  contactPerson, taxCode
  bankAccount, bankName
  rating           // 1-5 supplier quality rating
  notes
  isActive
}
```

### PurchaseOrder (PO)
```prisma
PurchaseOrder {
  code (unique)    // PO-20260508-001
  supplierId
  status           // draft → pending_approval → approved → ordered → partially_received → received | cancelled
  totalAmount, paidAmount
  expectedDate, receivedDate
  approvedBy, approvedByName, approvedAt
  createdBy, createdByName
  notes
  
  items: PurchaseOrderItem[]
  logs:  PurchaseOrderLog[]
}
```

### PurchaseOrderItem
```prisma
PurchaseOrderItem {
  purchaseOrderId
  materialId, materialName
  quantity, unitPrice
  receivedQty      // Actual received (for partial receive)
  unit             // "kg" default
}
```

### PurchaseOrderLog – Audit Trail
```prisma
PurchaseOrderLog {
  purchaseOrderId
  action, note
  createdBy, createdAt
}
```

## Status Machine

```
draft
  └─ pending_approval  (submit for review)
       ├─ approved      (admin approves)
       │    └─ ordered  (supplier confirmed, goods on way)
       │         ├─ partially_received  (some items arrived)
       │         └─ received            (all items arrived)
       └─ cancelled     (from any state)
```

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /purchase-orders | List POs |
| GET | /purchase-orders/:id | PO detail with items |
| POST | /purchase-orders | Create PO |
| PUT | /purchase-orders/:id | Edit PO (draft only) |
| PUT | /purchase-orders/:id/submit | Submit for approval |
| PUT | /purchase-orders/:id/approve | Approve PO |
| PUT | /purchase-orders/:id/order | Mark as ordered |
| PUT | /purchase-orders/:id/receive | Mark as received |
| DELETE | /purchase-orders/:id | Delete (draft only, admin+) |
| GET | /suppliers | List suppliers |
| POST | /suppliers | Create supplier |
| PUT | /suppliers/:id | Update supplier |
| DELETE | /suppliers/:id | Delete supplier |

## Auto-Suggest PO from Materials

```
POST /materials/:id/suggest-po
  → Calculates: minStock - currentStock = needed quantity
  → Creates draft PurchaseOrder with supplier pre-filled
  → Returns PO for admin to review and submit
```

## Receipt of Goods Flow

```
PUT /purchase-orders/:id/receive { items: [{ itemId, receivedQty }] }
  → For each item: PurchaseOrderItem.receivedQty updated
  → If all items receivedQty >= quantity → status = 'received'
  → If some items partial → status = 'partially_received'
  → Create MaterialTransaction { type: 'import' } for each received item
  → Update Material.currentStock for each item
  → PurchaseOrderLog entry created
```

## Finance Connection

POs in status `ordered` + `partially_received` appear in:
`GET /finance/payables → totalPayable`

## Permissions

| Action | Roles |
|--------|-------|
| View POs | super_admin, admin, staff |
| Create PO | admin, super_admin |
| Approve PO | admin, super_admin |
| Receive goods | admin, super_admin |
| Delete PO | super_admin |
| Manage suppliers | admin, super_admin |

## Gaps

| Gap | Impact |
|-----|--------|
| No PO approval notifications | Approvers not notified via Telegram |
| No supplier portal | Suppliers must be contacted offline |
| PO cannot be partially received per item | All-or-nothing receive |
| No freight / shipping cost tracking | Total cost incomplete |
| No PO template | Repeat purchases require re-entry |
