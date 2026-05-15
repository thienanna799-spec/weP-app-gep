# 🧠 GEP ERP — Context Package
**Generated:** 2026-05-12T11:35:39.876Z
**Domains:** general
**Events loaded:** 5 | **ADRs loaded:** 1

> Inject this entire file into Antigravity before asking your question.

---

## 🎯 QUERY
who is the boss and what is the schema

## ⚖️ GOVERNANCE RULES (MUST FOLLOW)
🟢 FREE — No critical constraints detected

## 🚨 INCIDENT HISTORY (5 relevant events)
**[0.2] 2026-05-12-003 — Fix TypeScript Compilation Errors**
Root cause: Residual TypeScript errors were causing build warnings and masking potential future issues
Fix: undefined
Nodes: 
Causal chain: caused_by=[] related=[]

**[0.5] 2026-05-12-003 — Frontend Component Decomposition (Phase 3 Batch 3)**
Root cause: Customers module components were exceeding 250 LOC, violating architectural constraints and degrading maintainability
Fix: undefined
Nodes: 
Causal chain: caused_by=[] related=[]

**[0.6] 2026-05-12-004 — Fixed Recharts Blank Canvas on Zoom**
Root cause: When maximizing charts, Recharts ResponsiveContainer rendered an empty canvas due to duplicate DOM ID collisions and ResizeObserver animation desyncs.
Fix: undefined
Nodes: 
Causal chain: caused_by=[] related=[]

**[0.5] 2026-05-12-004 — Frontend Component Decomposition (Phase 3 Inventory Batch)**
Root cause: Inventory page.tsx was exceeding 300 LOC, violating architectural constraints and degrading maintainability
Fix: undefined
Nodes: 
Causal chain: caused_by=[] related=[]

**[HIGH] 2026-05-12-002 — Excel import crash — Vietnamese column headers not recognized**
Root cause: Google Sheets .xlsx export uses Unicode NFD; source code string literals use NFC; byte comparison fails silently.
Fix: undefined
Nodes: StockSyncController.syncStock, ImportBatchTable, useStockSummary.handleFileSelect
Causal chain: caused_by=[] related=[2026-05-12-003]

## 📊 GRAPH NODES (relevant code structure)
(no matches)

## 📜 RELEVANT ADRs (1 found)
### ADR-015-unicode-nfc-normalization.md
# ADR-015: Vietnamese Unicode NFD vs NFC in Excel Import Pipeline

**Date:** 2026-05-12  
**Status:** ACCEPTED  
**Domain:** Data Integration / Encoding

---

## Context

The inventory system allows users to export data from Google Sheets as `.xlsx` and import it into GEP ERP via an "Import Excel" button. The import validates required column headers: `XƯỞNG` and `SUB-SKU`.

## Problem

Google Sheets encodes Vietnamese characters in `.xlsx` exports using **Unicode NFD** (Normalization Form Decomposed). In NFD, a character like `Ư` is stored as two separate code points: base character `U` + combining mark.

TypeScript source code string literals (`'XƯỞNG'`) use **Unicode NFC** (Normalization Form Composed), where `Ư` is a single code point.

When the system checked `'XƯỞNG' in firstRow`:
- `firstRow` key came from Google Sheets: NFD encoding → `X` + `U` + `+031B` + `+0300` + `NG`  
- Source literal: NFC → `X` + `Ư` + `Ở` + `NG`
- **Visually identical. Byte-different. Comparison failed silently.**

Result: `"Lỗi đồng bộ: File thiếu cột bắt buộc: XƯỞNG và SUB-SKU"` — even when the columns clearly existed in the file.

## Decision

Normalize all Excel row keys to NFC before any column validation or value extraction.

Applied at TWO layers:

**Backend** (`stock-sync.controller.ts`):
```typescript
const normalizeKey = (k: string) => k.normalize('NFC').trim();
const rows = rawRows.map(row => {
  const normalized: Record<string, any> = {};
  for (const key of Object.keys(row)) normali
