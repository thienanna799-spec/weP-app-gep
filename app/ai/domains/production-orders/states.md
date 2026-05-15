# Production Orders Domain – States

> See `ai/shared/status-flows.md` for full diagram.

## ProductionOrder Status

| Status | Meaning | Transition Trigger |
|--------|---------|-------------------|
| `waiting_material` | Materials not yet confirmed available | Initial state |
| `ready` | All materials confirmed in stock | Manual by warehouse staff |
| `producing` | Machine running, rolls being created | Manual by supervisor |
| `completed` | All target rolls created and scanned | Manual when rolls.length >= targetRolls |
| `cancelled` | Production aborted | Manual by admin |

## Transition Validation

```
waiting_material → ready
  Condition: All ProductionOrderMaterial quantities available in Material.currentStock
  Who: warehouse staff, admin

ready → producing
  Condition: Machine available, workers assigned
  Who: production supervisor, admin

producing → completed
  Condition: Actual rolls created >= targetRolls (currently NOT validated in code)
  Who: admin

any → cancelled
  Condition: No completed rolls yet (soft rule, not enforced)
  Who: admin
```

> ⚠️ **Gap**: No server-side validation that `targetRolls` is met before marking `completed`.

## ProductRoll Status (Created During Production)

```
dang_san_xuat  ← Roll created in production order
  ↓ QR scan-to-stock
trong_kho      ← Roll in warehouse inventory

dang_san_xuat
  ↓ worker marks defective
loi_hong       ← Defective, excluded from inventory (terminal)
```

## ProductionOrderMaterial (Materials Consumed)

No status field – records planned quantities.
Actual consumption tracked via `MaterialTransaction` (import: supplier, export: production use).

> ⚠️ **Gap**: No automatic MaterialTransaction created when production starts/completes.
