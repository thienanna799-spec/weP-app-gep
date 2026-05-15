// ============================================================
// OpenClaw – Domain Config
// P0/P1/P2/P3 classification + LOCKED/GUARDED/CAREFUL/FREE
// Source of truth: ai/system/domain-criticality.md
//                  ai/system/ai-execution-governance.md
// ============================================================

import type { DomainConfig } from '../runtime/types.js';

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {

  // ── P0: Financial / Data Integrity Critical ─────────────────

  finance: {
    name: 'finance',
    priority: 'P0',
    governance: 'LOCKED',
    requiresTransaction: true,
    requiresAuditLog: true,
    requiresRealtimeEvent: false,
    canRollback: false, // payments are immutable
    constraints: [
      'ALWAYS use integer arithmetic for VND amounts',
      'ALWAYS create Payment atomically with paymentStatus update',
      'ALWAYS validate: amount <= (totalRevenue - totalPaid) + 1',
      'ALWAYS preserve Payment immutability',
      'ALWAYS recalculate paymentStatus after every payment',
    ],
    mustNot: [
      'Use JavaScript floating-point for money calculations',
      'Delete Payment records',
      'Modify payment.amount after creation',
      'Bypass overpayment validation',
      'Change revenue recognition criteria without updating finance.rules.md',
    ],
    relatedDomains: ['orders', 'customers', 'shipping'],
    memoryPaths: {
      skill: 'domains/finance/skill.md',
      workflow: 'domains/finance/workflow.md',
      creditRules: 'domains/finance/credit.rules.md',
      receivables: 'domains/finance/receivables.md',
      financeRules: 'shared/finance.rules.md',
    },
  },

  inventory: {
    name: 'inventory',
    priority: 'P0',
    governance: 'LOCKED',
    requiresTransaction: true,
    requiresAuditLog: true,
    requiresRealtimeEvent: true,
    canRollback: true, // except loi_hong
    constraints: [
      'ALWAYS validate roll.status before any status change',
      'ALWAYS use Prisma $transaction for pick-roll + status update',
      'ALWAYS emit inventory_updated event after every status change',
      'ALWAYS create RollScanHistory entry on every QR scan',
      'ALWAYS check qrCode uniqueness before creating new roll',
    ],
    mustNot: [
      'Delete ProductRoll records',
      'Allow arbitrary status jumps (e.g., dang_san_xuat → da_xuat_kho)',
      'Update stock count directly without going through status machine',
      'Suppress inventory_updated events',
      'Add DB writes to GET handlers',
    ],
    relatedDomains: ['orders', 'production', 'production-orders', 'shipping', 'reports'],
    memoryPaths: {
      skill: 'domains/inventory/skill.md',
      workflow: 'domains/inventory/workflow.md',
      states: 'domains/inventory/states.md',
      stocktake: 'domains/inventory/stocktake.md',
    },
  },

  orders: {
    name: 'orders',
    priority: 'P0',
    governance: 'LOCKED',
    requiresTransaction: true,
    requiresAuditLog: true,
    requiresRealtimeEvent: true,
    canRollback: true, // approval rejection reverts
    constraints: [
      'ALWAYS create OrderLog on every status change',
      'ALWAYS emit order_updated event after every mutation',
      'ALWAYS validate status transitions follow states.md',
      'ALWAYS use $transaction for delivery completion',
      'ALWAYS validate role before approve/reject',
    ],
    mustNot: [
      'Delete OrderLog records',
      'Allow status to jump steps',
      'Approve/reject without checking req.user role',
      'Suppress order_updated events',
      'Mark hoan_thanh without linked giao_thanh_cong ShippingOrder',
    ],
    relatedDomains: ['inventory', 'shipping', 'finance', 'customers'],
    memoryPaths: {
      skill: 'domains/orders/skill.md',
      workflow: 'domains/orders/workflow.md',
      states: 'domains/orders/states.md',
      permissions: 'domains/orders/permissions.md',
    },
  },

  // ── P1: Operational Critical ────────────────────────────────

  shipping: {
    name: 'shipping',
    priority: 'P1',
    governance: 'GUARDED',
    requiresTransaction: true,
    requiresAuditLog: true,
    requiresRealtimeEvent: true,
    canRollback: true,
    constraints: [
      'ALWAYS use $transaction for delivery completion (Order + ShippingOrder)',
      'ALWAYS create DeliveryLog for every delivery action (append-only)',
      'ALWAYS emit shipping_updated on every status change',
      'ALWAYS emit order_updated when order completes due to delivery',
      'ALWAYS validate driver is assigned before advancing to dang_giao',
    ],
    mustNot: [
      'Update or delete existing DeliveryLog entries',
      'Mark Order as hoan_thanh without linked giao_thanh_cong',
      'Suppress shipping_updated events',
    ],
    relatedDomains: ['orders', 'drivers', 'inventory', 'reports'],
    memoryPaths: {
      skill: 'domains/shipping/skill.md',
      workflow: 'domains/shipping/workflow.md',
      states: 'domains/shipping/states.md',
      permissions: 'domains/shipping/permissions.md',
    },
  },

  drivers: {
    name: 'drivers',
    priority: 'P1',
    governance: 'GUARDED',
    requiresTransaction: false,
    requiresAuditLog: true,
    requiresRealtimeEvent: true,
    canRollback: false, // OcrAuditLog append-only
    constraints: [
      'NEVER write to DB inside GET /drivers or GET /vehicles',
      'ALWAYS compute imageHash before creating FuelLog',
      'ALWAYS check referenceId before creating OcrAuditLog',
      'ALWAYS handle OcrQueue.addJob() failure gracefully',
      'ALWAYS emit driver_vehicle_updated after mutations',
    ],
    mustNot: [
      'Write driver.status or vehicle.status inside GET handlers',
      'Delete OcrAuditLog records',
      'Modify extractedValue, declaredValue, rawOcrText after creation',
      'Block main request waiting for OCR response',
      'Compute trust score with N+1 queries',
    ],
    relatedDomains: ['shipping', 'finance'],
    memoryPaths: {
      skill: 'domains/drivers/skill.md',
      workflow: 'domains/drivers/workflow.md',
      states: 'domains/drivers/states.md',
      fraudRules: 'domains/drivers/fraud.rules.md',
      ocrRules: 'shared/ocr.rules.md',
    },
  },

  'production-orders': {
    name: 'production-orders',
    priority: 'P1',
    governance: 'GUARDED',
    requiresTransaction: false,
    requiresAuditLog: true,
    requiresRealtimeEvent: false, // event missing - gap
    canRollback: true,
    constraints: [
      'ALWAYS check material availability before status=producing',
      'NEVER skip PurchaseOrderLog creation on status changes',
    ],
    mustNot: [
      'Auto-complete ProductionOrder without validating roll count',
      'Delete ProductionOrders with existing rolls',
    ],
    relatedDomains: ['inventory', 'materials', 'production'],
    memoryPaths: {
      skill: 'domains/production-orders/skill.md',
      workflow: 'domains/production-orders/workflow.md',
      states: 'domains/production-orders/states.md',
    },
  },

  procurement: {
    name: 'procurement',
    priority: 'P1',
    governance: 'GUARDED',
    requiresTransaction: true,
    requiresAuditLog: true,
    requiresRealtimeEvent: false,
    canRollback: true,
    constraints: [
      'ALWAYS create PurchaseOrderLog on every status transition',
      'ALWAYS create MaterialTransaction atomically when goods received',
    ],
    mustNot: [
      'Delete PurchaseOrderLog',
      'Receive goods without creating MaterialTransaction',
    ],
    relatedDomains: ['materials', 'finance'],
    memoryPaths: {
      skill: 'domains/procurement/skill.md',
      workflow: 'domains/procurement/workflow.md',
      states: 'domains/procurement/states.md',
      approvalRules: 'domains/procurement/approval.rules.md',
    },
  },

  // ── P2: Important Business Operations ──────────────────────

  customers: {
    name: 'customers',
    priority: 'P2',
    governance: 'CAREFUL',
    requiresTransaction: false,
    requiresAuditLog: true,
    requiresRealtimeEvent: false,
    canRollback: true,
    constraints: [
      'Create CustomerActivity entry for CRM events',
      'Test after any pricing changes (affects Order calculation)',
    ],
    mustNot: [],
    relatedDomains: ['orders', 'finance'],
    memoryPaths: {
      skill: 'domains/customers/skill.md',
      workflow: 'domains/customers/workflow.md',
      crm: 'domains/customers/crm.md',
      pricingRules: 'domains/customers/pricing.rules.md',
    },
  },

  materials: {
    name: 'materials',
    priority: 'P2',
    governance: 'CAREFUL',
    requiresTransaction: true,
    requiresAuditLog: true,
    requiresRealtimeEvent: false, // event missing - gap
    canRollback: false, // transactions are append-only
    constraints: [
      'ALWAYS update Material.status after every currentStock change',
      'ALWAYS create MaterialTransaction for every stock change',
      'NEVER update currentStock directly (go through MaterialTransaction)',
    ],
    mustNot: [],
    relatedDomains: ['production-orders', 'procurement'],
    memoryPaths: {
      skill: 'domains/materials/skill.md',
      workflow: 'domains/materials/workflow.md',
      states: 'domains/materials/states.md',
      bom: 'domains/materials/bom.md',
    },
  },

  production: {
    name: 'production',
    priority: 'P2',
    governance: 'CAREFUL',
    requiresTransaction: false,
    requiresAuditLog: true,
    requiresRealtimeEvent: true,
    canRollback: false, // loi_hong is terminal
    constraints: [
      'QR codes must be globally unique; validate before insert',
      'ALWAYS emit inventory_updated when roll scanned to stock',
    ],
    mustNot: [],
    relatedDomains: ['inventory', 'production-orders'],
    memoryPaths: {
      skill: 'domains/production/skill.md',
      workflow: 'domains/production/workflow.md',
      qrFlow: 'domains/production/qr-flow.md',
    },
  },

  reports: {
    name: 'reports',
    priority: 'P2',
    governance: 'CAREFUL',
    requiresTransaction: false,
    requiresAuditLog: false,
    requiresRealtimeEvent: true,
    canRollback: false,
    constraints: [
      'NEVER change response schema of report endpoints',
      'ALWAYS update invalidateCacheForEvent() when adding new socket events',
      'Maintain HOT (5min) vs COLD (1hr) TTL distinction',
    ],
    mustNot: ['Remove cache invalidation logic'],
    relatedDomains: ['orders', 'inventory', 'shipping', 'finance'],
    memoryPaths: {
      skill: 'domains/reports/skill.md',
      cache: 'domains/reports/cache.md',
    },
  },

  // ── P3: UI / Analytics / Optimization ──────────────────────

  dashboard: {
    name: 'dashboard',
    priority: 'P3',
    governance: 'FREE',
    requiresTransaction: false,
    requiresAuditLog: false,
    requiresRealtimeEvent: true,
    canRollback: false,
    constraints: [
      'Do not break summary report API contract (response shape)',
    ],
    mustNot: [],
    relatedDomains: ['reports'],
    memoryPaths: {
      skill: 'domains/dashboard/skill.md',
      realtime: 'domains/dashboard/realtime.md',
    },
  },

  admin: {
    name: 'admin',
    priority: 'P3',
    governance: 'CAREFUL',
    requiresTransaction: false,
    requiresAuditLog: true,
    requiresRealtimeEvent: true,
    canRollback: false,
    constraints: [
      'ALWAYS emit user_updated after role or permission changes',
      'ALWAYS validate super_admin role before role-change operations',
    ],
    mustNot: [],
    relatedDomains: ['orders', 'inventory', 'finance'],
    memoryPaths: {
      skill: 'domains/admin/skill.md',
      permissions: 'domains/admin/permissions.md',
      workflow: 'domains/admin/workflow.md',
      auditPolicy: 'domains/admin/audit-policy.md',
    },
  },
};

// Quick lookup helpers
export const getDomainConfig = (domain: string): DomainConfig | undefined =>
  DOMAIN_CONFIGS[domain];

export const getLockedDomains = (): string[] =>
  Object.entries(DOMAIN_CONFIGS)
    .filter(([, c]) => c.governance === 'LOCKED')
    .map(([d]) => d);

export const getGuardedDomains = (): string[] =>
  Object.entries(DOMAIN_CONFIGS)
    .filter(([, c]) => c.governance === 'GUARDED')
    .map(([d]) => d);

export const getP0Domains = (): string[] =>
  Object.entries(DOMAIN_CONFIGS)
    .filter(([, c]) => c.priority === 'P0')
    .map(([d]) => d);
