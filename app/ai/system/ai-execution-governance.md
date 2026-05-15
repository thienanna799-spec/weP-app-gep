# AI Execution Governance – GEP ERP

> This is the highest-authority document in the GEP AI architecture.
> Every AI-assisted code change MUST be evaluated against these governance rules before execution.
> When in doubt: **STOP, read this file, re-evaluate.**

---

## Governance Levels

| Level | Name | Meaning |
|-------|------|---------|
| 🔴 **LOCKED** | Non-negotiable constraint | Violating breaks system integrity or financial accuracy |
| 🟠 **GUARDED** | Requires explicit verification | Must verify impact before proceeding |
| 🟡 **CAREFUL** | Proceed with care | Low risk but needs awareness |
| 🟢 **FREE** | Safe to optimize | No constraints beyond good engineering |

---

## Domain-Level Execution Rules

### `finance` — 🔴 LOCKED

```
AI MUST:
✅ Use integer arithmetic for all monetary values (no floats)
✅ Create Payment records atomically with paymentStatus update
✅ Validate amount does not exceed remaining AR + 1 VND
✅ Preserve Payment immutability (no update, no delete)
✅ Preserve reconciliation formulas exactly as documented in finance.rules.md

AI MUST NOT:
❌ Delete Payment records
❌ Modify payment amount after creation
❌ Use JavaScript number for currency (use integer VND)
❌ Change revenue recognition criteria without updating finance.rules.md
❌ Bypass credit check logic
❌ Skip paymentStatus recalculation after payment creation
```

### `inventory` — 🔴 LOCKED

```
AI MUST:
✅ Validate current roll status before any status change
✅ Emit io.emit('inventory_updated', ...) after every status change
✅ Create RollScanHistory on every QR scan
✅ Preserve loi_hong as a terminal state (no rollback from loi_hong)
✅ Use Prisma transaction for pick-roll + status update

AI MUST NOT:
❌ Delete ProductRoll records
❌ Skip status validation (allow arbitrary status jumps)
❌ Suppress inventory_updated events
❌ Modify RollScanHistory or RollMovement records
❌ Update stock counts directly (always go through status machine)
```

### `orders` — 🔴 LOCKED

```
AI MUST:
✅ Create OrderLog on every status change with action + old/new values
✅ Emit io.emit('order_updated', { orderId, status }) after every mutation
✅ Validate status transitions follow the defined machine (states.md)
✅ Use Prisma transaction for delivery completion (order + shipping atomic)
✅ Validate role before approve/reject (admin+ only)

AI MUST NOT:
❌ Delete OrderLog records
❌ Allow status to jump steps (nhap → hoan_thanh directly)
❌ Approve/reject without checking req.user role
❌ Suppress order_updated events
❌ Mark order hoan_thanh without linked giao_thanh_cong ShippingOrder
```

### `shipping` — 🟠 GUARDED

```
AI MUST:
✅ Append-only DeliveryLog (never update existing entries)
✅ Emit shipping_updated on every status change
✅ Emit order_updated when order completes due to delivery
✅ Validate driver is assigned before status → dang_giao
✅ Create ReturnRequest automatically on giao_that_bai

AI MUST VERIFY:
⚠️ Cross-domain: does changing shipping status require Order status change?
⚠️ On delivery success: confirm ProductRoll statuses are all da_xuat_kho
⚠️ On delivery failure: confirm ReturnRequest is created
```

### `drivers / OCR` — 🟠 GUARDED

```
AI MUST:
✅ Never write to DB inside GET /drivers or GET /vehicles handlers
✅ Populate imageHash before creating FuelLog
✅ Check referenceId before creating OcrAuditLog (idempotency)
✅ Handle OcrQueue.addJob() failure gracefully (do not crash main request)
✅ Preserve OcrAuditLog immutability (only reviewStatus can change)

AI MUST VERIFY:
⚠️ Any new FuelLog field: does it need OCR processing?
⚠️ Any new expense type: does it need an OcrAuditLog?
⚠️ Trust score is computed, not stored – avoid N+1 queries

AI MUST NOT:
❌ Write to driver.status or vehicle.status inside GET handlers
❌ Delete OcrAuditLog records
❌ Modify extractedValue, declaredValue, rawOcrText after creation
```

### `production-orders` — 🟠 GUARDED

