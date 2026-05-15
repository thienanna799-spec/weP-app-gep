import { RefreshCw, ChevronRight, Package } from 'lucide-react';
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from '../page';
import type { PurchaseOrder } from '../services/procurement.service';

interface Props {
  orders: PurchaseOrder[];
  loading: boolean;
  onSelect: (po: PurchaseOrder) => void;
  onAction: (action: string, poId: string, extra?: any) => void;
  onRefresh: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export default function PurchaseOrderTable({ orders, loading, onSelect, onAction, onRefresh }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-400">Chưa có đơn mua hàng</h3>
        <p className="text-sm text-gray-400 mt-1">Nhấn "Tạo đơn mua" để bắt đầu</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 font-medium">{orders.length} đơn mua hàng</p>
        <button onClick={onRefresh} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Mã PO</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Nhà cung cấp</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Tổng tiền</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Trạng thái</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Ngày tạo</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map(po => (
              <tr key={po.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => onSelect(po)}>
                <td className="px-4 py-3">
                  <span className="font-bold text-gray-900">{po.code}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-700">{po.supplier?.name || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-900">{fmt(po.totalAmount)}đ</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${PO_STATUS_COLORS[po.status] || 'bg-gray-100'}`}>
                    {PO_STATUS_LABELS[po.status] || po.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(po.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {po.status === 'draft' && (
                      <>
                        <button onClick={() => onAction('submit', po.id)} className="px-2.5 py-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">
                          Gửi duyệt
                        </button>
                        <button onClick={() => onAction('approve', po.id)} className="px-2.5 py-1 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                          Duyệt
                        </button>
                      </>
                    )}
                    {po.status === 'pending_approval' && (
                      <button onClick={() => onAction('approve', po.id)} className="px-2.5 py-1 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                        Duyệt
                      </button>
                    )}
                    {po.status === 'approved' && (
                      <button onClick={() => onAction('order', po.id)} className="px-2.5 py-1 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
                        Đặt hàng
                      </button>
                    )}
                    <ChevronRight size={14} className="text-gray-300 ml-1" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
