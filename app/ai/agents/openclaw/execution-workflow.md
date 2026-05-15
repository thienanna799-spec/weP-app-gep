# OpenClaw – Execution Workflow

> The mandatory 11-step pipeline for every request OpenClaw processes.
> **NO STEP MAY BE SKIPPED** for P0/P1 domain requests.

---

## Full Pipeline

```
┌────────────────────────────────────────────────────────────────┐
│              OPENCLAW EXECUTION PIPELINE                        │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USER REQUEST (natural language)                                 │
│       │                                                          │
│       ▼                                                          │
│  ① READ MEMORY                                                   │
│       │ Read all ai/**/*.md files (99+ files)                   │
│       │ Parse: APIs, states, workflows, events, risks           │
│       │                                                          │
│       ▼                                                          │
│  ② BUILD CONTEXT GRAPH                                           │
│       │ Map domain boundaries                                    │
│       │ Map cross-domain links (15 defined links)               │
│       │ Map active risks (10 risks)                             │
│       │ Map system rules (12 engineering rules)                 │
│       │                                                          │
│       ▼                                                          │
│  ③ IMPACT ANALYSIS                                               │
│       │ Detect primary domain (keyword + semantic matching)      │
│       │ Detect secondary domains (cross-domain propagation)      │
│       │ Detect governance level (LOCKED/GUARDED/CAREFUL/FREE)   │
│       │ Detect blockers (MUST NOT violations)                    │
│       │                                                          │
│       ▼                                                          │
│  ④ RISK ANALYSIS                                                 │
│       │ Match request against 10 system risks                   │
│       │ Score: 0-100 (CRITICAL risks = 40pts each)              │
│       │ Apply governance multiplier (LOCKED = ×1.5)             │
│       │ Flag: requiresEscalation if score ≥ 60                  │
│       │                                                          │
│       ▼                                                          │
│  ⑤ GOVERNANCE VALIDATION                                         │
│       │ Check LOCKED domain constraints                         │
│       │ Check GUARDED domain pre-requisites                      │
│       │ Check immutable architecture constraints (9 rules)       │
│       │ BLOCK if critical constraints violated                   │
│       │                                                          │
│       ▼                                                          │
│  ⑥ EXECUTION PLAN                                                │
│       │ Generate phased plan:                                    │
│       │   Phase 0: Pre-checks (LOCKED/GUARDED only)             │
│       │   Phase 1: Primary domain implementation                 │
│       │   Phase N: Secondary domain side effects                 │
│       │   Phase N+1: Memory sync                                 │
│       │ Estimate complexity: trivial/low/medium/high/critical    │
│       │ List: files to create, modify, memory to update         │
│       │                                                          │
│       ▼                                                          │
│  ⑦ PROMPT GENERATION                                             │
│       │ Load domain memory context (skill, workflow, states)    │
│       │ Inject governance rules (MUST DO / MUST NOT)            │
│       │ Build full Antigravity builder prompt                    │
│       │ Include: post-build checklist                            │
│       │                                                          │
│       ▼                                                          │
│  ⑧ CODE GENERATION                                               │
│       │ (Delegated to Antigravity AI builder)                   │
│       │ OpenClaw provides: prompt + plan + constraints           │
│       │ Antigravity provides: implementation                     │
│       │                                                          │
│       ▼                                                          │
│  ⑨ REVIEW OUTPUT                                                 │
│       │ Validate output against governance policies              │
│       │ Check 10 anti-patterns                                   │
│       │ Check transaction, audit, realtime requirements          │
│       │ Score: 0-100 (pass threshold: 80)                       │
│       │ Block if: CRITICAL violation OR score < 80              │
│       │                                                          │
│       ▼                                                          │
│  ⑩ MEMORY SYNC                                                   │
│       │ Detect drift between new code and ai/ files             │
│       │ Flag: immediate / soon / backlog                         │
│       │ Suggest specific md file updates                         │
│       │                                                          │
│       ▼                                                          │
│  ⑪ GOVERNANCE LOGGING                                            │
│       │ Write to: logs/governance/YYYY-MM-DD.json               │
│       │ Write to: logs/violation/ (if violations found)          │
│       │ Telegram notify: if CRITICAL violation or BLOCKED        │
│       │ Return: GovernanceReport object                          │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## Step-Level Detail

### ① READ MEMORY
```
Model: gemini-2.5-flash-lite (lightweight read)
Input: ai/ directory path
Output: MemoryFile[] (99+ files)
Duration: <100ms
Caches: No (always fresh)
```

### ② BUILD CONTEXT GRAPH
```
Model: None (local computation)
Input: MemoryFile[]
Output: ContextGraph { domains, crossLinks, risks, systemRules }
Duration: <50ms
```

### ③ IMPACT ANALYSIS
```
Model: None (keyword matching)
Input: userRequest + ContextGraph
Output: ImpactAnalysis { primaryDomain, secondary, governance, blockers }
Duration: <10ms
```

### ④ RISK ANALYSIS
```
Model: None (risk registry matching)
Input: ImpactAnalysis + requestText
Output: RiskAnalysis { risks, score, escalation, mitigations }
Duration: <10ms
```

### ⑤ GOVERNANCE VALIDATION
```
Model: gemini-2.5-pro-preview (when AI needed)
Input: ImpactAnalysis + request
Output: pass | block + reason
Trigger: Always. No bypass allowed.
```

### ⑥ EXECUTION PLAN
```
Model: gemini-2.5-flash-preview
Input: request + impact + risk
Output: ExecutionPlan { phases, complexity, files, checklists }
Duration: <2s (with AI) / <50ms (local)
```

### ⑦ PROMPT GENERATION
```
Model: gemini-2.5-flash-preview
Input: ExecutionPlan + DomainMemory + GovernanceRules
Output: BuilderPrompt { systemContext, memory, rules, fullPrompt }
Recipient: Antigravity builder AI
```

### ⑧ CODE GENERATION
```
Actor: Antigravity (not OpenClaw)
Input: BuilderPrompt from step ⑦
Output: Code implementation
OpenClaw role: Provide prompt, receive output for review
```

### ⑨ REVIEW OUTPUT
```
Model: gemini-2.5-pro-preview (highest reasoning)
Input: Antigravity output + ImpactAnalysis
Output: ReviewResult { score, violations, warnings, passed }
Block threshold: score < 80 OR any CRITICAL violation
```

### ⑩ MEMORY SYNC
```
Model: gemini-2.5-flash-lite
Input: New code + existing ai/ files
Output: MemorySyncReport { drifts, suggestions }
Urgency levels: immediate / soon / backlog
```

### ⑪ GOVERNANCE LOGGING
```
Model: None (local write)
Input: All step outputs
Output: GovernanceReport JSON + log files
Telegram: CRITICAL violations only (if enabled)
```

---

## Abort Conditions

The pipeline STOPS immediately if:

| Condition | Step | Action |
|-----------|------|--------|
| LOCKED domain + CRITICAL blocker | ③ | Block + explain + log |
| Risk score ≥ 90 + LOCKED domain | ④ | Block + escalate |
| Immutable constraint violated | ⑤ | Block + cite ADR |
| Review score < 50 | ⑨ | Block + corrections required |
| CRITICAL anti-pattern in output | ⑨ | Block + corrections required |

---

## Fast Path (P3 / FREE domains)

For dashboard or P3 requests:

```
① Read Memory → ③ Impact Analysis → ⑥ Quick Plan → ⑦ Prompt → ⑪ Log
   (Skip: detailed risk scoring, governance validation, full review)
```

Still logged. Never completely bypassed.
