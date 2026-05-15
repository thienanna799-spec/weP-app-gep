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
  for (const key of Object.keys(row)) normalized[normalizeKey(key)] = row[key];
  return normalized;
});
```

**Frontend hook** (`useStockSummary.ts`) — same normalization for preview rendering.

## Consequences

✅ Import Excel from Google Sheets works for all Vietnamese column headers  
✅ Same fix works for any future tool exporting NFD-encoded xlsx (LibreOffice also uses NFD)  
⚠️ If columns use non-Vietnamese characters, no impact (ASCII normalizes identically)  

## General Rule Derived

> **Any time data enters the system from an external source (Google Sheets, Excel, CSV), normalize Unicode to NFC before string comparison.**

This applies to: column headers, product names, enum values, customer names from import.

## Files Changed

- `app/server/src/controllers/stock-sync.controller.ts`
- `app/src/modules/inventory/hooks/useStockSummary.ts`
