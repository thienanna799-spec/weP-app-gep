/**
 * FinancePayableTab — Accounts payable (Công nợ phải trả NCC)
 * Shows outstanding POs grouped by supplier.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ShoppingBag, Package } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { formatCurrency } from '../../../utils/format';
import { financeService } from '../services/finance.service';
import type { Payable } from '../services/finance.service';

const STATUS_LABELS: Record<string, string> = {
  ordered: 'Đã đặt hàng',
  partially_received: 'Nhận 1 phần',
  received: 'Đã nhận đủ',
};
const STATUS_COLORS: Record<string, string> = {
  ordered: 'bg-purple-100 text-purple-700',
  partially_received: 'bg-orange-100 text-orange-700',
  received: 'bg-green-100 text-green-700',
};

const FinancePayableTab: React.FC = () => {
  const [orders, setOrders] = useState<Payable[]>([]);
  const [totalPayable, setTotalPayable] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    financeService.getPayables()
      .then(data => { setOrders(data.orders || []); setTotalPayable(data.totalPayable || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Group by supplier
  const bySupplier = useMemo(() => {
    const map: Record<string, { name: string; code: string; orders: Payable[]; total: number }> = {};
    orders.forEach(o => {
      const key = o.supplier?.id || 'unknown';
      if (!map[key]) map[key] = { name: o.supplier?.name || 'Không rõ', code: o.supplier?.code || '', orders: [], total: 0 };
      map[key].orders.push(o);
      if (['ordered', 'partially_received'].includes(o.status)) map[key].total += o.totalAmount;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [orders]);

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center" style={{ borderTop: '4px solid #8b5cf6' }}>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng phải trả</p>
          <p className="text-xl font-black text-purple-600 mt-1">{formatCurrency(totalPayable)}</p>
        </Card>
        <Card className="p-4 text-center" style={{ borderTop: '4px solid #f59e0b' }}>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Đơn mua chưa TT</p>
          <p className="text-xl font-black text-amber-600 mt-1">{orders.filter(o => ['ordered', 'partially_received'].includes(o.status)).length}</p>
        </Card>
        <Card className="p-4 text-center" style={{ borderTop: '4px solid #22c55e' }}>
          <p className="text-[10px] font-bold text-gray-400 uppercase">NCC</p>
          <p className="text-xl font-black text-green-600 mt-1">{bySupplier.length}</p>
        </Card>
      </div>

      {/* By Supplier */}
      {bySupplier.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingBag size={24} className="text-green-400" />
          </div>
          <p className="font-bold text-green-600">Không có công nợ phải trả</p>
          <p className="text-sm text-gray-400 mt-1">Chưa có PO nào cần thanh toán</p>
        </Card>
      ) : bySupplier.map(supplier => (
        <Card key={supplier.code} className="overflow-hidden">
          <div className="p-4 bg-purple-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                <Package size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{supplier.name}</p>
                <p className="text-xs text-gray-500">{supplier.code} · {supplier.orders.length} đơn mua</p>
              </div>
            </div>
            <p className="text-lg font-black text-purple-700">{formatCurrency(supplier.total)}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-left">Mã PO</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-right">Tổng tiền</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {supplier.orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-bold text-gray-900">{o.code}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(o.totalAmount)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}

      <div className="flex justify-end">
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <RefreshCw size={12} /> Làm mới
        </button>
      </div>
    </div>
  );
};

export default FinancePayableTab;
