/**
 * ProductionOrdersPage — Production order management
 * ──────────────────────────────────────────────────
 * Orchestrates: approved order queue, create form, and active/finished LSX cards.
 * Business logic in hooks, UI in sub-components.
 */

import React, { useState, useMemo } from 'react';
import { Plus, XCircle, Settings, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../../components/ui/Button';
import { useOrders } from '../../hooks/useOrders';
import { useProductionOrders } from '../../hooks/useProductionOrders';
import { createProductionOrder, updateProductionOrderStatus } from '../../services/productionOrderService';
import { UserProfile } from '../../types/user.types';
import { useProductionQueue } from './hooks/useProductionQueue';
import type { NewOrderFormData } from './types';

// Sub-components
import ProductionOrderCard from './components/ProductionOrderCard';
import ProductionOrderForm from './components/ProductionOrderForm';
import ApprovedOrderQueue from './components/ApprovedOrderQueue';

const INITIAL_FORM: NewOrderFormData = {
  code: '', productionDate: format(new Date(), 'yyyy-MM-dd'),
  personInChargeName: '', requiredQuantity: 0, specs: '',
  productName: '', targetRolls: 0, rollLength: 0, rollWeight: 0,
  machineArea: '', notes: '', deadline: format(new Date(), 'yyyy-MM-dd'),
  orderId: '',
};

const ProductionOrdersPage: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const { orders: approvedOrders } = useOrders('da_duyet');
  const { productionOrders, refetch } = useProductionOrders();

  const [view, setView] = useState<'list' | 'create'>('list');
  const [showCompleted, setShowCompleted] = useState(false);
  const [newOrder, setNewOrder] = useState<NewOrderFormData>(INITIAL_FORM);

  const queue = useProductionQueue({ approvedOrders });

  // Split production orders into active vs finished
  const { activeOrders, finishedOrders } = useMemo(() => {
    const active: typeof productionOrders = [];
    const finished: typeof productionOrders = [];
    for (const po of productionOrders) {
      if (po.status === 'completed' || po.status === 'cancelled') finished.push(po);
      else active.push(po);
    }
    return { activeOrders: active, finishedOrders: finished };
  }, [productionOrders]);

  // ── Handlers ──────────────────────────────────────────

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
      refetch();
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
            refetch();
          } catch { /* silent */ }
        }
      }
    } catch (err: any) {
      alert(`Lỗi cập nhật trạng thái: ${err.message || 'Không xác định'}`);
    }
  };

  // ── Render ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lệnh sản xuất</h2>
          <p className="text-gray-500 text-sm">Điều hành và giám sát tiến độ xưởng</p>
        </div>
        <Button variant={view === 'create' ? 'secondary' : 'primary'} onClick={() => setView(view === 'list' ? 'create' : 'list')} className="gap-2">
          {view === 'list' ? <Plus className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {view === 'list' ? ' Tạo lệnh mới' : ' Hủy bỏ'}
        </Button>
      </div>

      {view === 'create' ? (
        <ProductionOrderForm
          formData={newOrder}
          onChange={setNewOrder}
          onSubmit={handleCreateProductionOrder}
          onCancel={() => setView('list')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Approved queue */}
          <ApprovedOrderQueue
            sortedOrders={queue.sortedApprovedOrders}
            queueOrder={queue.queueOrder}
            onSelectOrder={handleSelectApprovedOrder}
            onMoveUp={queue.handleMoveUp}
            onMoveDown={queue.handleMoveDown}
            onSetPosition={queue.handleSetQueuePosition}
          />

          {/* Right: Active + Finished LSX */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Theo dõi Lệnh đang chạy</h4>

            {activeOrders.length === 0 && finishedOrders.length === 0 ? (
              <div className="p-20 text-center bg-white border border-gray-100 rounded-3xl space-y-4 shadow-sm border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <Settings className="w-8 h-8 animate-spin-slow" />
                </div>
                <p className="text-slate-400 font-medium">Hệ thống đang sẵn sàng cho lệnh mới</p>
              </div>
            ) : (
              <div className="space-y-5">
                {activeOrders.length === 0 && (
                  <div className="p-8 text-center bg-white border border-dashed border-gray-200 rounded-2xl">
                    <p className="text-sm text-gray-400">Không có lệnh đang chạy — sẵn sàng nhận lệnh mới</p>
                  </div>
                )}
                {activeOrders.map(lsx => (
                  <ProductionOrderCard key={lsx.id} lsx={lsx} onStatusUpdate={handleStatusUpdate} />
                ))}
              </div>
            )}

            {/* Finished: collapsible */}
            {finishedOrders.length > 0 && (
              <div className="mt-6">
                <button onClick={() => setShowCompleted(!showCompleted)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <Archive className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-500">Đã hoàn thành / Đã hủy</span>
                    <span className="text-xs font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{finishedOrders.length}</span>
                  </div>
                  {showCompleted ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showCompleted && (
                  <div className="space-y-4 mt-4">
                    {finishedOrders.map(lsx => (
                      <ProductionOrderCard key={lsx.id} lsx={lsx} onStatusUpdate={handleStatusUpdate} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionOrdersPage;
