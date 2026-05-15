// ============================================================
// OpenClaw – Policies Config
// Anti-pattern rules, risk thresholds, review policies
// ============================================================

import type { Risk } from '../runtime/types.js';

// ── Anti-Pattern Definitions ─────────────────────────────────

export const ANTI_PATTERNS = [
  {
    id: 'WRITE_IN_GET',
    name: 'Write inside GET handler',
    description: 'DB mutation (create/update/delete) inside a GET route handler',
    severity: 'CRITICAL' as const,
    detection: ['prisma.*.update', 'prisma.*.create', 'prisma.*.delete'],
    context: 'GET handler',
    suggestion: 'Move mutation to background job or separate POST/PUT endpoint',
  },
  {
    id: 'N_PLUS_1_QUERY',
    name: 'N+1 Query Pattern',
    description: 'DB query inside a loop iterating over DB results',
    severity: 'HIGH' as const,
    detection: ['forEach', 'map', 'for (', 'for('],
    context: 'nested DB call',
    suggestion: 'Use Prisma include, groupBy, or batch query instead',
  },
  {
    id: 'FLOAT_MONEY',
    name: 'Float arithmetic for money',
    description: 'Using parseFloat, /100, or floating-point math for VND amounts',
    severity: 'CRITICAL' as const,
    detection: ['parseFloat', 'toFixed(', '/ 100', '* 0.', '.toFixed'],
    context: 'finance calculations',
    suggestion: 'Use integer VND amounts only. No decimals in Vietnamese currency.',
  },
  {
    id: 'MISSING_SOCKET_EMIT',
    name: 'Missing socket event after mutation',
    description: 'P0/P1 domain mutation without corresponding io.emit()',
    severity: 'HIGH' as const,
    detection: [],
    context: 'controller mutation methods',
    suggestion: 'Add io.emit() call after every P0/P1 domain mutation',
  },
  {
    id: 'MISSING_TRANSACTION',
    name: 'Missing $transaction for atomic operations',
    description: 'Multi-step mutation in P0/P1 domain without $transaction wrapper',
    severity: 'CRITICAL' as const,
    detection: [],
    context: 'P0/P1 controller mutations',
    suggestion: 'Wrap in prisma.$transaction([...]) for atomicity',
  },
  {
    id: 'DELETE_AUDIT_LOG',
    name: 'Deleting audit log records',
    description: 'DELETE operation on any audit log model',
    severity: 'CRITICAL' as const,
    detection: ['orderLog', 'deliveryLog', 'rollScanHistory', 'ocrAuditLog', 'notificationLog'],
    context: 'DELETE handlers',
    suggestion: 'Audit logs are append-only and immutable. Never delete.',
  },
  {
    id: 'HARDCODED_CONSTANT',
    name: 'Hardcoded business constant',
    description: 'Business-rule value hardcoded instead of loaded from config',
    severity: 'MEDIUM' as const,
    detection: ['= 500', '= 30', '= 1000', 'WAREHOUSE_CAPACITY', '= 5000'],
    context: 'controller or service',
    suggestion: 'Load from SystemConfig or environment variable',
  },
  {
    id: 'DIRECT_STOCK_UPDATE',
    name: 'Direct currentStock update',
    description: 'Directly updating Material.currentStock without MaterialTransaction',
    severity: 'HIGH' as const,
    detection: ['currentStock'],
    context: 'direct prisma update',
    suggestion: 'Always go through MaterialTransaction; currentStock updated as side effect',
  },
  {
    id: 'STATUS_JUMP',
    name: 'Invalid status machine transition',
    description: 'Setting status to a value that skips required intermediate states',
    severity: 'CRITICAL' as const,
    detection: [],
    context: 'status update handlers',
    suggestion: 'Validate transition against allowed transitions in states.md before updating',
  },
  {
    id: 'MISSING_AUDIT_LOG',
    name: 'Missing audit log for P0/P1 mutation',
    description: 'Status change or critical mutation in P0/P1 domain without creating log entry',
    severity: 'HIGH' as const,
    detection: [],
    context: 'P0/P1 status change handlers',
    suggestion: 'Create corresponding log entry (OrderLog, PurchaseOrderLog, etc.)',
  },
];

// ── Known Risk Registry ──────────────────────────────────────

