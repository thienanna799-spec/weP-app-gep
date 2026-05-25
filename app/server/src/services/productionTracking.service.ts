/**
 * Production Lifecycle Tracking Service
 * ──────────────────────────────────────
 * Immutable audit trail for ProductionOrder events.
 */

import { prisma } from '../lib/prisma.js';

export type ProductionActionType =
  | 'CREATE'
  | 'ASSIGN_MATERIAL'
  | 'START'
  | 'COMPLETE'
  | 'CANCEL'
  | 'UPDATE'
  | 'OTHER';

export interface ProductionEventPayload {
  actionType: ProductionActionType;
  action: string;
  operator: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  metadata?: Record<string, any>;
}

export async function recordProductionEvent(
  productionOrderId: string,
  payload: ProductionEventPayload,
) {
  return prisma.productionEvent.create({
    data: {
      productionOrderId,
      actionType: payload.actionType,
      action: payload.action,
      operator: payload.operator,
      fromStatus: payload.fromStatus || null,
      toStatus: payload.toStatus || null,
      note: payload.note || null,
      metadata: payload.metadata || undefined,
    },
  });
}

export async function getProductionTimeline(productionOrderId: string) {
  return prisma.productionEvent.findMany({
    where: { productionOrderId },
    orderBy: { timestamp: 'asc' },
  });
}
