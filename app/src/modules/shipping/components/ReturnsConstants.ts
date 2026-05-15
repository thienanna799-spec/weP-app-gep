/**
 * ReturnsConstants — Types, labels, and formatters for the Returns module
 * ─────────────────────────────────────────────────────────────────────────
 * Extracted from ReturnsTab for reuse across ReturnsTab & ReturnDetailModal.
 */

export interface ReturnRequest {
  id: string;
  code: string;
  orderId: string;
  type: string;
  reason: string;
  status: string;
  resolution: string | null;
  refundAmount: number;
  refundMethod: string | null;
  refundedAt: string | null;
  reshipOrderId: string | null;
  createdByName: string;
  processedByName: string | null;
  createdAt: string;
  resolvedAt: string | null;
  order: {
    code: string;
    customerName: string;
    customerPhone: string;
    totalRevenue: number | null;
    status: string;
    customer: { telegramChatId: string | null } | null;
  };
}

export interface ReturnStats {
  total: number; pending: number; approved: number;
  processing: number; resolved: number; rejected: number;
  totalRefundAmount: number;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  processing: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  rejected: 'Từ chối',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export const TYPE_LABELS: Record<string, string> = {
  failed_delivery: 'Giao thất bại',
  customer_return: 'KH trả hàng',
  damaged: 'Hàng hỏng',
};

export const RESOLUTION_LABELS: Record<string, string> = {
  refund: '💰 Hoàn tiền',
  reship: '🚚 Giao lại',
  exchange: '🔄 Đổi hàng',
  cancel: '❌ Hủy đơn',
};

export const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
