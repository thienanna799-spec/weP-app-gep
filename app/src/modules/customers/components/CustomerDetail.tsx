/**
 * CustomerDetail – Full detail modal with info + history
 */

import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Building2, FileText, TrendingUp, Clock, Loader2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import { Customer, CustomerHistory, CUSTOMER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../constants';
import { customerService } from '../services/customer.service';
import { formatCurrency, formatDate } from '../../../utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit: (c: Customer) => void;
}

const CustomerDetail: React.FC<Props> = ({ isOpen, onClose, customer, onEdit }) => {
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      setLoading(true);
      customerService.getHistory(customer.id)
        .then(setHistory)
        .catch(() => setHistory(null))
        .finally(() => setLoading(false));
    }
  }, [isOpen, customer]);

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết: ${customer.name}`} size="lg">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Thông tin liên hệ</p>
            <p className="text-sm font-bold text-slate-900">{customer.name}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</p>
            {customer.email && <p className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</p>}
            <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {customer.address}</p>
            {customer.province && <p className="text-[10px] text-slate-400 ml-4">{customer.district ? `${customer.district}, ` : ''}{customer.province}</p>}
          </div>

          {/* Business */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Kinh doanh</p>
            <p className="text-sm"><span className="text-slate-500">Loại:</span> <span className="font-bold">{CUSTOMER_TYPE_LABELS[customer.customerType]}</span></p>
            {customer.company && <p className="text-sm flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-400" /> <span className="font-bold">{customer.company}</span></p>}
            {customer.taxCode && <p className="text-xs text-slate-500">MST: {customer.taxCode}</p>}
            <p className="text-sm"><span className="text-slate-500">Thanh toán:</span> <span className="font-bold">{PAYMENT_METHOD_LABELS[customer.preferredPayment]}</span></p>
            {customer.notes && <p className="text-xs text-slate-400 italic mt-2">"{customer.notes}"</p>}
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
        ) : history && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Tổng đơn hàng', value: history.stats.totalOrders, icon: FileText, color: 'text-blue-500' },
                { label: 'Hoàn thành', value: history.stats.completedOrders, icon: TrendingUp, color: 'text-green-500' },
                { label: 'Tổng SL', value: history.stats.totalQuantity.toLocaleString(), icon: FileText, color: 'text-purple-500' },
                { label: 'Doanh thu', value: formatCurrency(history.stats.totalRevenue), icon: TrendingUp, color: 'text-emerald-500' },
              ].map((s, i) => (
                <div key={i} className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</span>
                  </div>
                  <p className="text-lg font-black text-slate-900">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Order history */}
            {history.orders.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Lịch sử đơn hàng ({history.orders.length})
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {history.orders.map(o => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-blue-600">{o.code}</span>
                        <Badge variant={(ORDER_STATUS_COLORS[o.status] as any) || 'gray'}>
                          {ORDER_STATUS_LABELS[o.status] || o.status}
                        </Badge>
                        {o.quantity && <span className="text-[10px] text-slate-400">SL: {o.quantity}</span>}
                      </div>
                      <div className="text-right">
                        {o.totalRevenue && <p className="text-xs font-bold text-slate-700">{formatCurrency(o.totalRevenue)}</p>}
                        <p className="text-[10px] text-slate-400">{formatDate(o.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {history.stats.lastOrderDate && (
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                <strong>Đơn gần nhất:</strong> {formatDate(history.stats.lastOrderDate)}
                {history.stats.lastOrderStatus && (
                  <span className="ml-2">
                    — {ORDER_STATUS_LABELS[history.stats.lastOrderStatus] || history.stats.lastOrderStatus}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default CustomerDetail;
