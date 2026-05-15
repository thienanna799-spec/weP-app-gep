import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { purchaseOrdersService } from '../services/procurement.service';
import type { PurchaseOrder, Supplier } from '../services/procurement.service';
import { PO_STATUS_LABELS } from '../page';
import PurchaseOrderTable from '../components/PurchaseOrderTable';
import PurchaseOrderForm from '../components/PurchaseOrderForm';
import PurchaseOrderDetail from '../components/PurchaseOrderDetail';

interface PurchaseOrdersTabProps {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
}

export default function PurchaseOrdersTab({ toast }: PurchaseOrdersTabProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  // We need to fetch suppliers for the form
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    // Only load suppliers when the form is opened to save requests, 
    // but for simplicity, we load it here or we can just fetch all once.
    if (showForm && suppliers.length === 0) {
      import('../services/procurement.service').then(m => {
        m.suppliersService.getAll().then(setSuppliers).catch(() => {});
      });
    }
  }, [showForm, suppliers.length]);

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await purchaseOrdersService.getAll(filter);
      setPurchaseOrders(data);
    } catch { toast.error('Lỗi tải đơn mua hàng'); }
    setLoading(false);
  }, [filter, toast]);

  useEffect(() => {
    fetchPOs();
  }, [fetchPOs]);

  const handleSave = async (data: any) => {
    try {
      if (editingPo) {
        await purchaseOrdersService.update(editingPo.id, data);
        toast.success('Cập nhật PO thành công');
      } else {
        await purchaseOrdersService.create(data);
        toast.success('Tạo PO thành công');
      }
      setShowForm(false);
      setEditingPo(null);
      fetchPOs();
    } catch (e: any) { toast.error(e?.message || 'Lỗi'); }
  };

  const handleAction = async (action: string, poId: string, extra?: any) => {
    try {
      switch (action) {
        case 'submit': await purchaseOrdersService.submit(poId); toast.success('Đã gửi duyệt'); break;
        case 'approve': await purchaseOrdersService.approve(poId); toast.success('Đã duyệt PO'); break;
        case 'order': await purchaseOrdersService.markOrdered(poId); toast.success('Đã đặt hàng NCC'); break;
        case 'receive': await purchaseOrdersService.receive(poId, extra); toast.success('Nhận hàng thành công'); break;
        case 'cancel': await purchaseOrdersService.cancel(poId, extra); toast.success('Đã hủy PO'); break;
        case 'delete': await purchaseOrdersService.delete(poId); toast.success('Đã xóa PO'); break;
      }
      fetchPOs();
      if (selectedPo?.id === poId) {
        const updated = await purchaseOrdersService.getById(poId).catch(() => null);
        setSelectedPo(updated);
      }
    } catch (e: any) { toast.error(e?.message || 'Lỗi thao tác'); }
  };

  if (selectedPo) {
    return (
      <PurchaseOrderDetail
        order={selectedPo}
        onBack={() => setSelectedPo(null)}
        onAction={handleAction}
        onRefresh={async () => {
          const updated = await purchaseOrdersService.getById(selectedPo.id);
          setSelectedPo(updated);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          {['All', 'draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                filter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'All' ? 'Tất cả' : PO_STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditingPo(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Tạo đơn mua
        </button>
      </div>

      <PurchaseOrderTable
        orders={purchaseOrders}
        loading={loading}
        onSelect={setSelectedPo}
        onAction={handleAction}
        onRefresh={fetchPOs}
      />

      {showForm && (
        <PurchaseOrderForm
          order={editingPo}
          suppliers={suppliers}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingPo(null); }}
        />
      )}
    </div>
  );
}
