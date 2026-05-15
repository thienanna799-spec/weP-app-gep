import api from './api';

export const createRoll = async (id: string, data: any) => {
  return api.post('/rolls', { ...data, id });
};

export const scanRollToStock = async (id: string, quality: string = 'new') => {
  return api.put(`/rolls/${id}/scan-to-stock`, { quality });
};

export const shipRollToOrder = async (rollId: string, orderId: string, newScannedQty: number, isComplete: boolean) => {
  return api.put(`/rolls/${rollId}/ship`, { orderId, newScannedQty, isComplete });
};
