/**
 * Roll Lifecycle Tracking Service
 * ────────────────────────────────
 * Central service for recording every action on a ProductRoll.
 * All controllers MUST call `recordEvent()` instead of directly creating
 * `RollScanHistory` entries, ensuring a consistent, enriched audit trail.
 *
 * Data is stored FOREVER — every field is designed for long-term queryability.
 */

import { prisma } from '../lib/prisma.js';

// ── Action Types (Lifecycle Events) ──────────────────────
export type ActionType =
  | 'CREATE'      // Tạo mã QR / cuộn mới
  | 'IMPORT'      // Nhập kho (sản xuất hoặc nhập ngoại)
  | 'EXPORT'      // Xuất kho (theo phiếu giao hàng)
  | 'TRANSFER'    // Chuyển vị trí nội bộ kho
  | 'DAMAGE'      // Báo lỗi / hỏng
  | 'RETURN'      // Hoàn trả vào kho
  | 'ADJUST'      // Điều chỉnh thông tin (trạng thái, thông số)
  | 'OTHER';      // Thao tác khác (dự phòng mở rộng tương lai)

export interface RecordEventPayload {
  actionType: ActionType;
  action: string;           // Human-readable description (e.g. "Nhập kho — Hàng mới (OK)")
  operator: string;         // Tên người thực hiện
  orderCode?: string;       // IMP-xxx, SHIP-xxx, SX-xxx, TRF-xxx
  customerName?: string;    // Snapshot tên khách hàng
  driverName?: string;      // Snapshot tên tài xế
  fromLocation?: string;    // Vị trí cũ (format: "Kho/Khu/Kệ/Tầng/Ô")
  toLocation?: string;      // Vị trí mới
  note?: string;            // Ghi chú bổ sung
  metadata?: Record<string, any>; // Dữ liệu mở rộng tùy ý
}

/**
 * Record a lifecycle event for a roll.
 * This is the ONLY function that should create RollScanHistory records.
 */
export async function recordEvent(rollId: string, payload: RecordEventPayload) {
  return prisma.rollScanHistory.create({
    data: {
      rollId,
      action: payload.action,
      operator: payload.operator,
      actionType: payload.actionType,
      orderCode: payload.orderCode || null,
      customerName: payload.customerName || null,
      driverName: payload.driverName || null,
      fromLocation: payload.fromLocation || null,
      toLocation: payload.toLocation || null,
      note: payload.note || null,
      metadata: payload.metadata || undefined,
    },
  });
}

/**
 * Get the full lifecycle timeline for a single roll by QR code.
 * Supports optional date-range filtering for reporting.
 */
export async function getRollTimeline(qrCode: string, options?: {
  startDate?: string;
  endDate?: string;
}) {
  const roll = await prisma.productRoll.findUnique({
    where: { qrCode },
    select: {
      id: true,
      code: true,
      qrCode: true,
      productName: true,
      subSku: true,
      specification: true,
      length: true,
      weight: true,
      status: true,
      positionWarehouse: true,
      positionArea: true,
      positionShelf: true,
      positionLayer: true,
      positionSlot: true,
      sourceType: true,
      supplier: true,
      productionDate: true,
      creator: true,
      createdAt: true,
    },
  });

  if (!roll) return null;

  // Build where clause for events
  const whereClause: any = { rollId: roll.id };
  if (options?.startDate) {
    whereClause.timestamp = { ...whereClause.timestamp, gte: new Date(options.startDate) };
  }
  if (options?.endDate) {
    const endDate = new Date(options.endDate);
    endDate.setHours(23, 59, 59, 999);
    whereClause.timestamp = { ...whereClause.timestamp, lte: endDate };
  }

  const events = await prisma.rollScanHistory.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
  });

  return { roll, events };
}

/**
 * Format a warehouse position into a readable string for storage.
 * Accepts both roll objects (positionWarehouse, positionArea, ...) and
 * plain position objects (warehouse, area, ...).
 * Example: "KhoA / KhuB / Kệ2 / T1 / Ô05"
 */
export function formatLocation(pos: Record<string, any>): string {
  const parts = [
    pos.positionWarehouse || pos.warehouse || '',
    pos.positionArea || pos.area || '',
    pos.positionShelf || pos.shelf || '',
    pos.positionLayer || pos.layer || '',
    pos.positionSlot || pos.slot || '',
  ].filter(Boolean);
  return parts.join(' / ') || '—';
}
