import React from 'react';
import { Order, OrderItem } from '../../../types/order.types';
import { formatCurrency } from '../../../utils/format';

interface OrderItemsTableProps {
  order: Order;
  items: OrderItem[];
}

export default function OrderItemsTable({ order, items }: OrderItemsTableProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-2">Hàng hóa yêu cầu</h3>
      <div className="overflow-hidden border border-slate-100 rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="px-4 py-2 opacity-50">Sản phẩm</th>
              <th className="px-4 py-2 opacity-50 text-center">SL</th>
              <th className="px-4 py-2 opacity-50 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-bold">{item.productName}</p>
                  <p className="text-[10px] text-slate-400 italic">{item.specification}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <p className="font-bold">{item.quantity}</p>
                  <p className="text-[10px] text-slate-400">{item.unit}</p>
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))}
            <tr className="bg-indigo-50/30">
              <td colSpan={2} className="px-4 py-3 font-bold text-slate-900">TỔNG CỘNG</td>
              <td className="px-4 py-3 text-right font-black text-indigo-600 text-lg">
                {formatCurrency(items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {order.note && (
        <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs leading-relaxed italic">
          <strong>Ghi chú:</strong> {order.note}
        </div>
      )}
    </div>
  );
}
