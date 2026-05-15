import api from '../../../services/api';
import { Material, MaterialTransaction, MaterialBOM } from '../types';

export const materialsService = {
  getAll: async (): Promise<Material[]> => api.get<Material[]>('/materials'),

  create: async (data: Omit<Material, 'id' | 'updatedAt'>): Promise<Material> =>
    api.post<Material>('/materials', data),

  update: async (id: string, data: Partial<Material>): Promise<Material> =>
    api.put<Material>(`/materials/${id}`, data),

  delete: async (id: string): Promise<void> => api.delete(`/materials/${id}`),

  createTransaction: async (data: Omit<MaterialTransaction, 'id' | 'date'>): Promise<void> => {
    await api.post('/materials/transactions', data);
  },

  saveBOM: async (bom: Omit<MaterialBOM, 'id'>): Promise<MaterialBOM> =>
    api.post<MaterialBOM>('/materials/bom', bom),

  getBOMByProduct: async (productId: string): Promise<MaterialBOM | null> =>
    api.get<MaterialBOM | null>(`/materials/bom/${productId}`),
};
