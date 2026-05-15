# Universal Build Prompt Template
# Copy and fill {DOMAIN} and {DOMAIN_RULES} for any domain

## AI System Prompt: {DOMAIN} Domain – Build Mode

You are working on **GEP ERP** – Vietnamese bubble wrap manufacturing ERP.

**Tech Stack:** Express.js + TypeScript + Prisma + MySQL 8 | React 18 + Vite + TailwindCSS | Socket.IO | Firebase Auth

---

### STEP 1: Read Memory Before Coding

You MUST read these files before writing any code:
```
ai/system/engineering-rules.md      ← Non-negotiable rules
ai/system/event-standards.md        ← Socket.IO event registry
ai/domains/{DOMAIN}/skill.md        ← Domain API map
ai/domains/{DOMAIN}/workflow.md     ← Business flow
ai/domains/{DOMAIN}/states.md       ← Status machine
ai/domains/{DOMAIN}/permissions.md  ← Who can do what
```

---

### STEP 2: Non-Negotiable Architecture Rules

1. **Every mutation MUST emit a Socket.IO event** – check `ai/system/event-standards.md` for correct event name
2. **Every status change MUST create an audit log entry** – check domain audit policy
3. **NEVER write to DB inside a GET handler** – reads are reads
4. **ALWAYS use `asyncHandler` wrapper** – no try/catch blocks
5. **ALWAYS use `sendSuccess` / `sendError`** – never `res.json()` directly
6. **NEVER add N+1 queries** – use `Promise.all` or `groupBy`
7. **ALWAYS validate inputs** – return 400 before prisma calls

---

### STEP 3: Cross-Domain Impact Check

Before implementing, answer:
- Does this change status/states? → update `states.md`
- Does this add an API? → update `skill.md` APIs table
- Does this emit a new socket event? → update `event-standards.md`
- Does this touch another domain? → read that domain's memory too
- Does this change permissions? → update `permissions.md`

---

### STEP 4: Implementation Pattern

```typescript
// Backend controller
export const actionName = asyncHandler(async (req: AuthRequest, res: Response) => {
  // 1. Validate input
  const { field } = req.body;
  if (!field) return sendError(res, 'field is required', 400);

  // 2. Business logic check
  const entity = await prisma.entity.findUnique({ where: { id: req.params.id } });
  if (!entity) return sendError(res, 'Not found', 404);

  // 3. Persist
  const updated = await prisma.entity.update({ where: { id: entity.id }, data: { ... } });

  // 4. Audit log (if required by domain)
  await prisma.entityLog.create({ data: { entityId: entity.id, action: 'action_name', createdBy: req.user!.uid } });

  // 5. Emit socket event
  const io = req.app.get('io');
  io.emit('{domain}_updated', { entityId: updated.id, status: updated.status });

  // 6. Respond
  sendSuccess(res, updated, 200, 'Action completed');
});
```

---

### STEP 5: After Implementation

Update these memory files if anything changed:
- [ ] `ai/domains/{DOMAIN}/skill.md` – new APIs
- [ ] `ai/domains/{DOMAIN}/workflow.md` – new workflow steps
- [ ] `ai/domains/{DOMAIN}/states.md` – new states
- [ ] `ai/system/event-standards.md` – new socket events
- [ ] `ai/system/audit-policy.md` – new audit logs
