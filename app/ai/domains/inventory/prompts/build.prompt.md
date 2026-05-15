# Build Prompt – Inventory Domain

> Load this file as AI context before building any Inventory feature.

## 1. Domain Memory (Read First)

```
ai/domains/inventory/skill.md       ← Models, APIs, cross-domain links
ai/domains/inventory/workflow.md    ← 5 core workflows
ai/domains/inventory/states.md      ← Roll status machine
ai/domains/inventory/stocktake.md   ← Stocktake process
ai/shared/qr-flow.md               ← QR cross-domain lifecycle
ai/shared/status-flows.md          ← Full state machine diagrams
```

## 2. Governance

```
Domain criticality: P0 – Financial/Data Integrity Critical
Governance level:   🔴 LOCKED
Reference:          ai/system/domain-criticality.md
                    ai/system/ai-execution-governance.md
```

## 3. Mandatory Rules When Building

```
✅ ALWAYS validate roll.status before any status change
✅ ALWAYS use Prisma $transaction for pick-roll + status update
✅ ALWAYS emit io.emit('inventory_updated', { rollId, status }) after every status change
✅ ALWAYS create RollScanHistory entry on every QR scan
✅ ALWAYS check qrCode uniqueness before creating new roll
✅ ALWAYS follow exact status machine:
   dang_san_xuat → trong_kho → da_giu_cho_don → da_xuat_kho

❌ NEVER delete ProductRoll records (use status instead)
❌ NEVER allow arbitrary status jumps (e.g., dang_san_xuat → da_xuat_kho)
❌ NEVER update stock count directly (go through status machine)
❌ NEVER suppress inventory_updated events
❌ NEVER add DB writes to GET handlers
```

## 4. Standard Code Pattern

```typescript
// Correct: Atomic status update + scan history
await prisma.$transaction([
  prisma.productRoll.update({
    where: { id: rollId },
    data: { status: 'trong_kho', positionWarehouse, positionArea }
  }),
  prisma.rollScanHistory.create({
    data: { rollId, scannedBy, action: 'scan_to_stock', timestamp: new Date() }
  }),
]);

// After transaction:
const io = req.app.get('io');
io.emit('inventory_updated', { rollId, status: 'trong_kho' });
```

## 5. Cross-Domain Impacts to Check

| Change | Domains Affected |
|--------|----------------|
| Roll status changes | reports (cache), orders (reservation), shipping |
| New roll created | production-orders (count tracking) |
| Stocktake completed | reports, finance (asset valuation) |
| Capacity threshold reached | dashboard (alert), reports |

## 6. Post-Build Checklist

```markdown
- [ ] Status validation present before every status change?
- [ ] Prisma $transaction used for atomic operations?
- [ ] io.emit('inventory_updated') fires after every mutation?
- [ ] RollScanHistory created on QR scan?
- [ ] QR uniqueness checked before roll creation?
- [ ] No DB write inside GET handler?
- [ ] states.md updated if status machine changed?
- [ ] workflow.md updated if workflow steps changed?
```
