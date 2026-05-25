import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  ShoppingCart, Plus, Search, CheckCircle2,
  Clock, AlertCircle, TrendingUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useOrders } from './hooks/useOrders';
import { useOrderActions } from './hooks/useOrderActions';
import { UserProfile } from '../../types/user.types';
import InvoicePreview from './components/InvoicePreview';
import OrderDetailModal from './components/OrderDetailModal';
import OrderCreateModal from './components/OrderCreateModal';
import OrdersTable from './components/OrdersTable';

interface OrdersPageProps {
  profile: UserProfile;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ profile }) => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const { orders, loading, refetch } = useOrders(); // Fetch all orders to keep KPI counts globally correct
  const [searchTerm, setSearchTerm] = useState('');
  const a = useOrderActions(profile, refetch);

  const [headerPortal, setHeaderPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderPortal(document.getElementById('page-header-portal'));
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Search term filter
      const matchSearch = (o.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      let matchStatus = true;
      if (statusFilter !== 'All') {
        if (statusFilter === 'da_duyet,dang_chuan_bi,cho_xuat_kho') {
          matchStatus = ['da_duyet', 'dang_chuan_bi', 'cho_xuat_kho'].includes(o.status);
        } else {
          matchStatus = o.status === statusFilter;
        }
      }

      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const kpis = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'cho_duyet').length,
    picking: orders.filter(o => ['da_duyet', 'dang_chuan_bi', 'cho_xuat_kho'].includes(o.status)).length,
    shipping: orders.filter(o => o.status === 'dang_giao').length,
    completed: orders.filter(o => o.status === 'hoan_thanh').length,
  }), [orders]);

  if (loading) return <LoadingSpinner />;

  const topControlBar = (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
      <div className="flex-1 flex gap-2 sm:gap-4 max-w-3xl w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder={t('orders.search_placeholder') || 'Tìm theo mã đơn, tên khách hàng...'} className="pl-10 h-10 w-full shadow-sm" value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} />
        </div>
        <select className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none w-32 sm:w-48 shadow-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">{t('orders.all_orders') || 'Tất cả đơn'}</option>
          <option value="nhap">{t('orders.draft') || 'Nháp'}</option>
          <option value="cho_duyet">{t('orders.pending_approval') || 'Chờ duyệt'}</option>
          <option value="da_duyet">{t('orders.approved') || 'Đã duyệt'}</option>
          <option value="dang_chuan_bi">{t('orders.preparing') || 'Đang soạn/xuất'}</option>
          <option value="cho_xuat_kho">{t('orders.ready_to_ship') || 'Chờ xuất kho'}</option>
          <option value="dang_giao">{t('orders.in_delivery') || 'Đang giao'}</option>
          <option value="hoan_thanh">{t('orders.completed') || 'Hoàn thành'}</option>
          <option value="huy">{t('orders.cancelled') || 'Hủy'}</option>
        </select>
      </div>
      <Button onClick={() => a.setIsFormOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 shrink-0 h-10">
        <Plus className="w-4 h-4" /><span>{t('orders.new_order') || 'Tạo đơn hàng mới'}</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {headerPortal ? ReactDOM.createPortal(topControlBar, headerPortal) : topControlBar}

      {/* KPI Cards - click to filter */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: t('orders.total_orders'), value: kpis.total, icon: ShoppingCart, iconClass: 'bg-slate-50 text-slate-600', activeClass: 'ring-2 ring-slate-400 bg-slate-50/40', filter: 'All' },
          { label: t('orders.pending_approval'), value: kpis.pending, icon: Clock, iconClass: 'bg-amber-50 text-amber-600', activeClass: 'ring-2 ring-amber-400 bg-amber-50/40', filter: 'cho_duyet' },
          { label: t('orders.picking_shipping'), value: kpis.picking, icon: AlertCircle, iconClass: 'bg-indigo-50 text-indigo-600', activeClass: 'ring-2 ring-indigo-400 bg-indigo-50/40', filter: 'da_duyet,dang_chuan_bi,cho_xuat_kho' },
          { label: t('orders.in_delivery'), value: kpis.shipping, icon: TrendingUp, iconClass: 'bg-blue-50 text-blue-600', activeClass: 'ring-2 ring-blue-400 bg-blue-50/40', filter: 'dang_giao' },
          { label: t('orders.completed'), value: kpis.completed, icon: CheckCircle2, iconClass: 'bg-emerald-50 text-emerald-600', activeClass: 'ring-2 ring-emerald-400 bg-emerald-50/40', filter: 'hoan_thanh' },
        ].map((kpi, idx) => {
          const isActive = statusFilter === kpi.filter;
          return (
            <Card
              key={idx}
              className={`p-4 flex items-center gap-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${isActive ? kpi.activeClass : 'bg-white border-transparent'}`}
              onClick={() => setStatusFilter(kpi.filter)}
            >
              <div className={`p-2 rounded-xl ${kpi.iconClass}`}><kpi.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xl font-black text-slate-900 leading-none mb-1">{kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{kpi.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden border-none shadow-md">
        <OrdersTable 
          orders={filteredOrders} 
          onTogglePayment={a.handleTogglePayment} 
          onViewDetails={a.fetchOrderDetails} 
          detailLoading={a.detailLoading} 
          selectedOrderId={a.selectedOrder?.id} 
        />
      </Card>

      {/* Modals */}
      <OrderDetailModal 
        isOpen={a.isDetailOpen} 
        onClose={() => a.setIsDetailOpen(false)} 
        order={a.selectedOrder} 
        items={a.selectedOrderItems} 
        logs={a.selectedOrderLogs} 
        isAdmin={a.isAdmin} 
        onApprove={() => a.selectedOrder && a.handleApprove(a.selectedOrder.id)} 
        onReject={() => {
          if (a.selectedOrder) {
            const reason = window.prompt('Nhập lý do từ chối:');
            if (reason !== null) a.handleReject(a.selectedOrder.id, reason || 'Không có lý do');
          }
        }} 
        onCancel={() => {
          if (a.selectedOrder) {
            const reason = window.prompt('Nhập lý do hủy đơn:');
            if (reason !== null) a.handleCancel(a.selectedOrder.id, reason || 'Không có lý do');
          }
        }} 
        onInvoice={() => a.selectedOrder && a.openInvoice(a.selectedOrder)} 
      />
      <OrderCreateModal isOpen={a.isFormOpen} onClose={() => a.setIsFormOpen(false)} onSave={a.handleCreateOrder} saving={a.formSaving} />
      <InvoicePreview isOpen={a.isInvoiceOpen} onClose={() => a.setIsInvoiceOpen(false)} order={a.invoiceOrder} />
    </div>
  );
};

export default OrdersPage;