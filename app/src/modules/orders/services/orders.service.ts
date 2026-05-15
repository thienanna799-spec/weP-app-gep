import api from '../../../services/api';

export interface Order {
  id: string;
  customerName: string;
  customerId?: string;
  status: string;
  quantity: number;
  pricePerRoll: number;
  totalRevenue?: number;
  address?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

const API_URL = '/orders';

export const ordersService = {
  getList: async (status?: string): Promise<Order[]> => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return api.get<Order[]>(`${API_URL}${qs}`);
  },
  getById: async (id: string): Promise<Order> => api.get<Order>(`${API_URL}/${id}`),
  create: async (data: Partial<Order>): Promise<Order> => api.post<Order>(API_URL, data),
  update: async (id: string, data: Partial<Order>): Promise<Order> => api.put<Order>(`${API_URL}/${id}`, data),
  delete: async (id: string): Promise<void> => api.delete(`${API_URL}/${id}`),
};
