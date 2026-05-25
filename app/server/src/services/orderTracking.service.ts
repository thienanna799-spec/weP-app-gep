/**
 * Order Lifecycle Tracking Service
 * ─────────────────────────────────
 * Central, immutable audit trail for ShippingOrder events.
 *
 * RULES:
 *   1. Every action on a ShippingOrder MUST call `recordOrderEvent()`.
 *   2. Events are NEVER deleted or modified — append-only.
 *   3. If a correction is needed, create a new event with actionType 'CORRECTION'.
 *   4. All snapshot fields (driverName, vehiclePlate, fromStatus, toStatus)
 *      capture the value AT THE TIME OF THE EVENT — not current DB values.
 *
 * Data is stored FOREVER — designed for long-term audit, compliance, and analytics.
 */

import { prisma } from '../lib/prisma.js';

// ── Action Types ─────────────────────────────────────────
export type OrderActionType =
  | 'CREATE'          // Tạo đơn hàng mới
  | 'APPROVE'         // Phê duyệt đơn hàng
  | 'ASSIGN_DRIVER'   // Gán tài xế
  | 'STATUS_CHANGE'   // Chuyển trạng thái (generic)
  | 'SCAN_ROLL'       // Scan cuộn vào phiếu
  | 'DELIVERY'        // Hành động giao hàng (bàn giao, xác nhận, GPS)
  | 'RETURN'          // Hoàn trả
  | 'CORRECTION'      // Sửa lỗi / điều chỉnh (ghi rõ trong note)
  | 'OTHER';          // Dự phòng mở rộng tương lai

export interface OrderEventPayload {
  actionType: OrderActionType;
  action: string;            // Human-readable: "Tạo đơn hàng SHIP-001234"
  operator: string;          // Tên người thực hiện
  driverId?: string;         // ID tài xế (khi gán / bàn giao)
  driverName?: string;       // Snapshot tên tài xế
  vehiclePlate?: string;     // Snapshot biển số xe
  fromStatus?: string;       // Trạng thái trước
  toStatus?: string;         // Trạng thái sau
  note?: string;             // Ghi chú bổ sung
  metadata?: Record<string, any>; // Dữ liệu mở rộng (GPS, ảnh, chữ ký, ...)
}

/**
 * Record an immutable event for a ShippingOrder.
 * This is the SINGLE entry point for all order audit logging.
 */
export async function recordOrderEvent(
  shippingOrderId: string,
  payload: OrderEventPayload,
) {
  return prisma.orderEvent.create({
    data: {
      shippingOrderId,
      actionType: payload.actionType,
      action: payload.action,
      operator: payload.operator,
      driverId: payload.driverId ?? null,
      driverName: payload.driverName ?? null,
      vehiclePlate: payload.vehiclePlate ?? null,
      fromStatus: payload.fromStatus ?? null,
      toStatus: payload.toStatus ?? null,
      note: payload.note ?? null,
      metadata: payload.metadata ?? undefined,
    },
  });
}

/**
 * Get the full audit timeline for a ShippingOrder.
 * Returns events in chronological order (oldest first).
 * Supports optional date-range filtering for reporting.
 */
export async function getOrderTimeline(
  shippingOrderId: string,
  options?: { startDate?: string; endDate?: string },
) {
  const where: any = { shippingOrderId };

  if (options?.startDate || options?.endDate) {
    where.timestamp = {};
    if (options.startDate) {
      where.timestamp.gte = new Date(options.startDate);
    }
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      where.timestamp.lte = end;
    }
  }

  return prisma.orderEvent.findMany({
    where,
    orderBy: { timestamp: 'asc' },
  });
}

/**
 * Helper: Map ShippingStatus enum value to Vietnamese label.
 */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    cho_xuat_kho: 'Chờ xuất kho',
    dang_chuan_bi: 'Đang chuẩn bị hàng',
    da_xuat_kho: 'Đã xuất kho',
    da_ban_giao_tai_xe: 'Đã bàn giao cho tài xế',
    dang_giao: 'Đang giao',
    giao_thanh_cong: 'Giao thành công',
    giao_that_bai: 'Giao thất bại',
    hoan_tra: 'Hoàn trả',
  };
  return map[status] || status;
}

// ══════════════════════════════════════════════════════════
// SALES ORDER TRACKING
// ══════════════════════════════════════════════════════════

export type SalesActionType =
  | 'CREATE' | 'APPROVE' | 'UPDATE' | 'CANCEL' | 'PAYMENT' | 'STATUS_CHANGE' | 'ASSIGN_DRIVER' | 'DELIVERY' | 'OTHER';

export interface SalesEventPayload {
  actionType: SalesActionType;
  action: string;
  operator: string;
  oldValue?: string;
  newValue?: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  metadata?: Record<string, any>;
}

export async function recordSalesOrderEvent(orderId: string, payload: SalesEventPayload) {
  return prisma.orderLog.create({
    data: {
      orderId,
      actionType: payload.actionType,
      action: payload.action,
      createdBy: payload.operator,
      oldValue: payload.oldValue || null,
      newValue: payload.newValue || null,
      fromStatus: payload.fromStatus || null,
      toStatus: payload.toStatus || null,
      note: payload.note || null,
      metadata: payload.metadata || undefined,
    },
  });
}

// ══════════════════════════════════════════════════════════
// PURCHASE ORDER TRACKING
// ══════════════════════════════════════════════════════════

export type PurchaseActionType =
  | 'CREATE' | 'APPROVE' | 'UPDATE' | 'RECEIVE' | 'PAYMENT' | 'STATUS_CHANGE' | 'CANCEL' | 'OTHER';

export interface PurchaseEventPayload {
  actionType: PurchaseActionType;
  action: string;
  operator: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  metadata?: Record<string, any>;
}

export async function recordPurchaseOrderEvent(purchaseOrderId: string, payload: PurchaseEventPayload) {
  return prisma.purchaseOrderLog.create({
    data: {
      purchaseOrderId,
      actionType: payload.actionType,
      action: payload.action,
      createdBy: payload.operator,
      fromStatus: payload.fromStatus || null,
      toStatus: payload.toStatus || null,
      note: payload.note || null,
      metadata: payload.metadata || undefined,
    },
  });
}
