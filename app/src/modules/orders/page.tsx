import React, { useState, useMemo } from 'react';
import {
  ShoppingCart, Plus, Search, Eye, CheckCircle2,
  Clock, AlertCircle, TrendingUp, FileText, DollarSign
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useOrders } from './hooks/useOrders';
import { useOrderActions } from './hooks/useOrderActions';
import { UserProfile } from '../../types/user.types';
import { formatDate } from '../../utils/format';
import InvoicePreview from './components/InvoicePreview';
import OrderDetailModal, { getStatusBadge, getPriorityBadge } from './components/OrderDetailModal';
import OrderCreateModal from './components/OrderCreateModal';

interface OrdersPageProps {
  profile: UserProfile;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ profile }) => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const { orders, loading, refetch } = useOrders(statusFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const a = useOrderActions(profile, refetch);

  const filteredOrders = orders.filter(o =>
    (o.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const kpis = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'cho_duyet').length,
    picking: orders.filter(o => ['da_duyet', 'dang_chuan_bi', 'cho_xuat_kho'].includes(o.status)).length,
    shipping: orders.filter(o => o.status === 'dang_giao').length,
    completed: orders.filter(o => o.status === 'hoan_thanh').length,
  }), [orders]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('orders.title')}</h2>
          <p className="text-slate-500 text-sm font-medium">{t('orders.subtitle')}</p>
        </div>
        <Button onClick={() => a.setIsFormOpen(true)} className="gap-2 bg-indigo-600 shadow-lg shadow-indigo-100">
          <Plus className="w-4 h-4" /><span>{t('orders.new_order')}</span>
        </Button>
      </div>

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

      {/* Filter Bar */}
      <Card className="p-4 bg-white shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder={t('orders.search_placeholder')} className="pl-10 h-10" value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('common.status')}</label>
          <select className="h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">{t('orders.all_orders')}</option>
            <option value="nhap">{t('orders.draft')}</option>
            <option value="cho_duyet">{t('orders.pending_approval')}</option>
            <option value="da_duyet">{t('orders.approved')}</option>
            <option value="dang_chuan_bi">{t('orders.preparing')}</option>
            <option value="cho_xuat_kho">{t('orders.ready_to_ship')}</option>
            <option value="dang_giao">{t('orders.in_delivery')}</option>
            <option value="hoan_thanh">{t('orders.completed')}</option>
            <option value="huy">{t('orders.cancelled')}</option>
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden border-none shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4">{t('orders.order_code_customer')}</th>
                <th className="px-6 py-4">{t('orders.product_qty')}</th>
                <th className="px-6 py-4">{t('orders.priority')}</th>
                <th className="px-6 py-4 text-center">{t('common.status')}</th>
                <th className="px-6 py-4 text-center">Thanh toán</th>
                <th className="px-6 py-4">{t('common.created_at')}</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">{t('orders.no_orders')}</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">#{order.code}</p>
                          <p className="text-xs text-slate-500">{order.customerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-indigo-600 font-bold">{order.quantity} {t('common.rolls')}</p>
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(order.priority)}</td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); a.handleTogglePayment(order); }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer hover:scale-105 ${
                          order.paymentStatus === 'da_thanh_toan'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-50 text-red-500 hover:bg-red-100'
                        }`}
                      >
                        <DollarSign className="w-3 h-3" />
                        {order.paymentStatus === 'da_thanh_toan' ? 'Đã TT' : 'Chưa TT'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono italic">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="secondary" className="px-2" onClick={() => a.fetchOrderDetails(order)} disabled={a.detailLoading && a.selectedOrder?.id === order.id}>
                        {a.detailLoading && a.selectedOrder?.id === order.id ? <LoadingSpinner size="sm" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <OrderDetailModal isOpen={a.isDetailOpen} onClose={() => a.setIsDetailOpen(false)} order={a.selectedOrder} items={a.selectedOrderItems} logs={a.selectedOrderLogs} isAdmin={a.isAdmin} onApprove={a.handleApprove} onReject={a.handleReject} onCancel={a.handleCancel} onInvoice={a.openInvoice} />
      <OrderCreateModal isOpen={a.isFormOpen} onClose={() => a.setIsFormOpen(false)} onSave={a.handleCreateOrder} saving={a.formSaving} />
      <InvoicePreview isOpen={a.isInvoiceOpen} onClose={() => a.setIsInvoiceOpen(false)} order={a.invoiceOrder} />
    </div>
  );
};

export default OrdersPage;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             /**
 * WarehouseExportPanel — QR scanning + progress for warehouse export
 * ──────────────────────────────────────────────────────────────────
 * Extracted from ShippingDetailPanel for maintainability.
 */

import React from 'react';
import { QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface WarehouseExportPanelProps {
  totalQuantity: number;
  totalRolls: number;
  items: any[];
  scanCode: string;
  setScanCode: (v: string) => void;
  scanLoading: boolean;
  scanError: string | null;
  onScanRoll: () => void;
}

const WarehouseExportPanel: React.FC<WarehouseExportPanelProps> = ({
  totalQuantity, totalRolls, items,
  scanCode, setScanCode, scanLoading, scanError, onScanRoll
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
        <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-4">
          <QrC