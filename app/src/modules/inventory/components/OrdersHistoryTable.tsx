import React from 'react';
import { Download } from 'lucide-react';

interface OrdersHistoryTableProps {
  loadingHistory: boolean;
  orderGroups: any[];
  exportOrderExcel: (orderCode: string, logs: any[], subSkuSafe: string) => void;
  subSkuSafe: string;
}

export const OrdersHistoryTable: React.FC<OrdersHistoryTableProps> = ({
  loadingHistory,
  orderGroups,
  exportOrderExcel,
  subSkuSafe
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-4 py-3">Mã Lệnh</th>
              <th className="px-4 py-3">Ngày giờ Lệnh</th>
              <th className="px-4 py-3">Thao tác</th>
              <th className="px-4 py-3 text-center">Số lượng cuộn</th>
              <th className="px-4 py-3 text-right">Tải về</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadingHistory ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Đang tải...</td></tr>
            ) : orderGroups.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">Không có dữ liệu lệnh</td></tr>
            ) : (
              orderGroups.map(order => (
                <tr key={order.orderCode} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{order.orderCode}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{new Date(order.timestamp).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-bold">{order.action}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-black text-indigo-600 text-sm">{order.count}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => exportOrderExcel(order.orderCode, order.logs, subSkuSafe)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-bold transition-colors">
                      <Download className="w-3.5 h-3.5" /> Excel Lệnh này
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