```
AI MUST VERIFY:
⚠️ Do material stock levels support new production order?
⚠️ Does completing production update inventory correctly?
⚠️ Are ProductionOrder.rolls linked correctly before marking completed?

AI MUST NOT:
❌ Skip creation of ProductionOrderLog on status changes
❌ Suppress inventory_updated events when rolls scan to stock
```

### `procurement` — 🟠 GUARDED

```
AI MUST:
✅ Create PurchaseOrderLog on every status transition
✅ Create MaterialTransaction atomically when goods received
✅ Update Material.currentStock atomically with MaterialTransaction

AI MUST NOT:
❌ Delete PurchaseOrderLog
❌ Receive goods without creating MaterialTransaction
```

### `materials` — 🟡 CAREFUL

```
AI MUST:
✅ Update Material.status after every currentStock change
✅ Create MaterialTransaction for every stock change (never update currentStock directly)

AI SHOULD:
→ Emit material_stock_changed event (currently missing – add when implementing)
```

### `customers` — 🟡 CAREFUL

```
AI SHOULD:
→ Create CustomerActivity entry for CRM events
→ Not delete notes (only admin-level soft delete)

AI MUST KNOW:
→ Customer pricing affects Order calculation (test after pricing changes)
```

### `reports` — 🟡 CAREFUL

```
AI MUST:
✅ Update invalidateCacheForEvent() when adding new socket events
✅ Never change response schema of report endpoints (frontend depends on exact shape)
✅ Maintain HOT vs COLD TTL distinction (summary=5min, others=1hr)

AI MUST NOT:
❌ Remove cache invalidation logic
```

### `dashboard` — 🟢 FREE

```
Safe to:
→ Optimize component rendering
→ Change UI layout
→ Add new KPI cards (consuming existing API data)
→ Improve realtime update logic

Must not:
→ Change the GET /reports/summary API contract (response shape)
```

### `admin` — 🟡 CAREFUL

```
AI MUST:
✅ Emit user_updated after role or permission changes
✅ Validate super_admin role before role-change operations

AI MUST VERIFY:
⚠️ Permission matrix changes affect ALL modules simultaneously
```

---

## Cross-Domain Modification Rules

When a change touches multiple domains, apply the STRICTEST domain rule:

```
Changing inventory + finance together → Apply 🔴 LOCKED rules
Changing shipping + orders together  → Apply 🔴 LOCKED rules
Changing drivers + procurement       → Apply 🟠 GUARDED rules
Changing dashboard + reports         → Apply 🟡 CAREFUL rules
```

---

## Pre-Execution Checklist (Required for P0/P1 Changes)

```markdown
### AI Execution Pre-Check

Domain(s): _______________
Governance Level: 🔴 / 🟠 / 🟡 / 🟢

- [ ] Read domain criticality: ai/system/domain-criticality.md
- [ ] Read relevant risk: ai/system/risk-matrix.md
- [ ] Read critical workflows: ai/system/critical-workflows.md
- [ ] Checked: does this change a status machine? → states.md updated?
- [ ] Checked: does this change a workflow step? → workflow.md updated?
- [ ] Checked: does this remove or alter an audit log? → STOP if yes
- [ ] Checked: does this add a DB mutation inside a GET? → STOP if yes
- [ ] Checked: does this affect financial calculations? → integer-only verified?
- [ ] Verified: socket event emitted after mutation?
- [ ] Verified: Prisma transaction used for atomic operations?
- [ ] Memory sync: which ai/ files need updating?
```

---

## Immutable Architecture Constraints

These architectural decisions cannot be changed by AI without explicit user approval:

| Constraint | Why |
|-----------|-----|
| Socket.IO transports include 'polling' | Cloudflare Tunnel compatibility |
| Firebase Admin SDK for auth | All tokens, session management tied to Firebase |
| Prisma as ORM | Schema = source of truth; changing ORMs requires full migration |
| Vietnamese enum values in DB | Data in production uses Vietnamese strings |
| Express body limit 25MB | Tied to base64 image upload size |
| CUID for primary keys | All existing relationships use CUIDs |
| asyncHandler wrapper pattern | Central error handling tied to this pattern |
| sendSuccess / sendError pattern | Frontend depends on response envelope |

---

## Final Rule

> If you are AI and you are about to:
> - Delete audit log records
> - Modify payment amounts
> - Remove socket event emissions
> - Add DB writes inside GET handlers
> - Use floating-point for money
> - Skip status machine validation
>
> **STOP. Do not proceed. Ask the user first.**
