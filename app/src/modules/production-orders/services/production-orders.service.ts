import api from '../../../services/api';
import { ProductionOrder } from '../../../types/productionOrder.types';

const API_URL = '/production-orders';

export const productionOrdersService = {
  getList: async (): Promise<ProductionOrder[]> => api.get<ProductionOrder[]>(API_URL),
  getById: async (id: string): Promise<ProductionOrder> => api.get<ProductionOrder>(`${API_URL}/${id}`),
  create: async (data: Partial<ProductionOrder>): Promise<ProductionOrder> => api.post<ProductionOrder>(API_URL, data),
  update: async (id: string, data: Partial<ProductionOrder>): Promise<ProductionOrder> => api.put<ProductionOrder>(`${API_URL}/${id}`, data),
  delete: async (id: string): Promise<void> => api.delete(`${API_URL}/${id}`),
};
