# Build Prompt – Finance Domain

> Load this file as AI context before building any Finance feature.

## 1. Domain Memory (Read First)

```
ai/domains/finance/skill.md         ← Models, APIs, KPI endpoints
ai/domains/finance/workflow.md      ← Payment, debt alert, AP, invoice flows
ai/domains/finance/credit.rules.md  ← Credit limit, overdue detection
ai/domains/finance/receivables.md   ← AR calculation, aging, endpoint shape
ai/shared/finance.rules.md         ← Revenue recognition, payment validation
ai/shared/notification.rules.md    ← Telegram debt alert rules
```

## 2. Governance

```
Domain criticality: P0 – Financial/Data Integrity Critical
Governance level:   🔴 LOCKED
Reference:          ai/system/ai-execution-governance.md
                    ai/system/critical-workflows.md (WORKFLOW-003)
```

## 3. Mandatory Rules – NON-NEGOTIABLE

```
✅ ALWAYS use integer arithmetic for all VND amounts (no floats)
✅ ALWAYS create Payment atomically with paymentStatus update ($transaction)
✅ ALWAYS validate: amount <= (totalRevenue - totalPaid) + 1
✅ ALWAYS preserve Payment immutability (no update, no delete)
✅ ALWAYS recalculate paymentStatus after every payment

❌ NEVER use JavaScript floating-point for money
❌ NEVER delete Payment records (create reversal if needed)
❌ NEVER modify payment.amount after creation
❌ NEVER bypass the overpayment validation
❌ NEVER change revenue recognition criteria without updating finance.rules.md
```

## 4. Payment Creation Pattern

```typescript
// ✅ CORRECT: Atomic payment + paymentStatus update
const result = await prisma.$transaction(async (tx) => {
  // 1. Get current total paid
  const payments = await tx.payment.findMany({ where: { orderId } });
  const currentPaid = payments.reduce((sum, p) => sum + p.amount, 0);  // integer sum

  // 2. Validate (integer arithmetic ONLY)
  const remaining = order.totalRevenue - currentPaid;
  if (amount > remaining + 1) {
    throw new Error('Số tiền vượt quá công nợ còn lại');
  }

  // 3. Create payment (immutable)
  const payment = await tx.payment.create({
    data: { orderId, amount, method, reference, note, createdBy }
  });

  // 4. Recalculate and update paymentStatus atomically
  const newTotal = currentPaid + amount;
  const newStatus = newTotal >= order.totalRevenue ? 'da_thanh_toan' : 'thanh_toan_mot_phan';
  await tx.order.update({
    where: { id: orderId },
    data: { paymentStatus: newStatus }
  });

  return payment;
});
```

## 5. Revenue Recognition Rule

```typescript
// Include in AR + finance summary:
status IN ('hoan_thanh', 'dang_giao')  ← Current (aggressive)

// Note: dang_giao orders may fail → AR could be overstated
// Do NOT change this rule without business sign-off + updating finance.rules.md
```

## 6. Cross-Domain Impacts to Check

| Change | Domains Affected |
|--------|----------------|
| Payment recorded | orders (paymentStatus), reports (finance KPI cache) |
| Debt alert sent | notification log, customers |
| Invoice generated | customers (telegramChatId needed), shipping |
| Credit limit changed | orders (approval gate), customers |

## 7. Post-Build Checklist

```markdown
- [ ] Integer arithmetic used throughout (no parseFloat, no /100)?
- [ ] Payment creation wrapped in $transaction?
- [ ] paymentStatus recalculated atomically with payment?
- [ ] Overpayment validation present (amount <= remaining + 1)?
- [ ] Payment immutability preserved (no update/delete endpoints)?
- [ ] Telegram failures caught and logged (non-critical path)?
- [ ] finance.rules.md updated if revenue recognition logic changed?
```
