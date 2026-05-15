# Domain Criticality Map – GEP ERP

> Defines the operational priority of every domain for AI decision-making.
> AI MUST use this map before any refactor, migration, or optimization decision.

---

## Priority Levels

| Level | Name | Meaning |
|-------|------|---------|
| **P0** | Financial / Data Integrity Critical | Corruption = unrecoverable business damage |
| **P1** | Operational Critical | Failure = production or delivery halted |
| **P2** | Important Business Operations | Failure = degraded operations, manual workaround possible |
| **P3** | UI / Analytics / Optimization | Failure = reduced visibility, no operation impact |

---

## Domain Classification

### P0 — Financial / Data Integrity Critical

#### `finance`
| Attribute | Value |
|-----------|-------|
| Business Impact | Revenue tracking, accounts receivable, customer debt management |
| Failure Impact | Incorrect AR → wrong revenue reporting → wrong business decisions |
| Rollback Required | Yes – payment records are immutable; cannot delete |
| Audit Required | Every payment must be logged; reconciliation must be preserved |
| Transaction Required | Yes – payment creation must be atomic with paymentStatus update |
| Realtime Required | No – finance is pull-based, not live-critical |
| AI Constraint | **NEVER use floating-point arithmetic** – use integer VND (no decimals) |

#### `inventory`
| Attribute | Value |
|-----------|-------|
| Business Impact | Product roll tracking from manufacturing to customer delivery |
| Failure Impact | Stock corruption = wrong order fulfillment = customer complaints |
| Rollback Required | Yes – roll status transitions must be reversible (except loi_hong) |
| Audit Required | Every movement logged: RollScanHistory, RollMovement |
| Transaction Required | Yes – pick-roll must be atomic with status update |
| Realtime Required | Yes – `inventory_updated` event drives dashboard + reports |
| AI Constraint | **NEVER skip status validation**; status must follow exact machine |

#### `orders`
| Attribute | Value |
|-----------|-------|
| Business Impact | Core revenue driver; order lifecycle drives all other domains |
| Failure Impact | Corrupt order status = incorrect shipping, incorrect revenue, audit gaps |
| Rollback Required | Yes – approval rejection must revert cleanly |
| Audit Required | OrderLog on every status change; approver identity required |
| Transaction Required | Yes – status + log must be atomic |
| Realtime Required | Yes – `order_updated` event drives dashboard and reports |
| AI Constraint | **NEVER modify status transitions** without updating states.md |

---

### P1 — Operational Critical

#### `shipping`
| Attribute | Value |
|-----------|-------|
| Business Impact | Physical goods delivery; last-mile operation |
| Failure Impact | Orders stuck; drivers blocked; customers not received goods |
| Rollback Required | Yes – delivery failure must rollback to retryable state |
| Audit Required | DeliveryLog (every action), driver GPS |
| Transaction Required | Yes – delivery_success must be atomic with Order.status→hoan_thanh |
| Realtime Required | Yes – `shipping_updated` triggers dashboard alerts |
| AI Constraint | **NEVER mark order complete** without linked shipping confirmation |

#### `production-orders`
| Attribute | Value |
|-----------|-------|
| Business Impact | Manufacturing plan; drives roll creation and inventory supply |
| Failure Impact | Incorrect plan = wrong roll count = inventory mismatch |
| Rollback Required | Partial – completed orders should not be rolled back |
| Audit Required | Status change logs required |
| Transaction Required | Partial – roll creation should be idempotent |
| Realtime Required | No (currently missing `production_order_updated` event – gap) |
| AI Constraint | **DO NOT skip material availability check** before status=producing |

#### `drivers` (OCR Fraud Detection)
| Attribute | Value |
|-----------|-------|
| Business Impact | Fleet cost control; fraud prevention |
| Failure Impact | Undetected fraud = financial loss; driver trust collapse |
| Rollback Required | No – OcrAuditLog is append-only |
| Audit Required | OcrAuditLog on every document submission |
| Transaction Required | No – OCR runs async (fire-and-forget) |
| Realtime Required | Partial – high-risk cases should alert admin immediately |
| AI Constraint | **OCR pipeline MUST be idempotent** (check referenceId before creating audit) |

