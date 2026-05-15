import React from 'react';
import { User, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { Order } from '../../../types/order.types';
import { formatCurrency, formatDate } from '../../../utils/format';

interface OrderSummaryProps {
  order: Order;
}

export default function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
          <User className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Khách hàng</p>
            <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
          <Phone className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Liên hệ</p>
            <p className="text-sm font-bold text-slate-900">{order.customerPhone || 'N/A'}</p>
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 col-span-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ giao hàng</p>
            <p className="text-sm font-bold text-slate-900">{order.customerAddress}</p>
          </div>
        </div>
      </div>

      <div className={`p-3 rounded-xl border flex items-center justify-between ${
        order.paymentStatus === 'da_thanh_toan'
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`w-5 h-5 ${order.paymentStatus === 'da_thanh_toan' ? 'text-green-600' : 'text-red-400'}`} />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Thanh toán</p>
            <p className={`text-sm font-bold ${order.paymentStatus === 'da_thanh_toan' ? 'text-green-700' : 'text-red-600'}`}>
              {order.paymentStatus === 'da_thanh_toan' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
            </p>
          </div>
        </div>
        {order.totalRevenue && (
          <p className="text-lg font-black text-slate-800">{formatCurrency(order.totalRevenue)}</p>
        )}
      </div>

      <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-4 mt-6">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hạn chót giao hàng dự kiến</p>
          <p className="text-lg font-black">{order.deliveryDeadline ? formatDate(order.deliveryDeadline) : 'Chưa xác định'}</p>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Người tạo đơn</p>
            <p className="text-sm font-bold">{order.createdByName || 'N/A'}</p>
          </div>
          {order.approvedByName && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Đã duyệt bởi</p>
              <p className="text-sm font-bold text-green-400">{order.approvedByName}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
