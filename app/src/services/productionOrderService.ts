import api from './api';
import { ProductionOrder } from '../types/productionOrder.types';

export const createProductionOrder = async (data: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
  return api.post('/production-orders', data);
};

export const updateProductionOrderStatus = async (id: string, status: ProductionOrder['status']) => {
  return api.put(`/production-orders/${id}/status`, { status });
};

export const updateProductionOrder = async (id: string, updates: Partial<ProductionOrder>) => {
  return api.put(`/production-orders/${id}`, updates);
};