#### `procurement`
| Attribute | Value |
|-----------|-------|
| Business Impact | Material supply chain; feeds production |
| Failure Impact | Missed PO = production stoppage |
| Rollback Required | Yes – receipt of goods creates MaterialTransaction (hard to undo) |
| Audit Required | PurchaseOrderLog on every transition |
| Transaction Required | Yes – receive goods + MaterialTransaction must be atomic |
| Realtime Required | No |
| AI Constraint | **NEVER remove PurchaseOrderLog creation** from status transitions |

---

### P2 — Important Business Operations

#### `customers`
| Attribute | Value |
|-----------|-------|
| Business Impact | Customer relationship, pricing, CRM |
| Failure Impact | Wrong pricing applied to orders; CRM data lost |
| Rollback Required | Soft – notes and activities should not be deletable |
| Audit Required | CustomerActivity on CRM events |
| Transaction Required | No |
| Realtime Required | No (gap – no socket events for customer mutations) |
| AI Constraint | Pricing overrides affect order calculation – test after any pricing change |

#### `materials`
| Attribute | Value |
|-----------|-------|
| Business Impact | Raw material stock tracking |
| Failure Impact | Incorrect stock count = production plan errors |
| Rollback Required | MaterialTransaction is append-only (correction = new offsetting transaction) |
| Audit Required | MaterialTransaction on every stock movement |
| Transaction Required | Yes – stock update + transaction must be atomic |
| Realtime Required | No (gap – missing `material_stock_changed` event) |
| AI Constraint | **NEVER directly update currentStock** – always via MaterialTransaction |

#### `production`
| Attribute | Value |
|-----------|-------|
| Business Impact | Physical roll creation; feeds inventory |
| Failure Impact | Roll created without QR = untrackable inventory |
| Rollback Required | loi_hong rolls are terminal – no rollback |
| Audit Required | RollScanHistory on every QR scan |
| Transaction Required | Partial |
| Realtime Required | Yes – `inventory_updated` on scan-to-stock |
| AI Constraint | QR codes must be globally unique; validate before insert |

#### `reports`
| Attribute | Value |
|-----------|-------|
| Business Impact | Business intelligence; KPI visibility |
| Failure Impact | Stale data displayed; wrong business decisions |
| Rollback Required | No – computed, not stored |
| Audit Required | No |
| Transaction Required | No |
| Realtime Required | Yes – cache invalidation on socket events |
| AI Constraint | **NEVER bypass cache invalidation logic** when adding new socket events |

---

### P3 — UI / Analytics / Optimization

#### `dashboard`
| Attribute | Value |
|-----------|-------|
| Business Impact | At-a-glance operational view |
| Failure Impact | Reduced visibility; operations continue manually |
| Rollback Required | No |
| Audit Required | No |
| Transaction Required | No |
| Realtime Required | Preferred – but degraded mode acceptable |
| AI Constraint | Safe to optimize; do not break summary report API shape |

#### `admin`
| Attribute | Value |
|-----------|-------|
| Business Impact | User management, permissions, system config |
| Failure Impact | Wrong permissions applied system-wide |
| Rollback Required | Yes – role changes should be audited and reversible |
| Audit Required | UserLoginLog, UserActivityLog |
| Transaction Required | No |
| Realtime Required | Yes – `user_updated` fires on role/permission change |
| AI Constraint | **super_admin role change MUST fire user_updated** to reload all clients |

---

## Quick Reference Table

| Domain | Priority | Transactions? | Realtime? | Audit? | Hard to Rollback? |
|--------|:--------:|:-------------:|:---------:|:------:|:----------------:|
| finance | P0 | ✅ | ❌ | ✅ | ✅ |
| inventory | P0 | ✅ | ✅ | ✅ | ✅ |
| orders | P0 | ✅ | ✅ | ✅ | ✅ |
| shipping | P1 | ✅ | ✅ | ✅ | ⚠️ |
| production-orders | P1 | ⚠️ | ❌ | ✅ | ⚠️ |
| drivers/OCR | P1 | ❌ | ⚠️ | ✅ | ✅ |
| procurement | P1 | ✅ | ❌ | ✅ | ✅ |
| customers | P2 | ❌ | ❌ | ⚠️ | ❌ |
| materials | P2 | ✅ | ❌ | ✅ | ⚠️ |
| production | P2 | ⚠️ | ✅ | ✅ | ⚠️ |
| reports | P2 | ❌ | ✅ | ❌ | ❌ |
| dashboard | P3 | ❌ | ✅ | ❌ | ❌ |
| admin | P3 | ❌ | ✅ | ✅ | ❌ |
