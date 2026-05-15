import { RefreshCw, Edit2, Trash2, Star, Phone, Mail, MapPin } from 'lucide-react';
import type { Supplier } from '../services/procurement.service';

interface Props {
  suppliers: Supplier[];
  loading: boolean;
  onEdit: (s: Supplier) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export default function SupplierTable({ suppliers, loading, onEdit, onDelete, onRefresh }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-400">Chưa có nhà cung cấp</h3>
        <p className="text-sm text-gray-400 mt-1">Nhấn "Thêm NCC" để tạo mới</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 font-medium">{suppliers.length} nhà cung cấp</p>
        <button onClick={onRefresh} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.code}</p>
                <h3 className="text-base font-bold text-gray-900 truncate mt-0.5">{s.name}</h3>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => onDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-sm text-gray-500">
              {s.contactPerson && (
                <p className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">{s.contactPerson}</span>
                </p>
              )}
              {s.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={12} className="text-gray-400" /> {s.phone}
                </p>
              )}
              {s.email && (
                <p className="flex items-center gap-2">
                  <Mail size={12} className="text-gray-400" /> <span className="truncate">{s.email}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className={i < (s.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.isActive ? 'Hoạt động' : 'Ngừng'}
                </span>
                {s._count?.purchaseOrders !== undefined && (
                  <span className="text-[10px] text-gray-400 font-medium">{s._count.purchaseOrders} PO</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
