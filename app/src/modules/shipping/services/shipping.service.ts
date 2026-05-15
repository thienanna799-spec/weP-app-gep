import api from '../../../services/api';
import { ShippingOrder, DeliveryLog } from '../types';

export const shippingService = {
  createShippingFromOrder: async (orderData: any, creator: string): Promise<ShippingOrder> => {
    return api.post<ShippingOrder>('/shipping', {
      code: `SHIP-${Date.now().toString().slice(-6)}`,
      orderId: orderData.id,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone || orderData.phone || '',
      customerAddress: orderData.customerAddress || orderData.address || '',
      totalRolls: orderData.quantity,
      totalQuantity: 0,
      status: 'chờ_xuất_kho',
      createdBy: creator,
    });
  },

  scanRollToShipping: async (shippingId: string, qrCode: string, _operator: string): Promise<void> => {
    await api.post(`/shipping/${shippingId}/scan`, { qrCode });
  },

  assignDriver: async (id: string, driverId: string, driverName: string, vehicle: string, deadline: string): Promise<void> => {
    await api.put(`/shipping/${id}/assign-driver`, { driverId, driverName, vehicle, deadline });
  },

  logDeliveryAction: async (shippingId: string, actionData: Omit<DeliveryLog, 'id' | 'createdAt'>): Promise<void> => {
    await api.post(`/shipping/${shippingId}/delivery-log`, actionData);
  },

  returnRollToStock: async (shippingId: string, qrCode: string, operator: string, reason: string): Promise<void> => {
    // Find roll and revert status via the rolls endpoint
    const roll = await api.get<any>(`/rolls/qr/${encodeURIComponent(qrCode)}`);
    if (roll) {
      await api.put(`/rolls/${roll.id}/status`, { status: 'trong_kho', actionNote: `Nhập lại kho từ đơn hoàn trả: ${reason}` });
    }
  },
};
