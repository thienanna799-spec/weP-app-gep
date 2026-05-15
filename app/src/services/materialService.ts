import api from './api';

export const addMaterial = async (material: any) => {
  return api.post('/materials', material);
};

export const updateMaterial = async (id: string, updates: any) => {
  return api.put(`/materials/${id}`, updates);
};

export const deleteMaterial = async (id: string) => {
  return api.delete(`/materials/${id}`);
};
