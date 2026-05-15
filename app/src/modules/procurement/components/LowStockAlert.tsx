import { RefreshCw, AlertTriangle, Plus, Package } from 'lucide-react';
import type { LowStockMaterial } from '../services/procurement.service';

interface Props {
  items: LowStockMaterial[];
  loading: boolean;
  onSuggestPO: (materialId: string) => void;
  onRefresh: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export default function LowStockAlert({ items, loading, onSuggestPO, onRefresh }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package size={24} className="text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-green-600">Tồn kho ổn định</h3>
        <p className="text-sm text-gray-400 mt-1">Không có nguyên vật liệu nào dưới mức tối thiểu</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <p className="text-sm font-bold text-amber-700">{items.length} vật tư cần bổ sung</p>
        </div>
        <button onClick={onRefresh} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-amber-50 text-left">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">Mã</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">Tên vật tư</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">Nhóm</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-amber-700 text-right">Tồn hiện tại</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-amber-700 text-right">Mức tối thiểu</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-amber-700 text-right">Giá mua</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">NCC</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-amber-700"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => {
              const pct = item.minStock > 0 ? Math.round((item.currentStock / item.minStock) * 100) : 0;
              const isOut = item.currentStock <= 0;
              return (
                <tr key={item.id} className={isOut ? 'bg-red-50/50' : 'hover:bg-gray-50/50'}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.group || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${isOut ? 'text-red-600' : 'text-orange-600'}`}>
                      {fmt(item.currentStock)} {item.unit}
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className={`h-1.5 rounded-full transition-all ${isOut ? 'bg-red-500' : 'bg-orange-400'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{fmt(item.minStock)} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt(item.purchasePrice)}đ</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.supplier || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => onSuggestPO(item.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap">
                      <Plus size={10} /> Tạo PO
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
