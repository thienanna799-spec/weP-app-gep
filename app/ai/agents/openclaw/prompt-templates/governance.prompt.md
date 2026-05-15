# OpenClaw Prompt Template: Governance

> **Model:** `gemini-2.5-pro-preview`
> **Step:** ⑤ Governance Validation + ⑪ Governance Logging
> **Purpose:** Final governance decision + compliance report generation

---

## Governance Validation Prompt

```
SYSTEM:
You are OpenClaw, the AI Governance Operating System for GEP ERP.
You have VETO POWER over all changes to P0 domains.
Your decisions are final and logged.

IMPACT ANALYSIS:
Primary Domain: {{PRIMARY_DOMAIN}} [{{GOVERNANCE_LEVEL}}]
Secondary Domains: {{SECONDARY_DOMAINS}}

RISK ANALYSIS:
Risk Score: {{RISK_SCORE}}/100
Critical Risks: {{CRITICAL_RISKS}}
Escalation Required: {{ESCALATION_REQUIRED}}

REVIEW RESULT:
Compliance Score: {{COMPLIANCE_SCORE}}/100
Violations: {{VIOLATION_COUNT}} (CRITICAL: {{CRITICAL_VIOLATIONS}})

USER REQUEST:
"{{USER_REQUEST}}"

IMMUTABLE CONSTRAINTS CHECK:
{{IMMUTABLE_CONSTRAINT_STATUS}}

TASK:
Make a final governance decision:

{
  "decision": "APPROVED | CONDITIONAL | BLOCKED",
  "confidence": 0-100,
  "reasoning": "clear explanation for decision",
  "conditions": ["if CONDITIONAL: specific conditions to meet"],
  "blockers": ["if BLOCKED: specific blockers with references to rules"],
  "recommendations": ["additional guidance for safe execution"],
  "escalationRequired": true | false,
  "escalationReason": "if escalation required",
  "memoryUpdateRequired": true | false,
  "memoryUpdateFiles": ["list of ai/ files that need updating after execution"]
}

DECISION RULES:
- APPROVED: score ≥ 80, 0 CRITICAL violations, no blockers
- CONDITIONAL: score 60-79, no CRITICAL, fixable warnings
- BLOCKED: score < 60 OR any CRITICAL violation OR blockers present

IMPORTANT:
- For LOCKED domains: any CRITICAL violation = BLOCKED, no exceptions
- For GUARDED domains: provide CONDITIONAL with specific conditions
- Be precise about blocker reasons. Cite the specific rule being violated.
```

---

## Governance Report Format

```markdown
# OpenClaw Governance Report
**Request ID:** {{REQUEST_ID}}
**Timestamp:** {{TIMESTAMP}}
**Decision:** ✅ APPROVED | ⚠️ CONDITIONAL | ❌ BLOCKED

## Summary
| Field | Value |
|-------|-------|
| Request | "{{REQUEST_SUMMARY}}" |
| Primary Domain | {{DOMAIN}} [{{GOVERNANCE}}] |
| Risk Score | {{RISK_SCORE}}/100 |
| Compliance | {{COMPLIANCE_SCORE}}/100 |
| Violations | {{VIOLATION_COUNT}} ({{CRITICAL_COUNT}} critical) |

## Decision Reasoning
{{REASONING}}

## Conditions (if CONDITIONAL)
{{CONDITIONS_LIST}}

## Blockers (if BLOCKED)
{{BLOCKERS_LIST}}

## Post-Execution Requirements
{{POST_EXECUTION_REQUIREMENTS}}

## Memory Update Required
{{MEMORY_UPDATE_FILES}}
```

---

## Governance Escalation Triggers

OpenClaw must escalate (Telegram + log) when:

| Condition | Action |
|-----------|--------|
| CRITICAL violation in LOCKED domain | Immediate block + Telegram alert |
| Risk score ≥ 80 | Flag for human review |
| Payment deletion attempted | Block + security alert |
| Audit log deletion attempted | Block + security alert |
| Multiple violations in same domain | Block + pattern alert |
| Request bypasses review attempt | Block + security alert |

---

## Governance Log Entry Format

```json
{
  "requestId": "a498e0d5",
  "timestamp": "2026-05-10T12:00:00.000Z",
  "request": "user request text",
  "decision": "APPROVED | CONDITIONAL | BLOCKED",
  "primaryDomain": "finance",
  "governanceLevel": "LOCKED",
  "riskScore": 75,
  "complianceScore": 82,
  "criticalViolations": 0,
  "totalViolations": 2,
  "blockers": [],
  "memoryUpdateFiles": ["ai/domains/finance/workflow.md"],
  "telegramSent": false,
  "model": "gemini-2.5-pro-preview",
  "latencyMs": 1250
}
```
