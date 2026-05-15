import React, { useState } from 'react';
import { ShoppingCart, Clock, Eye } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import { CrmProfile, ACTIVITY_TYPE_COLORS } from '../types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../constants';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format';
import { useTranslation } from 'react-i18next';
import OrderDetailModal from '../../orders/components/OrderDetailModal';
import api from '../../../services/api';

interface CrmOrdersTabProps {
  crm: CrmProfile;
}

export const CrmOrdersTab: React.FC<CrmOrdersTabProps> = ({ crm }) => {
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderLogs, setOrderLogs] = useState<any[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleViewOrder = async (orderId: string) => {
    try {
      const order = await api.get<any>(`/orders/${orderId}`);
      const [items, logs] = await Promise.all([
        api.get<any[]>(`/orders/${orderId}/items`),
        api.get<any[]>(`/orders/${orderId}/logs`),
      ]);
      setSelectedOrder(order);
      setOrderItems(items);
      setOrderLogs(logs);
      setDetailOpen(true);
    } catch (err: any) {
      alert(err.message || 'Không thể tải thông tin đơn hàng');
    }
  };

  if (crm.orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-400">{t('orders.no_orders')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('common.code')}</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('common.status')}</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('common.quantity')}</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('finance.revenue')}</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('finance.paid')}</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('common.created_at')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {crm.orders.map(o => (
              <tr key={o.id} className="hover:bg-blue-50/50 transition-colors cursor-pointer group" onClick={() => handleViewOrder(o.id)}>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                    {o.code}
                    <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={(ORDER_STATUS_COLORS[o.status] as any) || 'gray'}>{ORDER_STATUS_LABELS[o.status] || o.status}</Badge>
                </td>
                <td className="px-4 py-3 text-sm">{o.quantity || '-'}</td>
                <td className="px-4 py-3 text-sm font-bold text-slate-700">{o.totalRevenue ? formatCurrency(o.totalRevenue) : '-'}</td>
                <td className="px-4 py-3">
                  {o.paymentStatus && (
                    <Badge variant={o.paymentStatus === 'da_thanh_toan' ? 'green' : 'yellow'}>{o.paymentStatus === 'da_thanh_toan' ? t('finance.paid') : t('finance.unpaid')}</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        order={selectedOrder}
        items={orderItems}
        logs={orderLogs}
        isAdmin={false}
        onApprove={() => {}}
        onReject={() => {}}
        onCancel={() => {}}
        onInvoice={() => {}}
      />
    </>
  );
};

interface CrmTimelineTabProps {
  crm: CrmProfile;
}

export const CrmTimelineTab: React.FC<CrmTimelineTabProps> = ({ crm }) => {
  const { t } = useTranslation();
  if (crm.activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-400">{t('dashboard.no_activities')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-200">
      {crm.activities.map((a) => (
        <div key={a.id} className="relative pl-10 pb-6">
          <div className={`absolute left-0 top-0.5 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${ACTIVITY_TYPE_COLORS[a.type] || 'bg-slate-400'}`}>
            {a.type === 'note_added' ? '📝' : a.type === 'followup_created' ? '⏰' : a.type === 'followup_completed' ? '✅' : a.type === 'order_created' ? '🛒' : '📌'}
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{a.title}</p>
                {a.description && <p className="text-xs text-slate-500 mt-1">{a.description}</p>}
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{formatDateTime(a.createdAt)}</span>
            </div>
            {a.createdByName && (
              <p className="text-[10px] text-slate-400 mt-2">bởi <span className="font-bold">{a.createdByName}</span></p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
