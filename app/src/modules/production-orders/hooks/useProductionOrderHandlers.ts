import { useState } from 'react';
import { format } from 'date-fns';
import { createProductionOrder, updateProductionOrderStatus } from '../../../services/productionOrderService';
import type { NewOrderFormData } from '../types';

const INITIAL_FORM: NewOrderFormData = {
  code: '', productionDate: format(new Date(), 'yyyy-MM-dd'),
  personInChargeName: '', requiredQuantity: 0, specs: '',
  productName: '', targetRolls: 0, rollLength: 0, rollWeight: 0,
  machineArea: '', notes: '', deadline: format(new Date(), 'yyyy-MM-dd'),
  orderId: '',
};

interface UseProductionOrderHandlersProps {
  productionOrders: any[];
  refetch: () => Promise<void> | void;
  queue: {
    sortedApprovedOrders: any[];
  };
}

export const useProductionOrderHandlers = ({ productionOrders, refetch, queue }: UseProductionOrderHandlersProps) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [showCompleted, setShowCompleted] = useState(false);
  const [newOrder, setNewOrder] = useState<NewOrderFormData>(INITIAL_FORM);

  const handleCreateProductionOrder = async () => {
    if (!newOrder.requiredQuantity || !newOrder.specs) {
      alert("Vui lòng điền số lượng và quy cách"); return;
    }
    const code = `LSX-${format(new Date(), 'yyyyMMdd-HHmmss')}`;
    const orderData: any = {
      code,
      productionDate: new Date(newOrder.productionDate).toISOString(),
      requiredQuantity: newOrder.requiredQuantity,
      specs: newOrder.specs,
      productName: newOrder.productName || newOrder.specs,
      status: 'waiting_material',
      materials: [],
      targetRolls: newOrder.targetRolls || newOrder.requiredQuantity,
      rollLength: newOrder.rollLength || 0,
      rollWeight: newOrder.rollWeight || 0,
      machineArea: newOrder.machineArea || "",
      notes: newOrder.notes || "",
      deadline: new Date(newOrder.deadline).toISOString(),
    };
    if (newOrder.orderId) orderData.orderId = newOrder.orderId;

    try {
      await createProductionOrder(orderData);
      await refetch();
      setView('list');
      setNewOrder(INITIAL_FORM);
    } catch (err: any) {
      console.error('Lỗi tạo lệnh sản xuất:', err);
      alert(`Lỗi tạo lệnh: ${err.message || 'Không xác định'}`);
    }
  };

  const handleSelectApprovedOrder = (order: any) => {
    setNewOrder({
      ...newOrder,
      orderId: order.id,
      requiredQuantity: order.quantity,
      specs: `Đơn hàng: ${order.customerName}`,
      targetRolls: order.quantity,
    });
    setView('create');
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateProductionOrderStatus(id, status as any);
      await refetch();

      // Auto-create next LSX only when completing
      if (status === 'completed' && queue.sortedApprovedOrders.length > 0) {
        const completedPO = productionOrders.find(po => po.id === id);
        const nextOrder = queue.sortedApprovedOrders.find(o => o.id !== completedPO?.orderId);
        if (nextOrder) {
          const code = `LSX-${format(new Date(), 'yyyyMMdd-HHmmss')}`;
          try {
            await createProductionOrder({
              code, productionDate: new Date().toISOString(),
              requiredQuantity: nextOrder.quantity,
              specs: `Đơn hàng: ${nextOrder.customerName}`,
              productName: `Đơn hàng: ${nextOrder.customerName}`,
              status: 'waiting_material', targetRolls: nextOrder.quantity,
              rollLength: 0, rollWeight: 0,
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              orderId: nextOrder.id,
            } as any);
            await refetch();
          } catch { /* silent */ }
        }
      }
    } catch (err: any) {
      alert(`Lỗi cập nhật trạng thái: ${err.message || 'Không xác định'}`);
    }
  };

  return {
    view,
    setView,
    showCompleted,
    setShowCompleted,
    newOrder,
    setNewOrder,
    handleCreateProductionOrder,
    handleSelectApprovedOrder,
    handleStatusUpdate
  };
};
