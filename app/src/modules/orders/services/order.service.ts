import api from '../../../services/api';
import { Order, OrderItem, OrderLog } from '../../../types/order.types';

export const orderService = {
  create: async (orderData: Omit<Order, 'id'>, items: Omit<OrderItem, 'id' | 'orderId'>[]) => {
    return api.post<string>('/orders', { ...orderData, items });
  },

  update: async (id: string, updateData: Partial<Order>, _modifierId: string) => {
    return api.put(`/orders/${id}`, updateData);
  },

  approve: async (id: string, approverId: string, approverName: string) => {
    return api.put(`/orders/${id}/approve`, { approverId, approverName });
  },

  reject: async (id: string, reason: string, _approverId: string) => {
    return api.put(`/orders/${id}/reject`, { reason });
  },

  cancel: async (id: string, reason: string, _cancelerId: string) => {
    return api.put(`/orders/${id}/cancel`, { reason });
  },

  getOrderItems: async (orderId: string): Promise<OrderItem[]> => {
    return api.get<OrderItem[]>(`/orders/${orderId}/items`);
  },

  getOrderLogs: async (orderId: string): Promise<OrderLog[]> => {
    return api.get<OrderLog[]>(`/orders/${orderId}/logs`);
  },

  pickRoll: async (orderId: string, qrCode: string) => {
    return api.post(`/orders/${orderId}/pick-roll`, { qrCode });
  },

  dispatchRoll: async (orderId: string, qrCode: string) => {
    return api.post(`/orders/${orderId}/dispatch-roll`, { qrCode });
  },

  assignDriver: async (orderId: string, driverId: string, driverName: string, vehicle: string, deadline: string, notes?: string) => {
    return api.post(`/orders/${orderId}/assign-driver`, { driverId, driverName, vehicle, deadline, notes });
  }
};
