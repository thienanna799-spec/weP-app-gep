# OpenClaw – Architecture Index

> **Master index** cho toàn bộ `ai/agents/openclaw/`.
> Đây là điểm khởi đầu bắt buộc cho mọi AI khi làm việc với GEP ERP.

---

## Đọc Theo Thứ Tự Này

```
1. role.md                → Tôi là ai, tôi có quyền gì
2. responsibilities.md    → Tôi làm gì, 7 trách nhiệm chính
3. v4-architecture.md     → [MỚI v4] Kiến trúc 5 Agent Swarm + Sensors
4. v4-capabilities.md     → [MỚI v4] Giới hạn năng lực & bảng Domain Risk
5. execution-workflow.md  → 11 bước bắt buộc, không được bỏ qua
6. review-checklist.md    → 50+ kiểm tra, điểm tuân thủ
7. risk-analysis.md       → 10 rủi ro, công thức tính điểm
8. memory-sync-rules.md   → 10 quy tắc đồng bộ memory
```

---

## Cây Thư Mục

```
ai/agents/openclaw/
│
├── INDEX.md                         ← BẠN ĐANG ĐỌC FILE NÀY
├── role.md                          ← Identity + Jurisdiction + Authority
├── responsibilities.md              ← 7 operational areas + model routing
├── execution-workflow.md            ← 11-step pipeline (full ASCII diagram)
├── review-checklist.md              ← 10 categories, 50+ checks, scoring
├── risk-analysis.md                 ← 10 risks, formula, domain matrix
├── memory-sync-rules.md             ← 10 rules, drift detection strategies
│
├── prompt-templates/
│   ├── impact-analysis.prompt.md    ← Step ③ — Flash model — JSON output
│   ├── build-plan.prompt.md         ← Step ⑥⑦ — Flash — Execution + Builder
│   ├── review.prompt.md             ← Step ⑨ — Pro model — Anti-pattern check
│   ├── governance.prompt.md         ← Step ⑤⑪ — Pro model — Veto decisions
│   └── memory-update.prompt.md      ← Step ⑩ — Flash Lite — Drift detection
│
└── policies/
    ├── locked-domains.md            ← finance/inventory/orders absolute rules
    ├── transaction-policy.md        ← When/how/boundary of $transaction
    ├── audit-policy.md              ← 9 log models, immutability, retention
    └── realtime-policy.md           ← Socket.IO transport, event registry

```

---

## Model Routing Quick Reference

| Step | Task | Model |
|------|------|-------|
| ③ Impact Analysis | Detect domains | `gemini-2.5-flash-preview` |
| ④ Risk Analysis | Score request | `gemini-2.5-flash-preview` |
| ⑤ Governance Validation | Veto decision | `gemini-2.5-pro-preview` |
| ⑥ Execution Plan | Phase plan | `gemini-2.5-flash-preview` |
| ⑦ Builder Prompt | Antigravity prompt | `gemini-2.5-flash-preview` |
| ⑨ Review Output | Compliance check | `gemini-2.5-pro-preview` |
| ⑩ Memory Sync | Drift detection | `gemini-2.5-flash-lite` |
| ⑪ Governance Log | Log write | `gemini-2.5-flash-lite` |

---

## Governance Quick Reference

```
🔴 LOCKED   → finance, inventory, orders       [P0 — VETO POWER]
🟠 GUARDED  → shipping, drivers, procurement,  [P1 — REVIEW REQUIRED]
               production-orders
🟡 CAREFUL  → customers, materials,            [P2 — ADVISORY]
               production, admin, reports
🟢 FREE     → dashboard                        [P3 — OBSERVE ONLY]
```

---

## Non-Negotiable Rules (Top 5)

```
1. NO production mutation without execution plan
2. NO P0/P1 change without governance review
3. NO cross-domain silent side effects
4. NO bypass of review layer
5. NO execution without risk classification
```

---

## Relationship Map

```
                    ┌─────────────────┐
                    │   USER REQUEST  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   OPENCLAW      │ ← Reads this folder
                    │  (Gov. OS)      │
                    └───┬───────┬─────┘
                        │       │
               Plan     │       │  Review
                        │       │
               ┌────────▼─┐  ┌──▼──────────┐
               │ANTIGRAVITY│  │ GOVERNANCE  │
               │ (Builder) │  │    LOGS     │
               └───────────┘  └─────────────┘
```

---

## Runtime Integration

OpenClaw agent docs ↔ OpenClaw runtime:

| Agent Doc | Runtime File |
|-----------|-------------|
| `execution-workflow.md` | `openclaw/orchestrator/flow.ts` |
| `review-checklist.md` | `openclaw/reviewers/governance.reviewer.ts` |
| `risk-analysis.md` | `openclaw/planners/risk.planner.ts` |
| `memory-sync-rules.md` | `openclaw/memory/sync.ts` |
| `prompt-templates/*.md` | `openclaw/planners/execution.planner.ts` |
| `policies/locked-domains.md` | `openclaw/configs/domains.config.ts` |
| `policies/transaction-policy.md` | `openclaw/configs/policies.config.ts` |
| Model routing | `openclaw/configs/model-routing.config.ts` |
