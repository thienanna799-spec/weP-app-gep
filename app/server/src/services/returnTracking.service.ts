/**
 * Return Lifecycle Tracking Service
 * ─────────────────────────────────
 * Immutable audit trail for ReturnRequest events.
 */

import { prisma } from '../lib/prisma.js';

export type ReturnActionType =
  | 'CREATE'
  | 'APPROVE'
  | 'PROCESS'
  | 'REFUND'
  | 'RESOLVE'
  | 'REJECT'
  | 'OTHER';

export interface ReturnEventPayload {
  actionType: ReturnActionType;
  action: string;
  operator: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  metadata?: Record<string, any>;
}

export async function recordReturnEvent(
  returnRequestId: string,
  payload: ReturnEventPayload,
) {
  return prisma.returnEvent.create({
    data: {
      returnRequestId,
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

export async function getReturnTimeline(returnRequestId: string) {
  return prisma.returnEvent.findMany({
    where: { returnRequestId },
    orderBy: { timestamp: 'asc' },
  });
}
