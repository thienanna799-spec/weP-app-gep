import { useState } from 'react';
import api from '../../../services/api';
import { UserProfile } from '../../../types/user.types';
import { Order } from '../../../types/order.types';

export const useOrderActions = (profile: UserProfile, refetch: () => void) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
  const [selectedOrderLogs, setSelectedOrderLogs] = useState<any[]>([]);
  
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  const isAdmin = profile.role === 'super_admin' || profile.role === 'admin';

  const handleCreateOrder = async (data: any, items: any[]) => {
    setFormSaving(true);
    try {
      await api.post('/orders', { ...data, items });
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      console.error(error);
      alert('Lỗi tạo đơn hàng');
    } finally {
      setFormSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/orders/${id}/approve`, {});
      setIsDetailOpen(false);
      refetch();
    } catch (e) {
      alert('Lỗi duyệt đơn');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await api.put(`/orders/${id}/reject`, { reason });
      setIsDetailOpen(false);
      refetch();
    } catch (e) {
      alert('Lỗi từ chối đơn');
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    try {
      await api.put(`/orders/${id}/cancel`, { reason });
      setIsDetailOpen(false);
      refetch();
    } catch (e) {
      alert('Lỗi hủy đơn');
    }
  };

  const fetchOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    try {
      const [itemsRes, logsRes] = await Promise.all([
        api.get<any[]>(`/orders/${order.id}/items`),
        api.get<any[]>(`/orders/${order.id}/logs`)
      ]);
      setSelectedOrderItems(itemsRes);
      setSelectedOrderLogs(logsRes);
      setIsDetailOpen(true);
    } catch (e) {
      alert('Lỗi tải chi tiết đơn hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTogglePayment = async (order: Order) => {
    if (!isAdmin) {
      alert('Bạn không có quyền thay đổi trạng thái thanh toán.');
      return;
    }
    const newStatus = order.paymentStatus === 'da_thanh_toan' ? 'chua_thanh_toan' : 'da_thanh_toan';
    try {
      await api.put(`/orders/${order.id}/payment-status`, { status: newStatus });
      refetch();
    } catch (e) {
      alert('Lỗi cập nhật thanh toán');
    }
  };

  const openInvoice = (order: Order) => {
    setInvoiceOrder(order);
    setIsInvoiceOpen(true);
  };

  return {
    isFormOpen, setIsFormOpen, formSaving, handleCreateOrder,
    isDetailOpen, setIsDetailOpen, detailLoading, selectedOrder, selectedOrderItems, selectedOrderLogs, fetchOrderDetails,
    isAdmin, handleApprove, handleReject, handleCancel,
    handleTogglePayment,
    isInvoiceOpen, setIsInvoiceOpen, invoiceOrder, openInvoice
  };
};
