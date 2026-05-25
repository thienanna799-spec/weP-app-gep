import React from 'react';
import { User, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { Order } from '../../../types/order.types';
import { formatCurrency, formatDate } from '../../../utils/format';

interface OrderSummaryProps {
  order: Order;
}

export default function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Cột 1: Thông tin khách hàng */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">Thông tin khách hàng</h3>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Khách hàng</p>
            <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
            <Phone className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Liên hệ</p>
            <p className="text-sm font-bold text-slate-900">{order.customerPhone || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm shrink-0">
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ giao hàng</p>
            <p className="text-sm font-bold text-slate-900 leading-snug">{order.customerAddress}</p>
          </div>
        </div>
      </div>

      {/* Cột 2: Thông tin giao dịch & Giao hàng */}
      <div className="flex flex-col gap-4">
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
          order.paymentStatus === 'da_thanh_toan'
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${order.paymentStatus === 'da_thanh_toan' ? 'bg-green-100' : 'bg-red-100'}`}>
              <CheckCircle2 className={`w-5 h-5 ${order.paymentStatus === 'da_thanh_toan' ? 'text-green-600' : 'text-red-500'}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Thanh toán</p>
              <p className={`text-sm font-bold ${order.paymentStatus === 'da_thanh_toan' ? 'text-green-700' : 'text-red-600'}`}>
                {order.paymentStatus === 'da_thanh_toan' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
              </p>
            </div>
          </div>
          {order.totalRevenue && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Tổng tiền</p>
              <p className="text-xl font-black text-slate-800">{formatCurrency(order.totalRevenue)}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl text-white flex-1 flex flex-col justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hạn chót giao hàng dự kiến</p>
            <p className="text-lg font-black mt-1 text-blue-100">{order.deliveryDeadline ? formatDate(order.deliveryDeadline) : 'Chưa xác định'}</p>
          </div>
          <div className="flex justify-between items-end pt-4 mt-4 border-t border-slate-800/50">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Người tạo đơn</p>
              <p className="text-sm font-bold text-slate-200">{order.createdByName || 'N/A'}</p>
            </div>
            {order.approvedByName && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Đã duyệt bởi</p>
                <p className="text-sm font-bold text-green-400">{order.approvedByName}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
