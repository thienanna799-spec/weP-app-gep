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
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr className="uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="px-4 py-2 opacity-50">SUB-SKU</th>
                <th className="px-4 py-2 opacity-50">SKU</th>
                <th className="px-4 py-2 opacity-50 text-center">SL</th>
                <th className="px-4 py-2 opacity-50 text-right">Đơn giá</th>
                <th className="px-4 py-2 opacity-50 text-right">Tổng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-mono font-bold text-slate-800 text-xs">{item.subSku || '—'}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-mono font-bold text-indigo-700 text-[11px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded inline-block whitespace-nowrap">{item.sku || '—'}</p>
                    <p className="text-[9px] text-slate-400 mt-1 max-w-[200px] truncate" title={item.productName}>{item.productName}</p>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <p className="font-bold">{item.quantity}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500 text-xs whitespace-nowrap">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600 whitespace-nowrap">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
              <tr className="bg-indigo-50/30">
                <td colSpan={4} className="px-4 py-3 font-bold text-slate-900 text-right whitespace-nowrap">TỔNG CỘNG</td>
                <td className="px-4 py-3 text-right font-black text-indigo-600 text-lg whitespace-nowrap">
                  {formatCurrency(items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {order.note && (
        <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs leading-relaxed italic">
          <strong>Ghi chú:</strong> {order.note}
        </div>
      )}
    </div>
  );
}