export const SYSTEM_RISKS: Risk[] = [
  {
    id: 'RISK-001',
    type: 'data_loss',
    severity: 'CRITICAL',
    description: 'Permanent deletion without soft-delete mechanism',
    impactedDomains: ['orders', 'customers', 'materials', 'drivers', 'inventory'],
    detectionStrategy: 'Search for prisma.*.delete() without deletedAt field',
    mitigation: 'Add deletedAt DateTime? to P0/P1 models; convert DELETE to soft-delete',
  },
  {
    id: 'RISK-002',
    type: 'audit_break',
    severity: 'CRITICAL',
    description: 'Status changes without audit log entries',
    impactedDomains: ['orders', 'procurement', 'finance', 'inventory'],
    detectionStrategy: 'Verify log creation alongside every P0/P1 mutation',
    mitigation: 'Add audit log creation to every P0/P1 status change controller',
  },
  {
    id: 'RISK-003',
    type: 'financial_mismatch',
    severity: 'CRITICAL',
    description: 'Revenue/AR/AP calculations diverge from payment records',
    impactedDomains: ['finance', 'orders'],
    detectionStrategy: 'Check for float arithmetic in payment calculations',
    mitigation: 'Use integer arithmetic; recognize revenue only on hoan_thanh',
  },
  {
    id: 'RISK-004',
    type: 'stock_corruption',
    severity: 'CRITICAL',
    description: 'ProductRoll status diverges from physical location',
    impactedDomains: ['inventory', 'production', 'shipping'],
    detectionStrategy: 'Verify $transaction wrapping in pick-roll operations',
    mitigation: 'Add optimistic locking; validate status before every transition',
  },
  {
    id: 'RISK-005',
    type: 'hidden_mutation',
    severity: 'HIGH',
    description: 'GET handler performing DB writes',
    impactedDomains: ['drivers'],
    detectionStrategy: 'Search prisma.*.update/create/delete inside GET handlers',
    mitigation: 'Move to background job running every 15 minutes',
  },
  {
    id: 'RISK-006',
    type: 'queue_loss',
    severity: 'HIGH',
    description: 'In-memory OCR queue loses jobs on server restart',
    impactedDomains: ['drivers'],
    detectionStrategy: 'Check if OcrQueue uses in-memory array/Map',
    mitigation: 'Migrate to BullMQ + Redis',
  },
  {
    id: 'RISK-007',
    type: 'realtime_desync',
    severity: 'MEDIUM',
    description: 'Socket events not emitted for all mutations',
    impactedDomains: ['materials', 'production-orders', 'finance'],
    detectionStrategy: 'Verify io.emit() after every P0/P1/P2 mutation',
    mitigation: 'Add missing socket events: material_stock_changed, production_order_updated, payment_received',
  },
  {
    id: 'RISK-008',
    type: 'duplicate_processing',
    severity: 'MEDIUM',
    description: 'Same operation processed multiple times',
    impactedDomains: ['inventory', 'finance'],
    detectionStrategy: 'Check for idempotency keys on POST endpoints',
    mitigation: 'Add referenceId check before creating OCR audit; debounce mobile scans',
  },
  {
    id: 'RISK-009',
    type: 'fraud_bypass',
    severity: 'MEDIUM',
    description: 'Fraudulent submissions not detected by OCR',
    impactedDomains: ['drivers'],
    detectionStrategy: 'Verify imageHash is populated in FuelLog creation',
    mitigation: 'Compute MD5 of receiptUrl before FuelLog insert',
  },
  {
    id: 'RISK-010',
    type: 'stale_cache',
    severity: 'MEDIUM',
    description: 'Report cache serves outdated data after mutations',
    impactedDomains: ['reports', 'dashboard'],
    detectionStrategy: 'Check invalidateCacheForEvent() coverage',
    mitigation: 'Add missing socket events; ensure cache invalidation on all mutations',
  },
];

// ── Governance Thresholds ─────────────────────────────────────

export const GOVERNANCE_THRESHOLDS = {
  compliancePassScore: 80, // % below which review fails
  criticalViolationBlock: true, // block execution on CRITICAL violation
  highViolationWarning: true, // warn on HIGH violation
  autoApproveForFreeLevel: true, // auto-approve FREE domain changes
  requireHumanReviewForLocked: true, // always require human sign-off for LOCKED
};

// ── Immutable Architecture Constraints ─────────────────────────

export const IMMUTABLE_CONSTRAINTS = [
  "Socket.IO transports MUST include 'polling' before 'websocket' (Cloudflare compatibility)",
  'Firebase Admin SDK MUST be used for auth token verification',
  'Prisma MUST be the only ORM; no raw SQL for business logic',
  'Vietnamese enum values in DB via @map MUST NOT be changed (production data)',
  'Express body limit 25MB is tied to base64 image upload; do not reduce',
  'CUID is the primary key format for all models; do not switch to UUID or int',
  'asyncHandler wrapper MUST be used for all async route handlers',
  'sendSuccess/sendError MUST be used for all API responses',
  'OCR pipeline MUST be fire-and-forget; NEVER block main request for OCR result',
];
