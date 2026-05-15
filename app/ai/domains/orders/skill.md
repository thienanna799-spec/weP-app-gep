# Orders Domain – Skill Map

## What This Domain Does
Orders represent customer purchase requests. An order is the **central entity** that drives production, inventory picking, shipping, and finance in GEP.

## Core Model

```prisma
Order {
  code              // Auto-generated: "DH-YYYYMMDD-XXXX"
  customerId        // Optional (can be walk-in)
  customerName, customerPhone, customerEmail, customerAddress
  
  status            // nhap → cho_duyet → da_duyet → ... → hoan_thanh
  priority          // thap | trung_binh | cao | khan_cap
  paymentMethod     // cod | bank_transfer | credit
  paymentStatus     // chua_thanh_toan | thanh_toan_mot_phan | da_thanh_toan
  bankAccountId     // Which GEP bank account to receive payment
  
  quantity          // Total item quantity
  deliveryDeadline
  
  approvedBy, approvedByName, approvedAt
  createdBy, createdByName
  
  totalRevenue, totalCost, profit   // Calculated financials
  
  // Relations
  items            // OrderItem[] – line items
  logs             // OrderLog[] – audit trail
  deliveryProofs   // DeliveryProof[] – photos/videos
  productionOrders // ProductionOrder[] – production linked
  rolls            // ProductRoll[] – inventory linked
  shippingOrders   // ShippingOrder[] – delivery linked
  payments         // Payment[] – payment records
  returnRequests   // ReturnRequest[]
  contactLogs      // ContactLog[] – driver-customer comms
}
```

## Order Items

```prisma
OrderItem {
  orderId
  productName, specification
  quantity, unit
  unitPrice
  sku       // Customer-facing SKU
  subSku    // Internal warehouse sub-SKU
  note
}
```

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /orders | List orders (filterable by status, customer, date) |
| GET | /orders/:id | Order detail with items |
| POST | /orders | Create order |
| PUT | /orders/:id | Edit order (while in nhap/tu_choi) |
| PUT | /orders/:id/approve | Approve (admin+) |
| PUT | /orders/:id/reject | Reject (admin+) |
| PUT | /orders/:id/cancel | Cancel |
| PUT | /orders/:id/status | Update status |
| PUT | /orders/:id/payment-status | Update payment status |
| GET | /orders/:id/items | Get line items |
| GET | /orders/:id/logs | Audit trail |
| POST | /orders/:id/pick-roll | Assign inventory roll to order |
| POST | /orders/:id/assign-driver | Assign driver for delivery |
| POST | /orders/:id/complete-delivery | Mark delivery complete |
| POST | /orders/:id/fail-delivery | Mark delivery failed |
| GET | /orders/:id/delivery-proofs | Photo proof of delivery |
| POST | /orders/:id/delivery-proofs | Upload proof |
| GET | /orders/:id/contact-logs | Driver-customer communications |
| POST | /orders/:id/contact-logs | Log a call/message |

## Business Rules

1. **Approval required**: Orders must go through `nhap → cho_duyet → da_duyet` before production
2. **Priority escalation**: `khan_cap` orders should be visible at top of all lists
3. **Payment tracking**: Multiple partial payments allowed via `Payment` model
4. **Delivery proof**: Required before marking `hoan_thanh`
5. **Contact logs**: Driver records all customer contact attempts during delivery

## Domain Connections

```
Order ──→ ProductionOrder (1:many – order can spawn multiple production runs)
Order ──→ ProductRoll (rolls can be assigned to an order)
Order ──→ ShippingOrder (1:1 per delivery)
Order ──→ Payment (many partial payments)
Order ──→ ReturnRequest (if delivery fails)
Order ──→ Customer (optional link to customer master)
```

## Contact Log (Driver ↔ Customer Communication)

```prisma
ContactLog {
  orderId
  type:   "call" | "message"
  phoneNumber
  result: "connected" | "no_answer" | "busy" | "wrong_number"
  duration  // seconds (for calls)
  content   // message content (for messages)
  method:   "sms" | "zalo" | "other"
  recordingUrl  // call recording
  createdBy, createdByName
}
```

## Missing Features (Gaps)

| Gap | Risk |
|-----|------|
| No order duplication | Staff must re-enter repeat orders manually |
| No bulk order operations | Can't approve multiple orders at once |
| No order template | Repeat customers can't save order templates |
| No automatic production order creation | Must be done manually after approval |
