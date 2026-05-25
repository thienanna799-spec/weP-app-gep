/**
 * System Audit Service
 * ────────────────────
 * Generic audit trail tracking for entities that don't have a dedicated event log.
 * Stores 'before' and 'after' snapshots in `metadata` JSON field.
 */

import { prisma } from '../lib/prisma.js';

export interface AuditLogPayload {
  userId: string;
  email: string;
  action: string;      // e.g., 'CREATE', 'UPDATE', 'DELETE'
  module: string;      // e.g., 'CUSTOMER', 'MATERIAL', 'VEHICLE'
  referenceId?: string;
  description: string; // Human-readable description
  ipAddress?: string;
  userAgent?: string;
  oldValue?: any;      // JSON object of before state
  newValue?: any;      // JSON object of after state
}

/**
 * Record a generic system activity with detailed JSON snapshots.
 */
export async function recordSystemAudit(payload: AuditLogPayload) {
  // Construct metadata containing before/after states if provided
  const metadata: any = {};
  if (payload.oldValue !== undefined) metadata.before = payload.oldValue;
  if (payload.newValue !== undefined) metadata.after = payload.newValue;

  return prisma.userActivityLog.create({
    data: {
      userId: payload.userId,
      email: payload.email,
      action: payload.action,
      module: payload.module,
      referenceId: payload.referenceId || null,
      description: payload.description,
      ipAddress: payload.ipAddress || null,
      userAgent: payload.userAgent || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    },
  });
}

/**
 * Fetch audit logs for a specific entity reference.
 */
export async function getEntityAuditLogs(module: string, referenceId: string) {
  return prisma.userActivityLog.findMany({
    where: { module, referenceId },
    orderBy: { createdAt: 'asc' },
  });
}
