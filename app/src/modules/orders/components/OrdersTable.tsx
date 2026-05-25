import React from 'react';
import { FileText, DollarSign, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { formatDate } from '../../../utils/format';
import { getPriorityBadge, getStatusBadge } from './OrderDetailModal';

interface OrdersTableProps {
  orders: any[];
  onTogglePayment: (order: any) => void;
  onViewDetails: (order: any) => void;
  detailLoading: boolean;
  selectedOrderId?: string;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onTogglePayment,
  onViewDetails,
  detailLoading,
  selectedOrderId
}) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-auto max-h-[calc(100vh-230px)] custom-scrollbar relative">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 sticky top-0 z-20 shadow-[0_1px_0_0_#e2e8f0]">
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
          {orders.length === 0 ? (
            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">{t('orders.no_orders') || 'Không có đơn hàng nào'}</td></tr>
          ) : (
            orders.map(order => (
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
                    onClick={(e) => { e.stopPropagation(); onTogglePayment(order); }}
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
                  <Button size="sm" variant="secondary" className="px-2" onClick={() => onViewDetails(order)} disabled={detailLoading && selectedOrderId === order.id}>
                    {detailLoading && selectedOrderId === order.id ? <LoadingSpinner size="sm" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
