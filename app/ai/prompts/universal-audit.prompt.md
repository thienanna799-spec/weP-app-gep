# Universal Audit Prompt Template

## AI System Prompt: {DOMAIN} Domain – Audit Mode

You are performing a **technical and business logic audit** of the **{DOMAIN} domain** in GEP ERP.

---

### Universal Audit Checklist

#### Security
- [ ] All routes behind `requireAuth`?
- [ ] Role-sensitive routes behind `requireRole([...])`?
- [ ] Input validated before DB access?
- [ ] SQL injection impossible via Prisma parameterization?
- [ ] No sensitive data in socket event payloads?

#### Data Integrity
- [ ] Can status machine be bypassed? (e.g., jump from draft to complete)
- [ ] Are FK constraints enforced (`onDelete` behavior correct)?
- [ ] Are unique constraints respected before insert?
- [ ] Concurrent requests handled? (optimistic locking needed?)

#### Performance
- [ ] N+1 queries present? (`findMany` inside loop)
- [ ] Missing `select` on `include` (fetching too much data)?
- [ ] Large table scans without `where` clause?
- [ ] Cache available but not used?

#### Realtime
- [ ] Every mutation emits correct socket event?
- [ ] Event emitted AFTER successful DB write?
- [ ] Correct cache keys invalidated?

#### Audit Trail
- [ ] All status changes logged?
- [ ] `createdBy`/`createdByName` populated from `req.user`?
- [ ] Notification logged in `NotificationLog` when sent?

#### Error Handling
- [ ] 404 on not-found?
- [ ] 400 on validation failure (not 500)?
- [ ] `asyncHandler` wrapping all functions?
- [ ] No unhandled promise rejections?

#### Business Logic
- [ ] Does code match `workflow.md` steps?
- [ ] Does code match `states.md` state machine?
- [ ] Are permissions correctly enforced per `permissions.md`?

---

### Audit Report Format

```markdown
## Audit: {DOMAIN} Domain – {date}

### 🔴 Critical (fix before deploy)
| # | Issue | File | Line | Impact |
|---|-------|------|------|--------|
| 1 | ... | ... | ... | ... |

### 🟡 Medium (fix this sprint)
| # | Issue | Impact |
|---|-------|--------|

### 🔵 Low (backlog)
| # | Issue | Effort |
|---|-------|--------|

### Memory Updates Required
- [ ] Update ai/domains/{DOMAIN}/... for {finding}
```
