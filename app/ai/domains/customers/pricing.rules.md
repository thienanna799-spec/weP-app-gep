# Customer Pricing Rules

## Overview
GEP supports **per-customer, per-SKU price overrides**. By default, orders use standard pricing. If a customer has a pricing rule for a specific SKU, that price takes precedence.

## Model

```prisma
CustomerPricing {
  customerId
  sku         // e.g. "BWP-TH-BLACK-4inch"
  price       // Override unit price (VND)
  isActive    // Can be toggled without deletion
  updatedBy, updatedByName
}
```

Unique constraint: `(customerId, sku)` – one price per customer per SKU.

## Sub-SKU Status Control

```prisma
CustomerSubSkuStatus {
  customerId
  subSku      // Internal warehouse sub-SKU code
  isActive    // If false, this sub-SKU is hidden for this customer
}
```
Used to control which product variants a customer can order.

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /customers/:id/pricing | Get all pricing rules for customer |
| POST | /customers/:id/pricing | Add a new pricing rule |
| PUT | /customers/pricing/:id | Update price for a rule |
| PATCH | /customers/pricing/:id/toggle | Enable/disable a rule |
| PATCH | /customers/:id/subsku-toggle | Toggle sub-SKU visibility |
| GET | /customers/:id/subsku-status | Get all sub-SKU statuses |
| GET | /customers/export-pricing | Export all pricing to Excel |
| GET | /customers/pricing-template | Download bulk import template |
| POST | /customers/import-pricing | Bulk import from Excel |

## Pricing Lookup Flow

When creating an order item:
```
1. Get customer's pricing rules: GET /customers/:id/pricing
2. For each order item, check if customer has a rule for that SKU
3. If yes and isActive=true → use CustomerPricing.price
4. If no → use standard product price
```

## Business Rules

1. Pricing rules are **SKU-specific** (not sub-SKU)
2. Only active rules (`isActive=true`) apply
3. Rules can be imported in bulk via Excel template
4. Price override is per-unit, same unit as the order item
5. Deactivated rules are preserved (audit trail) but not applied

## Gaps

| Gap | Issue |
|-----|-------|
| No price validity dates | Prices never expire automatically |
| No approval flow | Any staff can change customer pricing |
| No price history | When price changes, old value is lost |
| No volume tiers | No "buy X get price Y" tiered pricing |
