# Inventory Domain — Business Rules (LOCKED 🔴)

**Governance Level:** CRITICAL  
**Last updated:** 2026-05-12

---

## IMMUTABLE RULES

### RULE I-01: Socket emit after every mutation
```typescript
// REQUIRED after every stock status change:
io.emit('inventory_updated', {
  rollId, subSku, supplier,
  oldStatus, newStatus,
  timestamp: new Date().toISOString()
});
```

### RULE I-02: loi_hong is a TERMINAL state
```
❌ FORBIDDEN: roll.status = "loi_hong" → any other status
✅ TERMINAL: Once loi_hong, always loi_hong
```
Reason: Damaged roll must stay in system for audit. Cannot be "unbroken".

### RULE I-03: Prisma transaction for pick + status update
```typescript
// REQUIRED:
await prisma.$transaction([
  prisma.productRoll.update({ where: { id }, data: { status: 'da_cat' } }),
  prisma.rollScanHistory.create({ data: { rollId, action, userId } }),
]);
```

### RULE I-04: RollScanHistory on every QR scan
Every QR scan action MUST create a `RollScanHistory` record:
- rollId, userId, action, timestamp, location

### RULE I-05: Validate status transition BEFORE update
```
Available transitions:
  cho_cat    → dang_cat, loi_hong
  dang_cat   → da_cat, loi_hong  
  da_cat     → da_giao (via order pick)
  da_giao    → [terminal]
  loi_hong   → [terminal — NO transitions out]
```

---

## Excel Import Rules

### RULE I-06: NFC normalization for external data
```typescript
// REQUIRED for any Excel/Google Sheets import:
const key = rawKey.normalize('NFC').trim();
```
Reason: Google Sheets exports NFD; source code uses NFC. See ADR-015.

### RULE I-07: Required columns for stock sync
- `XƯỞNG` (supplier/factory)
- `SUB-SKU` (product variant identifier)
Both must be present after NFC normalization.

---

## Related ADRs
- `adr/ADR-015-unicode-nfc-normalization.md`
