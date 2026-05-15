/**
 * Unified Order Flow Service
 * 
 * All tabs use these functions to interact with orders.
 * This ensures single source of truth and consistent API calls.
 */
import api from './api';

// ── Status constants (Vietnamese, matching database enums) ──
export const ORDER_STATUSES = {
  DRAFT: 'nhap',
  PENDING: 'cho_duyet',
  APPROVED: 'da_duyet',
  PICKING: 'dang_chuan_bi',     // Picking in progress
  READY_TO_SHIP: 'cho_xuat_kho', // All rolls picked, ready for dispatch
  DELIVERING: 'dang_giao',
  COMPLETED: 'hoan_thanh',
  REJECTED: 'tu_choi',
  CANCELLED: 'huy',
} as const;

export const ROLL_STATUSES = {
  PRODUCING: 'dang_san_xuat',
  IN_STOCK: 'trong_kho',
  RESERVED: 'da_giu_cho_don',   // Reserved for an order
  EXPORTED: 'da_xuat_kho',       // Picked & exported
  DEFECTIVE: 'loi_hong',
  RETURNED: 'hoan_tra',
} as const;

// ── Orders ──
export const fetchOrders = (status?: string) =>
  api.get<any[]>(status && status !== 'All' ? `/orders?status=${status}` : '/orders');

export const fetchOrder = (id: string) =>
  api.get<any>(`/orders/${id}`);

export const createOrder = (data: any) =>
  api.post<any>('/orders', data);

export const updateOrder = (id: string, data: any) =>
  api.put<any>(`/orders/${id}`, data);

export const approveOrder = (id: string) =>
  api.put<any>(`/orders/${id}/approve`, {});

export const rejectOrder = (id: string, reason?: string) =>
  api.put<any>(`/orders/${id}/reject`, { reason });

export const cancelOrder = (id: string, reason?: string) =>
  api.put<any>(`/orders/${id}/cancel`, { reason });

// ── Picking (used by Orders tab - Picking subtab) ──
export const pickRoll = (orderId: string, qrCode: string) =>
  api.post<any>(`/orders/${orderId}/pick-roll`, { qrCode });

// ── Dispatch (used by Shipping/Dispatch tab) ──
export const assignDriver = (orderId: string, data: {
  driverId: string; driverName: string; vehicle: string; deadline?: string; notes?: string;
}) => api.post<any>(`/orders/${orderId}/assign-driver`, data);

export const completeDelivery = (orderId: string) =>
  api.post<any>(`/orders/${orderId}/complete-delivery`, {});

export const failDelivery = (orderId: string, reason: string) =>
  api.post<any>(`/orders/${orderId}/fail-delivery`, { reason });

// ── Inventory / Rolls ──
export const fetchRolls = (status?: string) =>
  api.get<any[]>(status ? `/rolls?status=${status}` : '/rolls');

export const fetchRollByQR = (qrCode: string) =>
  api.get<any>(`/rolls/qr/${qrCode}`);

// ── Shipping ──
export const fetchShippingOrders = (status?: string) =>
  api.get<any[]>(status && status !== 'All' ? `/shipping?status=${status}` : '/shipping');

export const fetchShippingOrder = (id: string) =>
  api.get<any>(`/shipping/${id}`);

// ── Status labels (Vietnamese for UI) ──
export const ORDER_STATUS_LABELS: Record<string, string> = {
  nhap: 'Nháp',
  cho_duyet: 'Chờ duyệt',
  da_duyet: 'Đã duyệt',
  dang_chuan_bi: 'Đang soạn hàng',
  cho_xuat_kho: 'Sẵn sàng xuất',
  dang_giao: 'Đang giao',
  hoan_thanh: 'Hoàn thành',
  tu_choi: 'Từ chối',
  huy: 'Đã hủy',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  nhap: 'gray',
  cho_duyet: 'yellow',
  da_duyet: 'blue',
  dang_chuan_bi: 'indigo',
  cho_xuat_kho: 'purple',
  dang_giao: 'orange',
  hoan_thanh: 'green',
  tu_choi: 'red',
  huy: 'red',
};
