# Customers Domain – Skill Map

## What This Domain Does
Manages the complete customer master data and CRM lifecycle for GEP's B2B/B2C bubble wrap customers. Customers are the starting point of every order.

## Core Models

### Customer (master)
```prisma
Customer {
  code            // e.g. "KH-0001" (unique, system-generated)
  name            // Business or individual name
  phone           // May contain multiple numbers (comma-separated)
  email, address
  province, district
  customerType    // ca_nhan | doanh_nghiep
  company, taxCode
  
  // CRM Extended Fields
  recipientName       // Who receives deliveries
  groupName           // Zalo/chat group name
  groupChatLink       // Zalo/Messenger group URL
  operatingPlatform   // Shopee, Lazada, TikTok, etc.
  customerCharacteristics  // Notes on buying behavior
  gipCode             // GEP internal product code
  product             // Main product they buy
  operationalStatus   // active | inactive | stopped
  boss                // Account manager / responsible person
  tag                 // VIP, Tiềm năng, etc.
  googleMapsLink      // Exact delivery GPS location
  
  // Financial
  creditLimit     // 0 = unlimited
  creditDays      // Payment due days (default 30)
  preferredPayment // cod | bank_transfer | credit
  totalOrders, totalRevenue  // Denormalized counters
  
  // Relations
  orders, crmNotes, crmFollowUps, crmActivities
  pricingRules    // Per-customer price overrides
  subSkuStatuses  // Which sub-SKUs are enabled/disabled for this customer
}
```

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /customers | List with search/filter |
| GET | /customers/search | Quick search by name/phone |
| GET | /customers/:id | Full customer detail |
| POST | /customers | Create new customer |
| PUT | /customers/:id | Update customer |
| DELETE | /customers/:id | Delete (admin only) |
| GET | /customers/:id/orders | Order history |
| GET | /customers/:id/history | Activity history |
| POST | /customers/check-phone | Check if phone exists |
| GET | /customers/import-template | Download Excel template |
| POST | /customers/import-excel | Bulk import from Excel |

## Key Business Rules

1. **Phone uniqueness**: `checkPhone` prevents duplicate phone numbers
2. **Code auto-generation**: `KH-XXXX` format, sequential
3. **Credit check**: Before creating order, check `creditLimit` and `creditDays`
4. **Operational status**: `stopped` customers should block new orders
5. **Sub-SKU control**: Each customer can have specific sub-SKUs enabled/disabled

## Connected Domains
- **Orders**: Every order has a customerId (optional, can be walk-in)
- **Finance**: Receivables tracked per customer
- **CRM**: Notes, follow-ups, activity timeline per customer
- **Pricing**: Custom price overrides per customer per SKU
