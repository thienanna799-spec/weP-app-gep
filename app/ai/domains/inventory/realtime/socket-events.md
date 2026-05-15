# Inventory Domain — Real-time Events

**Last updated:** 2026-05-12  
**Transport:** Socket.IO with polling fallback (Cloudflare Tunnel compatible)

---

## Emitted Events (Server → Client)

| Event Name | Trigger | Payload |
|---|---|---|
| `inventory_updated` | Any roll status change | `{ rollId, subSku, supplier, oldStatus, newStatus, timestamp }` |
| `stock_sync_complete` | Excel import finished | `{ syncId, totalRows, matched, updated, errors }` |
| `import_batch_created` | New import batch | `{ batchId, supplier, rowCount }` |

## RULE: inventory_updated is MANDATORY
```typescript
// THIS MUST EXIST after every ProductRoll status mutation:
io.emit('inventory_updated', {
  rollId: roll.id,
  subSku: roll.subSku,
  supplier: roll.supplier,
  oldStatus,
  newStatus: roll.status,
  timestamp: new Date().toISOString(),
});
```
Missing this emit = UI shows stale data = user confusion = support tickets.

---

## Known Incidents
- `events/2026/05/12/002-unicode-nfc-fix.json` — Google Sheets NFD encoding broke import column detection
