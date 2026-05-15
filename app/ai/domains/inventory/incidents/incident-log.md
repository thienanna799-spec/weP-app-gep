# Inventory Domain — Known Incidents

**Purpose:** Track all incidents affecting this domain for AI historical reasoning.

---

## 2026-05-12 — Unicode NFD/NFC mismatch in Excel import
- **Event:** `events/2026/05/12/002-unicode-nfc-fix.json`
- **Severity:** HIGH
- **Impact:** All Google Sheets exports caused "column not found" error
- **Fix:** Added `key.normalize('NFC').trim()` at entry point
- **Prevention:** NFC normalization mandatory for all external data

## 2026-05-12 — Database Mojibake reset
- **Event:** `events/2026/05/12/003-db-reset-encoding.json`
- **Severity:** HIGH / DATA LOSS
- **Impact:** All inventory enum values (RollStatus) stored as garbage
- **Fix:** Full DB reset with `--force-reset`
- **Prevention:** Always import MySQL with `--default-character-set=utf8mb4`
