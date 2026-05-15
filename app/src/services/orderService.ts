/**
 * Legacy Order Service — thin wrappers around the centralized API layer.
 * Prefer using orderFlowService.ts for new code.
 */
import api from './api';

export const addOrder = async (order: any) => {
  const totalRevenue = order.quantity * (order.pricePerRoll || 0);
  return api.post('/orders', { ...order, totalRevenue, status: 'cho_duyet' });
};

export const approveOrder = async (id: string) => {
  return api.put(`/orders/${id}/approve`, {});
};

export const updateOrderStatus = async (id: string, status: string) => {
  return api.put(`/orders/${id}/status`, { status });
};
